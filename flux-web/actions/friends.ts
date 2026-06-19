'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFriendRequestEmail, sendFriendAcceptedEmail } from '@/lib/email'
import { notify } from '@/lib/notify'
import type { PublicProfile } from '@/lib/types'

// ── Username ──────────────────────────────────────────────────────────────────

export async function setUsername(username: string, displayName?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const clean = username.toLowerCase().trim()
  if (!/^[a-z0-9_.\-]{3,20}$/.test(clean)) {
    return { error: 'Solo letras, números, guion bajo, punto y guion. Entre 3 y 20 caracteres.' }
  }

  const patch: Record<string, string> = { username: clean }
  if (displayName?.trim()) patch.full_name = displayName.trim()

  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'Ese nombre de usuario ya está en uso' }
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/home')
  return { error: null }
}

export async function updatePhone(phone: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('profiles')
    .update({ phone: phone.trim() || null })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { error: null }
}

export async function checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
  const supabase = await createClient()
  const clean = username.toLowerCase().trim()
  if (!/^[a-z0-9_.\-]{3,20}$/.test(clean)) return { available: false }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', clean)
    .maybeSingle()

  return { available: !data }
}

// ── My accepted friends ────────────────────────────────────────────────────────

export async function getMyFriends(): Promise<{ friends: PublicProfile[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { friends: [] }

  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (!friendships?.length) return { friends: [] }

  const friendIds = friendships.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .in('id', friendIds)

  return { friends: (profiles ?? []) as PublicProfile[] }
}

// ── Friend search ─────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<{ results: PublicProfile[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { results: [], error: 'No autorizado' }

  const clean = query.replace(/^@/, '').toLowerCase().trim()
  if (clean.length < 2) return { results: [], error: null }

  const { data, error } = await supabase.rpc('search_users_by_username', { query: clean })
  if (error) return { results: [], error: error.message }

  return { results: (data ?? []) as PublicProfile[], error: null }
}

// ── Friend requests ───────────────────────────────────────────────────────────

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Check existing friendship in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'accepted') return { error: 'Ya son amigos' }
    if (existing.status === 'pending') return { error: 'Solicitud ya enviada' }
    // declined → allow re-send by deleting old record
    await supabase.from('friendships').delete().eq('id', existing.id)
  }

  const { data: newFriendship, error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: 'pending',
  }).select('id').single()
  if (error) return { error: error.message }

  // Create in-app notification for addressee (admin client bypasses RLS)
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  const admin = createAdminClient()

  // Fetch addressee profile (for email + auto-link)
  const { data: addresseeProfile } = await (admin.from('profiles') as any)
    .select('email, full_name, username')
    .eq('id', addresseeId)
    .single() as { data: { email: string | null; full_name: string | null; username: string | null } | null }

  await notify({
    userId: addresseeId,
    type: 'friend_request',
    data: {
      from_user_id: user.id,
      from_username: myProfile?.username ?? '',
      from_name: myProfile?.full_name ?? '',
      friendship_id: newFriendship?.id ?? '',
    },
    to: addresseeProfile?.email,
    email: addresseeProfile?.email
      ? () => sendFriendRequestEmail({
          to: addresseeProfile.email!,
          toName: addresseeProfile.full_name ?? '',
          fromName: myProfile?.full_name ?? myProfile?.username ?? 'Alguien',
          fromUsername: myProfile?.username ?? '',
        })
      : undefined,
  })

  // Auto-link: ensure addressee (B) exists in sender's (A) people table on send
  const bName = addresseeProfile?.full_name ?? `@${addresseeProfile?.username ?? 'amigo'}`
  const { data: linkedInA } = await supabase
    .from('people').select('id').eq('user_id', user.id).eq('linked_user_id', addresseeId).maybeSingle()
  if (!linkedInA) {
    try {
      await supabase.from('people').insert({
        id: `PER-FRD-${Date.now()}-${addresseeId.slice(0, 6)}`,
        user_id: user.id, name: bName, linked_user_id: addresseeId, is_me: false,
      })
    } catch { /* ignore */ }
  }

  revalidatePath('/friends')
  revalidatePath('/settings')
  return { error: null }
}

