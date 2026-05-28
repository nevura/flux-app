'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adjustmentFor, parseAmount, getMexicoNow } from '@/lib/utils'
import type { TransactionForm, SplitParticipant, AccountWithBalance, Category, Person } from '@/lib/types'

// Sends expense_settled_confirm notification to a person if they have a linked Flux user
async function notifyLinkedPersonSettled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personId: string,
  myUserId: string,
  concept: string,
  amount: number,
  isTheyOwe: boolean
) {
  const { data: person } = await supabase
    .from('people').select('linked_user_id').eq('id', personId).eq('user_id', myUserId).maybeSingle()
  if (!person?.linked_user_id) return
  const { data: myProfile } = await supabase
    .from('profiles').select('username, full_name').eq('id', myUserId).single()
  const admin = createAdminClient()
  await (admin.from('notifications') as any).insert({
    user_id: person.linked_user_id,
    type: 'expense_settled_confirm',
    data: { from_user_id: myUserId, from_username: myProfile?.username ?? '', from_name: myProfile?.full_name ?? '', concept, amount, is_they_owe: isTheyOwe },
  }).catch(() => {})
}

export async function getTransactionModalData(): Promise<{ accounts: AccountWithBalance[]; categories: Category[]; people: Person[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { accounts: [], categories: [], people: [] }

  const [{ data: accounts }, { data: allCategories }, { data: people }, { data: transactions }] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true).order('sort_order'),
    supabase.from('categories').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('sort_order'),
    supabase.from('people').select('*').eq('user_id', user.id),
    supabase.from('transactions').select('account_id, amount').eq('user_id', user.id),
  ])

  const accountsWithBalance = (accounts ?? []).map(a => ({
    ...a,
    balance: (transactions ?? []).filter(t => t.account_id === a.id).reduce((s, t) => s + (t.amount ?? 0), 0),
  })) as AccountWithBalance[]

  return { accounts: accountsWithBalance, categories: (allCategories ?? []) as Category[], people: (people ?? []) as Person[] }
}

