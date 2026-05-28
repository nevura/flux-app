'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFriendRequestEmail, sendFriendAcceptedEmail } from '@/lib/email'
import type { PublicProfile, Friendship, Notification } from '@/lib/types'

// ── Username ──────────────────────────────────────────────────────────────────

export async function setUsername(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const clean = username.toLowerCase().trim()
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    return { error: 'Solo letras minúsculas, números y guion bajo. Entre 3 y 20 caracteres.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: clean })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'Ese nombre de usuario ya está en uso' }
    return { error: error.message }
  }

  revalidatePath('/settings')
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
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) return { available: false }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', clean)
    .maybeSingle()

  return { available: !data }
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

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: 'pending',
  })
  if (error) return { error: error.message }

  // Create in-app notification for addressee
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  await supabase.from('notifications').insert({
    user_id: addresseeId,
    type: 'friend_request',
    data: {
      from_user_id: user.id,
      from_username: myProfile?.username ?? '',
      from_name: myProfile?.full_name ?? '',
    },
  })

  // Send email notification (best-effort)
  const admin = createAdminClient()
  const { data: addresseeProfile } = await (admin.from('profiles') as any)
    .select('email, full_name')
    .eq('id', addresseeId)
    .single() as { data: { email: string | null; full_name: string | null } | null }

  if (addresseeProfile?.email) {
    await sendFriendRequestEmail({
      to: addresseeProfile.email,
      toName: addresseeProfile.full_name ?? '',
      fromName: myProfile?.full_name ?? myProfile?.username ?? 'Alguien',
      fromUsername: myProfile?.username ?? '',
    }).catch(console.error)
  }

  revalidatePath('/friends')
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
  await supabase.from('notifications').insert({
    user_id: friendship.requester_id,
    type: notifType,
    data: {
      from_user_id: user.id,
      from_username: myProfile?.username ?? '',
      from_name: myProfile?.full_name ?? '',
    },
  })

  if (accept) {
    const admin = createAdminClient()
    const { data: requesterProfile } = await (admin.from('profiles') as any)
      .select('email, full_name')
      .eq('id', friendship.requester_id)
      .single() as { data: { email: string | null; full_name: string | null } | null }

    if (requesterProfile?.email) {
      await sendFriendAcceptedEmail({
        to: requesterProfile.email,
        toName: requesterProfile.full_name ?? '',
        acceptedByName: myProfile?.full_name ?? myProfile?.username ?? 'Alguien',
        acceptedByUsername: myProfile?.username ?? '',
      }).catch(console.error)
    }
  }

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

  const { error } = await supabase
    .from('people')
    .update({ linked_user_id: linkedUserId })
    .eq('id', personId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/shared')
  revalidatePath('/settings')
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