export async function respondFriendRequest(friendshipId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: friendship, error: fetchErr } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)
    .single()

  if (fetchErr || !friendship) return { error: 'Solicitud no encontrada' }
  if (friendship.status !== 'pending') return { error: 'Esta solicitud ya fue respondida' }

  const newStatus = accept ? 'accepted' : 'declined'
  const { error } = await supabase
    .from('friendships')
    .update({ status: newStatus })
    .eq('id', friendshipId)

  if (error) return { error: error.message }

  // Notify requester
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  const notifType = accept ? 'friend_accepted' : 'friend_declined'
  const admin = createAdminClient()
  const { data: requesterProfile } = await (admin.from('profiles') as any)
    .select('email, full_name, username')
    .eq('id', friendship.requester_id)
    .single() as { data: { email: string | null; full_name: string | null; username: string | null } | null }

  await notify({
    userId: friendship.requester_id,
    type: notifType,
    data: {
      from_user_id: user.id,
      from_username: myProfile?.username ?? '',
      from_name: myProfile?.full_name ?? '',
    },
    to: accept ? requesterProfile?.email : undefined,
    email: accept && requesterProfile?.email
      ? () => sendFriendAcceptedEmail({
          to: requesterProfile.email!,
          toName: requesterProfile.full_name ?? '',
          acceptedByName: myProfile?.full_name ?? myProfile?.username ?? 'Alguien',
          acceptedByUsername: myProfile?.username ?? '',
        })
      : undefined,
  })

  // Mark the friend_request notification as read for current user
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('type', 'friend_request')
    .contains('data', { from_user_id: friendship.requester_id })

  revalidatePath('/friends')
  revalidatePath('/shared')
  return { error: null }
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (error) return { error: error.message }
  revalidatePath('/friends')
  return { error: null }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function markNotificationsRead(ids?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)

  if (ids?.length) query.in('id', ids)

  const { error } = await query
  if (error) return { error: error.message }

  revalidatePath('/notifications')
  return { error: null }
}

// ── Link local contact → registered user ─────────────────────────────────────