export async function addTransaction(form: TransactionForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const amount = parseAmount(form.amount)
  const date   = form.transaction_date || getMexicoNow()

  if (form.type === 'TR-TRANSFER') {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id, concept: form.concept,
      type: 'TR-TRANSFER', amount, adjustment: -amount,
      category_id: null, account_id: form.account_id,
      destination_account_id: form.destination_account_id!,
      transaction_date: date, is_validated: true,
      scheduled_id: form.scheduled_id || null,
    })
    if (error) return { error: error.message }
  } else {
    const { data: newTx, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      concept: form.concept,
      type: form.type,
      amount,
      adjustment: adjustmentFor(form.type, amount),
      category_id: form.category_id || null,
      account_id: form.account_id,
      transaction_date: date,
      is_validated: true,
      scheduled_id: form.scheduled_id || null,
      split_data: form.split_data || null,
      exclude_from_budget: form.exclude_from_budget ?? false,
      notes: form.notes || null,
    }).select('id').single()
    if (error) return { error: error.message }

    // Send shared expense invites to linked friends
    if (newTx && form.split_data?.data && (form.split_data.splitMode === 'THEY' || form.split_data.splitMode === 'DIV')) {
      const participantIds = form.split_data.data.filter(p => p.id !== 'PER-YO').map(p => p.id)
      if (participantIds.length > 0) {
        const { data: linkedPeople } = await supabase
          .from('people').select('id, linked_user_id')
          .in('id', participantIds).not('linked_user_id', 'is', null)
        if (linkedPeople?.length) {
          const { data: myProfile } = await supabase
            .from('profiles').select('username, full_name').eq('id', user.id).single()
          const admin = createAdminClient()
          const invitedNames: string[] = []

          for (const lp of linkedPeople) {
            const participant = form.split_data!.data.find(p => p.id === lp.id)
            if (!participant) continue
            invitedNames.push(participant.nombre)
            await (admin.from('notifications') as any).insert({
              user_id: lp.linked_user_id,
              type: 'shared_expense_invite',
              data: {
                transaction_id: newTx.id,
                from_user_id: user.id,
                from_username: myProfile?.username ?? '',
                from_name: myProfile?.full_name ?? '',
                concept: form.concept,
                total_amount: amount,
                participant_amount: participant.value,
                participant_person_id: lp.id,
                category_id: form.category_id || null,
              },
            })
          }

          // Notify creator that invites were sent
          if (invitedNames.length > 0) {
            await supabase.from('notifications').insert({
              user_id: user.id,
              type: 'shared_expense_sent',
              data: {
                concept: form.concept,
                total_amount: amount,
                invited_names: invitedNames,
              },
            })
          }
        }
      }
    }
  }

  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function updateTransaction(id: string, form: TransactionForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const amount = parseAmount(form.amount)
  const date   = form.transaction_date || getMexicoNow()

  if (form.type === 'TR-TRANSFER') {
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    return addTransaction(form)
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      concept: form.concept, type: form.type,
      amount, adjustment: adjustmentFor(form.type, amount),
      category_id: form.category_id || null,
      account_id: form.account_id,
      transaction_date: date,
      split_data: form.split_data || null,
      exclude_from_budget: form.exclude_from_budget ?? false,
      notes: form.notes || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function confirmTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('transactions')
    .update({ is_validated: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function settleParticipant(txId: string, participantId: string, notify = true) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', txId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !tx) return { error: 'Transacción no encontrada' }

  const sd = tx.split_data
  if (!sd || !Array.isArray(sd.data)) return { error: 'Datos de desglose inválidos' }

  const participant = (sd.data as SplitParticipant[]).find(p => p.id === participantId)
  const newData = (sd.data as SplitParticipant[]).map(p =>
    p.id === participantId ? { ...p, paidStatus: true, paidAmount: p.value } : p
  )

  const { error } = await supabase
    .from('transactions')
    .update({ split_data: { ...sd, data: newData } })
    .eq('id', txId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (notify && participant) {
    const isTheyOwe = sd.splitMode === 'THEY' || sd.splitMode === 'DIV'
    await notifyLinkedPersonSettled(supabase, participantId, user.id, tx.concept, participant.value, isTheyOwe)
  }

  revalidatePath('/shared')
  revalidatePath('/home')
  return { error: null }
}

export async function partialSettle(txId: string, participantId: string, amount: number, accountId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: tx, error: fetchErr } = await supabase
    .from('transactions').select('*')
    .eq('id', txId).eq('user_id', user.id).single()
  if (fetchErr || !tx) return { error: 'Transacción no encontrada' }

  const sd = tx.split_data
  if (!sd || !Array.isArray(sd.data)) return { error: 'Datos de desglose inválidos' }

  const newData = (sd.data as SplitParticipant[]).map(p => {
    if (p.id !== participantId) return p
    const newPaid = (p.paidAmount ?? 0) + amount
    return { ...p, paidAmount: newPaid, paidStatus: newPaid >= p.value }
  })

  const { error } = await supabase.from('transactions')
    .update({ split_data: { ...sd, data: newData } })
    .eq('id', txId).eq('user_id', user.id)
  if (error) return { error: error.message }

  const isTheyOwePartial = sd.splitMode === 'THEY' || sd.splitMode === 'DIV'
  await notifyLinkedPersonSettled(supabase, participantId, user.id, tx.concept, amount, isTheyOwePartial)

  if (accountId) {
    const isTheyOwe = isTheyOwePartial
    const txType = isTheyOwe ? 'TR-INGRESO' : 'TR-GASTO'
    await supabase.from('transactions').insert({
      user_id: user.id,
      concept: `${isTheyOwe ? 'Abono cobrado' : 'Abono pagado'}: ${tx.concept}`,
      type: txType,
      amount,
      adjustment: adjustmentFor(txType, amount),
      category_id: tx.category_id,
      account_id: accountId,
      transaction_date: getMexicoNow().slice(0, 10),
      is_validated: true,
    })
    revalidatePath('/transactions')
  }

  revalidatePath('/shared')
  revalidatePath('/home')
  return { error: null }
}

export async function settleAndRecord(txId: string, participantId: string, accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: tx, error: fetchErr } = await supabase
    .from('transactions').select('*').eq('id', txId).eq('user_id', user.id).single()
  if (fetchErr || !tx) return { error: 'Transacción no encontrada' }

  const sd = tx.split_data
  if (!sd || !Array.isArray(sd.data)) return { error: 'Datos de desglose inválidos' }

  const participant = (sd.data as SplitParticipant[]).find(p => p.id === participantId)
  if (!participant) return { error: 'Participante no encontrado' }
  const unpaid = participant.value - (participant.paidAmount ?? 0)
  if (unpaid <= 0) return { error: 'Sin saldo pendiente' }

  const isTheyOwe = sd.splitMode === 'THEY'
  const txType = isTheyOwe ? 'TR-INGRESO' : 'TR-GASTO'

  const { error: txCreateErr } = await supabase.from('transactions').insert({
    user_id: user.id,
    concept: `${isTheyOwe ? 'Cobro' : 'Pago'}: ${tx.concept}`,
    type: txType,
    amount: unpaid,
    adjustment: adjustmentFor(txType, unpaid),
    category_id: tx.category_id,
    account_id: accountId,
    transaction_date: getMexicoNow().slice(0, 10),
    is_validated: true,
  })
  if (txCreateErr) return { error: txCreateErr.message }

  const newData = (sd.data as SplitParticipant[]).map(p =>
    p.id === participantId ? { ...p, paidStatus: true, paidAmount: p.value } : p
  )
  const { error } = await supabase
    .from('transactions').update({ split_data: { ...sd, data: newData } })
    .eq('id', txId).eq('user_id', user.id)
  if (error) return { error: error.message }

  await notifyLinkedPersonSettled(supabase, participantId, user.id, tx.concept, unpaid, isTheyOwe)

  revalidatePath('/shared')
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function abonoGlobalForPerson(personId: string, personName: string, amount: number, accountId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  if (amount <= 0) return { error: 'Monto inválido' }

  const { data: txs, error: fetchErr } = await supabase
    .from('transactions').select('*').eq('user_id', user.id).not('split_data', 'is', null)
    .order('transaction_date', { ascending: true })
  if (fetchErr) return { error: fetchErr.message }

  // Collect pending items for this person (THEY-owe-me direction only — they're paying me)
  // Also handle IOWE direction (I'm paying them)
  const pending: Array<{ txId: string; participantId: string; unpaid: number; sd: object }> = []
  for (const tx of txs ?? []) {
    const sd = tx.split_data
    if (!sd || !Array.isArray(sd.data)) continue
    const p = (sd.data as SplitParticipant[]).find(p => p.id === personId)
    if (!p || p.paidStatus) continue
    const unpaid = p.value - (p.paidAmount ?? 0)
    if (unpaid <= 0.005) continue
    pending.push({ txId: tx.id, participantId: personId, unpaid, sd })
  }

  if (pending.length === 0) return { error: 'Sin saldos pendientes' }

  // FIFO: apply amount across transactions from oldest to newest
  let remaining = amount
  for (const item of pending) {
    if (remaining <= 0.005) break
    const apply = Math.min(remaining, item.unpaid)
    remaining -= apply
    const newPaid = (item.unpaid - apply <= 0.005)
    const sd = item.sd as { data: SplitParticipant[]; splitMode: string; mode: string }
    const newData = sd.data.map(p =>
      p.id === personId
        ? { ...p, paidAmount: (p.paidAmount ?? 0) + apply, paidStatus: newPaid }
        : p
    )
    const { error } = await supabase
      .from('transactions').update({ split_data: { ...sd, data: newData } })
      .eq('id', item.txId).eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  if (accountId) {
    await supabase.from('transactions').insert({
      user_id: user.id,
      concept: `Abono global: ${personName}`,
      type: 'TR-INGRESO',
      amount,
      adjustment: adjustmentFor('TR-INGRESO', amount),
      account_id: accountId,
      transaction_date: getMexicoNow().slice(0, 10),
      is_validated: true,
    })
  }

  revalidatePath('/shared')
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function settleAllForPerson(personId: string, personName: string, accountId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: txs, error: fetchErr } = await supabase
    .from('transactions').select('*').eq('user_id', user.id).not('split_data', 'is', null)
  if (fetchErr) return { error: fetchErr.message }

  let totalTheyOwe = 0
  let totalIOwe = 0
  const updates: Array<{ id: string; split_data: object }> = []

  for (const tx of txs ?? []) {
    const sd = tx.split_data
    if (!sd || !Array.isArray(sd.data)) continue
    const participant = (sd.data as SplitParticipant[]).find(p => p.id === personId)
    if (!participant || participant.paidStatus) continue
    const unpaid = participant.value - (participant.paidAmount ?? 0)
    if (unpaid <= 0.005) continue

    const isTheyOwe = sd.splitMode === 'THEY' || sd.splitMode === 'DIV'
    if (isTheyOwe) totalTheyOwe += unpaid
    else totalIOwe += unpaid

    const newData = (sd.data as SplitParticipant[]).map(p =>
      p.id === personId ? { ...p, paidStatus: true, paidAmount: p.value } : p
    )
    updates.push({ id: tx.id, split_data: { ...sd, data: newData } })
  }

  if (updates.length === 0) return { error: 'Sin saldos pendientes' }

  for (const u of updates) {
    const { error } = await supabase
      .from('transactions').update({ split_data: u.split_data }).eq('id', u.id).eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  if (accountId) {
    const today = getMexicoNow().slice(0, 10)
    if (totalTheyOwe > 0.005) {
      await supabase.from('transactions').insert({
        user_id: user.id,
        concept: `Cobro global: ${personName}`,
        type: 'TR-INGRESO',
        amount: totalTheyOwe,
        adjustment: adjustmentFor('TR-INGRESO', totalTheyOwe),
        account_id: accountId,
        transaction_date: today,
        is_validated: true,
      })
    }
    if (totalIOwe > 0.005) {
      await supabase.from('transactions').insert({
        user_id: user.id,
        concept: `Pago global: ${personName}`,
        type: 'TR-GASTO',
        amount: totalIOwe,
        adjustment: adjustmentFor('TR-GASTO', totalIOwe),
        account_id: accountId,
        transaction_date: today,
        is_validated: true,
      })
    }
  }

  const totalSettled = totalTheyOwe + totalIOwe
  if (totalSettled > 0.005) {
    await notifyLinkedPersonSettled(supabase, personId, user.id, `Saldo total con ${personName}`, totalSettled, totalTheyOwe >= totalIOwe)
  }

  revalidatePath('/shared')
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function confirmSettledExpense(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: notif } = await supabase
    .from('notifications').select('*').eq('id', notificationId).eq('user_id', user.id).single()

  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)

  if (notif) {
    const d = notif.data as Record<string, unknown>
    const { data: myProfile } = await supabase.from('profiles').select('username, full_name').eq('id', user.id).single()
    const admin = createAdminClient()
    await (admin.from('notifications') as any).insert({
      user_id: String(d.from_user_id),
      type: 'expense_settled',
      data: {
        from_user_id: user.id,
        from_username: myProfile?.username ?? '',
        from_name: myProfile?.full_name ?? '',
        concept: String(d.concept),
        amount: Number(d.amount),
      },
    }).catch(() => {})
  }

  return { error: null }
}

export async function fetchSharedTransactions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [] }

  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .not('split_data', 'is', null)
    .order('transaction_date', { ascending: false })

  return { data: data ?? [] }
}

export async function searchAllTransactions(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [] }

  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .ilike('concept', `%${query}%`)
    .order('transaction_date', { ascending: false })
    .limit(300)

  return { data: data ?? [] }
}

export async function acceptSharedExpense(notificationId: string, accountId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: notif } = await supabase
    .from('notifications').select('*').eq('id', notificationId).eq('user_id', user.id).single()
  if (!notif) return { error: 'Notificación no encontrada' }

  const d = notif.data as Record<string, unknown>
  const participantAmount = Number(d.participant_amount)
  const today = getMexicoNow().slice(0, 10)

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: user.id,
    concept: String(d.concept),
    type: 'TR-GASTO',
    amount: participantAmount,
    adjustment: adjustmentFor('TR-GASTO', participantAmount),
    category_id: null,
    account_id: accountId,
    transaction_date: today,
    is_validated: true,
  })
  if (txError) return { error: txError.message }

  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)

  // Notify the creator that the expense was accepted
  const { data: myProfile } = await supabase
    .from('profiles').select('username, full_name').eq('id', user.id).single()
  const admin = createAdminClient()
  await (admin.from('notifications') as any).insert({
    user_id: String(d.from_user_id),
    type: 'expense_settled',
    data: {
      from_user_id: user.id,
      from_username: myProfile?.username ?? '',
      from_name: myProfile?.full_name ?? '',
      concept: String(d.concept),
      amount: participantAmount,
    },
  }).catch(() => {})

  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function declineSharedExpense(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', user.id)
  return { error: null }
}

export async function saveBudget(month: number, year: number, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('budgets').upsert(
    { user_id: user.id, month, year, amount },
    { onConflict: 'user_id,month,year' },
  )
  if (error) return { error: error.message }
  revalidatePath('/home')
  return { error: null }
}