export async function linkPersonToUser(personId: string, linkedUserId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Delete any auto-created duplicate that was already linked to this user
  if (linkedUserId) {
    await supabase
      .from('people')
      .delete()
      .eq('user_id', user.id)
      .eq('linked_user_id', linkedUserId)
      .neq('id', personId)
  }

  const { error } = await supabase
    .from('people')
    .update({ linked_user_id: linkedUserId })
    .eq('id', personId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Sync full shared expense history to the newly linked user
  if (linkedUserId) {
    syncHistoricalSharedExpenses(user.id, personId, linkedUserId).catch(console.error)
  }

  revalidatePath('/shared')
  revalidatePath('/settings')
  return { error: null }
}

// ── Historical shared expense sync ────────────────────────────────────────────
// Called after linking a contact to a registered user.
// Pending transactions → send shared_expense_invite so B can acknowledge.
// Settled transactions → auto-create a settled IOWE record on B's side.
async function syncHistoricalSharedExpenses(
  userId: string,
  personId: string,
  linkedUserId: string
) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Fetch all of A's transactions where personId is a THEY/DIV participant
  const { data: allTxs } = await supabase
    .from('transactions')
    .select('id, concept, amount, transaction_date, category_id, split_data')
    .eq('user_id', userId)
    .not('split_data', 'is', null)
    .order('transaction_date', { ascending: false })

  type SplitEntry = { id: string; nombre: string; value: number; paidStatus: boolean; paidAmount: number }
  type SD = { splitMode: string; data: SplitEntry[] }

  const relevantTxs = (allTxs ?? []).filter(tx => {
    const sd = tx.split_data as SD | null
    return (sd?.splitMode === 'THEY' || sd?.splitMode === 'DIV') &&
      sd?.data.some((p: SplitEntry) => p.id === personId)
  })

  if (relevantTxs.length === 0) return

  // Load profiles
  const { data: myProfile } = await supabase
    .from('profiles').select('username, full_name').eq('id', userId).single()
  const creatorName = myProfile?.full_name ?? myProfile?.username ?? 'Amigo'

  // Ensure creator (A) exists as a person record in B's people table
  const { data: existingCreatorPerson } = await (admin.from('people') as any)
    .select('id, name')
    .eq('user_id', linkedUserId)
    .eq('linked_user_id', userId)
    .maybeSingle()

  let creatorPersonId: string | null = existingCreatorPerson?.id ?? null
  if (!creatorPersonId) {
    const newId = `PER-HIST-${Date.now()}`
    const { error: personErr } = await (admin.from('people') as any).insert({
      id: newId,
      user_id: linkedUserId,
      name: creatorName,
      linked_user_id: userId,
      is_me: false,
    })
    if (!personErr) creatorPersonId = newId
  }

  // Fetch B's existing transactions to avoid duplicate creation
  const { data: bTxs } = await (admin.from('transactions') as any)
    .select('split_data')
    .eq('user_id', linkedUserId)
    .not('split_data', 'is', null)

  const alreadyLinkedIds = new Set<string>(
    (bTxs ?? [])
      .map((t: { split_data: { linked_tx_id?: string } }) => t.split_data?.linked_tx_id)
      .filter(Boolean)
  )

  // Also fetch B's existing invite notifications to avoid duplicates
  const { data: existingNotifs } = await (admin.from('notifications') as any)
    .select('data')
    .eq('user_id', linkedUserId)
    .eq('type', 'shared_expense_invite')

  const alreadyNotifiedTxIds = new Set<string>(
    (existingNotifs ?? [])
      .map((n: { data: { transaction_id?: string } }) => n.data?.transaction_id)
      .filter(Boolean)
  )

  for (const tx of relevantTxs) {
    const sd = tx.split_data as SD
    const participant = sd.data.find((p: SplitEntry) => p.id === personId)
    if (!participant) continue

    if (!participant.paidStatus) {
      // Pending: send invite notification so B can acknowledge the debt
      if (!alreadyNotifiedTxIds.has(tx.id)) {
        await (admin.from('notifications') as any).insert({
          user_id: linkedUserId,
          type: 'shared_expense_invite',
          data: {
            transaction_id: tx.id,
            from_user_id: userId,
            from_username: myProfile?.username ?? '',
            from_name: myProfile?.full_name ?? '',
            concept: tx.concept,
            total_amount: Number(tx.amount),
            participant_amount: participant.value,
            participant_person_id: personId,
            category_id: tx.category_id || null,
          },
        })
      }
    } else if (!alreadyLinkedIds.has(tx.id) && creatorPersonId) {
      // Settled: auto-create a resolved IOWE transaction on B's side
      const splitDataForB = {
        mode: 'AMT',
        splitMode: 'IOWE',
        linked_tx_id: tx.id,
        linked_participant_id: personId,
        data: [{
          id: creatorPersonId,
          nombre: creatorName,
          value: participant.value,
          paidAmount: participant.value,
          paidStatus: true,
        }],
      }
      await (admin.from('transactions') as any).insert({
        user_id: linkedUserId,
        concept: tx.concept,
        type: 'TR-GASTO',
        amount: participant.value,
        adjustment: 0,
        category_id: tx.category_id && String(tx.category_id).startsWith('CAT-DEF-') ? tx.category_id : null,
        account_id: null,
        transaction_date: tx.transaction_date,
        is_validated: true,
        split_data: splitDataForB,
      })
    }
  }
}

// ── People (unlinked) ────────────────────────────────────────────────────────

export async function getMyPeopleUnlinked(): Promise<{ people: { id: string; name: string }[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { people: [] }
  const { data } = await supabase
    .from('people')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_me', false)
    .is('linked_user_id', null)
    .order('name')
  return { people: (data ?? []) as { id: string; name: string }[] }
}

export async function createLinkedPerson(name: string, linkedUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const suffix = Math.random().toString(36).slice(2, 10).toUpperCase()
  const { error } = await supabase.from('people').insert({
    id: `PER-FRD-${suffix}`,
    user_id: user.id,
    name: name.trim(),
    linked_user_id: linkedUserId,
    is_me: false,
  })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { error: null }
}

// ── Delete notifications ──────────────────────────────────────────────────────

export async function deleteNotification(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function clearAllNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)
  if (error) return { error: error.message }
  return { error: null }
}

// ── Invite non-registered user by email ──────────────────────────────────────

export async function sendAppInvite(email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .single()

  const { sendAppInviteEmail } = await import('@/lib/email')
  await sendAppInviteEmail({
    to: email,
    fromName: myProfile?.full_name ?? myProfile?.username ?? 'Un amigo',
    signupUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://flux.nevura.app'}/login`,
  }).catch(console.error)

  return { error: null }
}
