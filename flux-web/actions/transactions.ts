'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adjustmentFor, parseAmount, getMexicoNow, formatCurrency } from '@/lib/utils'
import { sendSharedExpenseInviteEmail, sendSharedExpensePaidEmail } from '@/lib/email'
import type { TransactionForm, SplitParticipant, AccountWithBalance, Category, Person } from '@/lib/types'

// Sends expense_settled_confirm notification to a person if they have a linked Flux user.
// linked_tx_id / linked_participant_id let the receiver update their own transaction on confirmation.
async function notifyLinkedPersonSettled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personId: string,
  myUserId: string,
  concept: string,
  amount: number,
  isTheyOwe: boolean,
  extra?: {
    linked_tx_id?: string       // creator's original tx (for them to update on confirm)
    linked_participant_id?: string // settler's person ID in creator's system
    from_tx_id?: string         // settler's IOWE tx (for creator to re-open on reject)
    from_participant_id?: string  // creator's person ID in settler's system
  }
) {
  const { data: person } = await supabase
    .from('people').select('linked_user_id').eq('id', personId).eq('user_id', myUserId).maybeSingle()
  if (!person?.linked_user_id) return
  const { data: myProfile } = await supabase
    .from('profiles').select('username, full_name').eq('id', myUserId).single()
  const admin = createAdminClient()
  try {
    await (admin.from('notifications') as any).insert({
      user_id: person.linked_user_id,
      type: 'expense_settled_confirm',
      data: {
        from_user_id: myUserId,
        from_username: myProfile?.username ?? '',
        from_name: myProfile?.full_name ?? '',
        concept,
        amount,
        is_they_owe: isTheyOwe,
        linked_tx_id: extra?.linked_tx_id ?? null,
        linked_participant_id: extra?.linked_participant_id ?? null,
        from_tx_id: extra?.from_tx_id ?? null,
        from_participant_id: extra?.from_participant_id ?? null,
      },
    })
  } catch { /* ignore — notification is best-effort */ }

  // Send email to the person being notified (best-effort)
  const { data: recipientProfile } = await (admin.from('profiles') as any)
    .select('email, full_name').eq('id', person.linked_user_id).single()
  if (recipientProfile?.email) {
    try {
      await sendSharedExpensePaidEmail({
        to: recipientProfile.email,
        toName: recipientProfile.full_name ?? '',
        fromName: myProfile?.full_name ?? myProfile?.username ?? 'Alguien',
        fromUsername: myProfile?.username ?? '',
        concept,
        amount: formatCurrency(amount),
      })
    } catch {}
  }
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

export async function addTransaction(form: TransactionForm): Promise<{ error: string | null; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const amount = parseAmount(form.amount)
  const date   = form.transaction_date || getMexicoNow()

  // Concept validation / auto-fill
  let concept = (form.concept ?? '').trim()
  if (!concept) {
    if (form.type !== 'TR-TRANSFER') return { error: 'El concepto es obligatorio' }
    // For transfers: auto-name using account IDs (names resolved below if needed)
    concept = 'Transferencia'
  }

  if (form.type === 'TR-TRANSFER') {
    // Auto-fill transfer concept with account names if still generic
    if (!concept || concept === 'Transferencia') {
      const { data: accs } = await supabase
        .from('accounts').select('id, name')
        .in('id', [form.account_id, form.destination_account_id].filter(Boolean))
      const src = accs?.find(a => a.id === form.account_id)?.name ?? 'cuenta'
      const dst = accs?.find(a => a.id === form.destination_account_id)?.name ?? 'cuenta'
      concept = `Transferencia de ${src} a ${dst}`
    }
    const { data: transferTx, error } = await supabase.from('transactions').insert({
      user_id: user.id, concept,
      type: 'TR-TRANSFER', amount, adjustment: -amount,
      category_id: null, account_id: form.account_id,
      destination_account_id: form.destination_account_id!,
      transaction_date: date, is_validated: true,
      scheduled_id: form.scheduled_id || null,
    }).select('id').single()
    if (error) return { error: error.message }
    revalidatePath('/home')
    revalidatePath('/transactions')
    return { error: null, id: transferTx?.id }
  } else {
    const isPayable = form.is_payable ?? false
    const isReceivable = form.is_receivable ?? false
    const { data: newTx, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      concept,
      type: form.type,
      amount,
      // IOWE (is_payable): money hasn't moved yet — adjustment = 0
      // is_receivable: income not yet collected — adjustment = 0 until collected
      adjustment: (isPayable || isReceivable) ? 0 : adjustmentFor(form.type, amount),
      category_id: form.category_id || null,
      account_id: form.account_id,
      transaction_date: date,
      is_validated: true,
      is_receivable: isReceivable,
      scheduled_id: form.scheduled_id || null,
      split_data: form.split_data || null,
      exclude_mode: form.exclude_mode ?? 'none',
      notes: form.notes || null,
      is_payable: isPayable,
    }).select('id').single()
    if (error) return { error: error.message }

    // Send shared expense invites to linked friends (expenses) OR receivable invites (incomes)
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
              type: isReceivable ? 'receivable_invite' : 'shared_expense_invite',
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
                is_receivable: isReceivable,
              },
            })
            // Send invite email to each linked participant
            const { data: recipientProfile } = await (admin.from('profiles') as any)
              .select('email, full_name').eq('id', lp.linked_user_id).single()
            if (recipientProfile?.email) {
              try {
                await sendSharedExpenseInviteEmail({
                  to: recipientProfile.email,
                  toName: recipientProfile.full_name ?? '',
                  fromName: myProfile?.full_name ?? myProfile?.username ?? 'Alguien',
                  fromUsername: myProfile?.username ?? '',
                  concept: form.concept,
                  amount: formatCurrency(participant.value),
                })
              } catch {}
            }
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
                is_receivable: isReceivable,
              },
            })
          }
        }
      }
    }

    revalidatePath('/home')
    revalidatePath('/transactions')
    return { error: null, id: newTx?.id }
  }
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

  // Fetch existing split_data to compare which participants are new
  const { data: existingTx } = await supabase
    .from('transactions').select('split_data').eq('id', id).eq('user_id', user.id).single()

  const isPayable = form.is_payable ?? false
  const isReceivable = form.is_receivable ?? false
  const { error } = await supabase
    .from('transactions')
    .update({
      concept: form.concept, type: form.type,
      amount,
      adjustment: (isPayable || isReceivable) ? 0 : adjustmentFor(form.type, amount),
      category_id: form.category_id || null,
      account_id: form.account_id,
      transaction_date: date,
      split_data: form.split_data || null,
      exclude_mode: form.exclude_mode ?? 'none',
      notes: form.notes || null,
      is_payable: isPayable,
      is_receivable: isReceivable,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Notify participants on update: invite new ones, notify existing accepted ones
  if (form.split_data?.data && (form.split_data.splitMode === 'THEY' || form.split_data.splitMode === 'DIV')) {
    const prevIds = new Set<string>(
      (existingTx?.split_data as typeof form.split_data | null)?.data
        ?.filter(p => p.id !== 'PER-YO')
        .map(p => p.id) ?? []
    )
    const allParticipantIds = form.split_data.data.filter(p => p.id !== 'PER-YO').map(p => p.id)

    if (allParticipantIds.length > 0) {
      const { data: linkedPeople } = await supabase
        .from('people').select('id, linked_user_id')
        .in('id', allParticipantIds).not('linked_user_id', 'is', null)

      if (linkedPeople?.length) {
        const { data: myProfile } = await supabase
          .from('profiles').select('username, full_name').eq('id', user.id).single()
        const admin = createAdminClient()
        const invitedNames: string[] = []
        const updatedNames: string[] = []

        for (const lp of linkedPeople) {
          const participant = form.split_data!.data.find(p => p.id === lp.id)
          if (!participant) continue
          if (participant.paidStatus) continue  // already settled, no notification needed
          const isNew = !prevIds.has(lp.id)

          // Dedup: remove any existing pending invite/update for this tx so B only sees the latest
          const { data: staleNotifs } = await (admin.from('notifications') as any)
            .select('id, data')
            .eq('user_id', lp.linked_user_id)
            .eq('read', false)
            .in('type', ['shared_expense_invite', 'shared_expense_updated', 'receivable_invite'])
          const staleIds = (staleNotifs ?? [])
            .filter((n: any) => String(n.data?.transaction_id) === id)
            .map((n: any) => n.id)
          if (staleIds.length > 0) {
            await (admin.from('notifications') as any).delete().in('id', staleIds)
          }

          const notifType = isReceivable ? 'receivable_invite' : (isNew ? 'shared_expense_invite' : 'shared_expense_updated')
          const notifData = {
            transaction_id: id,
            from_user_id: user.id,
            from_username: myProfile?.username ?? '',
            from_name: myProfile?.full_name ?? '',
            concept: form.concept,
            total_amount: amount,
            participant_amount: participant.value,
            participant_person_id: lp.id,
            category_id: form.category_id || null,
            is_receivable: isReceivable,
          }

          if (isNew) {
            invitedNames.push(participant.nombre)
          } else {
            updatedNames.push(participant.nombre)
          }

          await (admin.from('notifications') as any).insert({ user_id: lp.linked_user_id, type: notifType, data: notifData })

          const { data: recipientProfile } = await (admin.from('profiles') as any)
            .select('email, full_name').eq('id', lp.linked_user_id).single()
          if (recipientProfile?.email) {
            try {
              await sendSharedExpenseInviteEmail({
                to: recipientProfile.email,
                toName: recipientProfile.full_name ?? '',
                fromName: myProfile?.full_name ?? myProfile?.username ?? 'Alguien',
                fromUsername: myProfile?.username ?? '',
                concept: isNew ? form.concept : `[Actualizado] ${form.concept}`,
                amount: formatCurrency(participant.value),
              })
            } catch {}
          }
        }

        const notifiedNames = [...invitedNames, ...updatedNames]
        if (notifiedNames.length > 0) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'shared_expense_sent',
            data: { concept: form.concept, total_amount: amount, invited_names: notifiedNames },
          })
        }
      }
    }
  }

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

  // For IOWE (accepted debt): also mark as validated — debt is resolved even without account
  const updatePayload: Record<string, unknown> = { split_data: { ...sd, data: newData } }
  if (sd.splitMode === 'IOWE') updatePayload.is_validated = true

  const { error } = await supabase
    .from('transactions')
    .update(updatePayload)
    .eq('id', txId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (notify && participant) {
    const isTheyOwe = sd.splitMode === 'THEY' || sd.splitMode === 'DIV'
    // If this is an IOWE transaction with a linked_tx_id, also update the creator's original tx
    const linked_tx_id = (sd as import('@/lib/types').SplitData).linked_tx_id
    const linked_participant_id = (sd as import('@/lib/types').SplitData).linked_participant_id
    if (linked_tx_id && linked_participant_id) {
      const admin = createAdminClient()
      const { data: origTx } = await (admin.from('transactions') as any).select('*').eq('id', linked_tx_id).maybeSingle()
      if (origTx?.split_data) {
        const origSd = origTx.split_data as import('@/lib/types').SplitData
        if (Array.isArray(origSd.data)) {
          const updatedData = origSd.data.map((p: SplitParticipant) =>
            p.id === linked_participant_id ? { ...p, paidStatus: true, paidAmount: p.value } : p
          )
          await (admin.from('transactions') as any)
            .update({ split_data: { ...origSd, data: updatedData } })
            .eq('id', linked_tx_id)
        }
      }
    }
    await notifyLinkedPersonSettled(supabase, participantId, user.id, tx.concept, participant.value, isTheyOwe, {
      linked_tx_id,
      linked_participant_id,
      from_tx_id: txId,
      from_participant_id: participantId,
    })
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

  const newData = (sd.data as SplitParticipant[]).map(p =>
    p.id === participantId ? { ...p, paidStatus: true, paidAmount: p.value } : p
  )

  if (sd.splitMode === 'IOWE') {
    // IOWE = accepted shared expense debt. Update the original tx in-place instead of
    // creating a new one — the debt-tracking tx already exists, just activate it.
    const { error } = await supabase.from('transactions').update({
      account_id: accountId,
      adjustment: adjustmentFor('TR-GASTO', unpaid),
      is_validated: true,
      split_data: { ...sd, data: newData },
    }).eq('id', txId).eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    // THEY / DIV: create a new income/expense record on the creator's side
    const txType = isTheyOwe ? 'TR-INGRESO' : 'TR-GASTO'
    const personLabel = participant.nombre ?? 'persona'
    const { error: txCreateErr } = await supabase.from('transactions').insert({
      user_id: user.id,
      concept: `${isTheyOwe ? 'Cobro' : 'Pago'} de ${personLabel}: ${tx.concept}`,
      type: txType,
      amount: unpaid,
      adjustment: adjustmentFor(txType, unpaid),
      category_id: tx.category_id,
      account_id: accountId,
      transaction_date: getMexicoNow().slice(0, 10),
      is_validated: true,
    })
    if (txCreateErr) return { error: txCreateErr.message }

    const { error } = await supabase
      .from('transactions').update({ split_data: { ...sd, data: newData } })
      .eq('id', txId).eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  // If this is an IOWE transaction with a linked_tx_id, also update the creator's original tx
  const linked_tx_id = (sd as import('@/lib/types').SplitData).linked_tx_id
  const linked_participant_id = (sd as import('@/lib/types').SplitData).linked_participant_id
  if (linked_tx_id && linked_participant_id) {
    const admin = createAdminClient()
    const { data: origTx } = await (admin.from('transactions') as any).select('*').eq('id', linked_tx_id).maybeSingle()
    if (origTx?.split_data) {
      const origSd = origTx.split_data as import('@/lib/types').SplitData
      if (Array.isArray(origSd.data)) {
        const updatedData = origSd.data.map((p: SplitParticipant) =>
          p.id === linked_participant_id ? { ...p, paidStatus: true, paidAmount: p.value } : p
        )
        await (admin.from('transactions') as any)
          .update({ split_data: { ...origSd, data: updatedData } })
          .eq('id', linked_tx_id)
      }
    }
  }

  await notifyLinkedPersonSettled(supabase, participantId, user.id, tx.concept, unpaid, isTheyOwe, {
    linked_tx_id,
    linked_participant_id,
    from_tx_id: txId,
    from_participant_id: participantId,
  })

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

  // Collect all pending items for this person FIFO (expenses + receivable incomes)
  const pending: Array<{ txId: string; participantId: string; unpaid: number; sd: object; isReceivable: boolean; txAmount: number }> = []
  for (const tx of txs ?? []) {
    const sd = tx.split_data
    if (!sd || !Array.isArray(sd.data)) continue
    const p = (sd.data as SplitParticipant[]).find(p => p.id === personId)
    if (!p || p.paidStatus) continue
    const unpaid = p.value - (p.paidAmount ?? 0)
    if (unpaid <= 0.005) continue
    pending.push({ txId: tx.id, participantId: personId, unpaid, sd, isReceivable: tx.is_receivable === true && tx.type === 'TR-INGRESO', txAmount: Number(tx.amount) })
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
    const updatePayload: Record<string, unknown> = { split_data: { ...sd, data: newData } }

    // If this tx is a receivable income and is now fully paid, activate it
    if (newPaid && item.isReceivable) {
      updatePayload.is_receivable = false
      updatePayload.is_validated = true
      updatePayload.adjustment = item.txAmount
      updatePayload.transaction_date = getMexicoNow()
    }

    const { error } = await supabase
      .from('transactions').update(updatePayload)
      .eq('id', item.txId).eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  if (accountId) {
    await supabase.from('transactions').insert({
      user_id: user.id,
      concept: `Cobro de ${personName}`,
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

// ── Collect a receivable income (full or partial payment received) ────────────
export async function collectReceivable(
  txId: string,
  participantId: string,
  mode: 'full' | 'partial',
  partialAmount?: number
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: tx } = await supabase
    .from('transactions').select('*').eq('id', txId).eq('user_id', user.id).single()
  if (!tx) return { error: 'Movimiento no encontrado' }

  const sd = tx.split_data as import('@/lib/types').SplitData | null
  if (!sd) return { error: 'Sin datos de cobro' }

  const participant = (sd.data as import('@/lib/types').SplitParticipant[]).find(p => p.id === participantId)
  if (!participant) return { error: 'Participante no encontrado' }

  const remaining = participant.value - (participant.paidAmount ?? 0)
  const collectAmount = mode === 'full' ? remaining : Math.min(partialAmount ?? 0, remaining)
  if (collectAmount <= 0.005) return { error: 'Monto inválido' }

  const isFullSettlement = mode === 'full' || (remaining - collectAmount) <= 0.005

  if (isFullSettlement) {
    // Activate the original income: it now counts in balance
    const newData = (sd.data as import('@/lib/types').SplitParticipant[]).map(p =>
      p.id === participantId ? { ...p, paidStatus: true, paidAmount: p.value } : p
    )
    const { error } = await supabase.from('transactions').update({
      split_data: { ...sd, data: newData },
      is_receivable: false,
      is_validated: true,
      adjustment: Number(tx.amount),
      transaction_date: getMexicoNow(),
    }).eq('id', txId).eq('user_id', user.id)
    if (error) return { error: error.message }

    // Notify linked contact
    await notifyLinkedPersonReceivable(supabase, participantId, user.id, tx.concept, Number(tx.amount), 'settled')
  } else {
    // Partial: create a new validated income for the collected amount, reduce original
    const newPaidAmount = (participant.paidAmount ?? 0) + collectAmount
    const newValue = remaining - collectAmount
    const newData = (sd.data as import('@/lib/types').SplitParticipant[]).map(p =>
      p.id === participantId ? { ...p, paidAmount: newPaidAmount, value: newValue } : p
    )
    const { error: updateErr } = await supabase.from('transactions').update({
      split_data: { ...sd, data: newData },
      amount: newValue, // remaining amount on original
    }).eq('id', txId).eq('user_id', user.id)
    if (updateErr) return { error: updateErr.message }

    // New validated income for what was actually collected
    await supabase.from('transactions').insert({
      user_id: user.id,
      concept: tx.concept,
      type: 'TR-INGRESO',
      amount: collectAmount,
      adjustment: adjustmentFor('TR-INGRESO', collectAmount),
      category_id: tx.category_id,
      account_id: tx.account_id,
      transaction_date: getMexicoNow(),
      is_validated: true,
      notes: `Abono parcial (original: ${txId})`,
    })

    // Notify linked contact of partial payment
    await notifyLinkedPersonReceivable(supabase, participantId, user.id, tx.concept, collectAmount, 'abono')
  }

  revalidatePath('/shared')
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

// Notifies the contact (linked Flux user) that a receivable was collected or partially paid
async function notifyLinkedPersonReceivable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personId: string,
  myUserId: string,
  concept: string,
  amount: number,
  type: 'settled' | 'abono'
) {
  const { data: person } = await supabase
    .from('people').select('linked_user_id').eq('id', personId).eq('user_id', myUserId).maybeSingle()
  if (!person?.linked_user_id) return
  const { data: myProfile } = await supabase
    .from('profiles').select('username, full_name').eq('id', myUserId).single()
  const admin = createAdminClient()
  try {
    await (admin.from('notifications') as any).insert({
      user_id: person.linked_user_id,
      type: type === 'settled' ? 'receivable_settled' : 'receivable_abono',
      data: {
        from_user_id: myUserId,
        from_username: myProfile?.username ?? '',
        from_name: myProfile?.full_name ?? '',
        concept,
        amount,
      },
    })
  } catch { /* best-effort */ }
}

export async function settleAllForPerson(personId: string, personName: string, accountId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: txs, error: fetchErr } = await supabase
    .from('transactions').select('*').eq('user_id', user.id).not('split_data', 'is', null)
  if (fetchErr) return { error: fetchErr.message }

  let totalTheyOwe = 0  // expense-based debts (money coming in via new income tx)
  let totalIOwe = 0     // IOWE debts (money going out)
  type UpdateItem = {
    id: string; split_data: object; isIowe: boolean; isReceivable: boolean; txAmount: number; unpaid: number
    linked_tx_id?: string; linked_participant_id?: string
  }
  const updates: UpdateItem[] = []

  for (const tx of txs ?? []) {
    const sd = tx.split_data as import('@/lib/types').SplitData
    if (!sd || !Array.isArray(sd.data)) continue
    const participant = (sd.data as SplitParticipant[]).find(p => p.id === personId)
    if (!participant || participant.paidStatus) continue
    const unpaid = participant.value - (participant.paidAmount ?? 0)
    if (unpaid <= 0.005) continue

    const isReceivable = tx.is_receivable === true && tx.type === 'TR-INGRESO'
    const isIowe = sd.splitMode === 'IOWE'
    const isTheyOwe = (sd.splitMode === 'THEY' || sd.splitMode === 'DIV') && !isReceivable
    if (isTheyOwe) totalTheyOwe += unpaid
    else if (isIowe) totalIOwe += unpaid
    // receivable incomes are activated in-place — not counted in separate totals

    const newData = (sd.data as SplitParticipant[]).map(p =>
      p.id === personId ? { ...p, paidStatus: true, paidAmount: p.value } : p
    )
    updates.push({
      id: tx.id, split_data: { ...sd, data: newData }, isIowe, isReceivable, txAmount: Number(tx.amount), unpaid,
      linked_tx_id: sd.linked_tx_id, linked_participant_id: sd.linked_participant_id,
    })
  }

  if (updates.length === 0) return { error: 'Sin saldos pendientes' }

  const admin = createAdminClient()
  for (const u of updates) {
    const payload: Record<string, unknown> = { split_data: u.split_data }

    if (u.isReceivable) {
      // Activate the receivable income — no new tx needed
      payload.is_receivable = false
      payload.is_validated = true
      payload.adjustment = u.txAmount
      payload.transaction_date = getMexicoNow()
    } else if (u.isIowe) {
      payload.is_validated = true
      if (accountId) {
        payload.account_id = accountId
        payload.adjustment = adjustmentFor('TR-GASTO', u.unpaid)
      }
    }

    const { error } = await supabase
      .from('transactions').update(payload).eq('id', u.id).eq('user_id', user.id)
    if (error) return { error: error.message }

    // Update creator's linked tx (A sees B as paid) — only for IOWE
    if (u.isIowe && u.linked_tx_id && u.linked_participant_id) {
      const { data: origTx } = await (admin.from('transactions') as any).select('*').eq('id', u.linked_tx_id).maybeSingle()
      if (origTx?.split_data) {
        const origSd = origTx.split_data as import('@/lib/types').SplitData
        if (Array.isArray(origSd.data)) {
          const updatedData = origSd.data.map((p: SplitParticipant) =>
            p.id === u.linked_participant_id ? { ...p, paidStatus: true, paidAmount: p.value } : p
          )
          await (admin.from('transactions') as any)
            .update({ split_data: { ...origSd, data: updatedData } })
            .eq('id', u.linked_tx_id)
        }
      }
    }
  }

  // Summary income tx only for expense-based THEY/DIV debts (receivables are activated in-place)
  if (accountId && totalTheyOwe > 0.005) {
    await supabase.from('transactions').insert({
      user_id: user.id,
      concept: `Cobro global: ${personName}`,
      type: 'TR-INGRESO',
      amount: totalTheyOwe,
      adjustment: adjustmentFor('TR-INGRESO', totalTheyOwe),
      account_id: accountId,
      transaction_date: getMexicoNow().slice(0, 10),
      is_validated: true,
    })
  }

  const totalSettled = totalTheyOwe + totalIOwe + updates.filter(u => u.isReceivable).reduce((s, u) => s + u.unpaid, 0)
  if (totalSettled > 0.005) {
    await notifyLinkedPersonSettled(supabase, personId, user.id, `Saldo total con ${personName}`, totalSettled, totalTheyOwe >= totalIOwe)
  }

  revalidatePath('/shared')
  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function confirmSettledExpense(notificationId: string, accountId?: string) {
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

    // If the notification carries a linked_tx_id, update the confirmer's own transaction as paid
    const linked_tx_id = d.linked_tx_id ? String(d.linked_tx_id) : null
    const linked_participant_id = d.linked_participant_id ? String(d.linked_participant_id) : null
    if (linked_tx_id && linked_participant_id) {
      const { data: myTx } = await (admin.from('transactions') as any).select('*').eq('id', linked_tx_id).maybeSingle()
      if (myTx?.split_data) {
        const sd = myTx.split_data as import('@/lib/types').SplitData
        if (Array.isArray(sd.data)) {
          const updatedData = sd.data.map((p: SplitParticipant) =>
            p.id === linked_participant_id ? { ...p, paidStatus: true, paidAmount: p.value } : p
          )
          await (admin.from('transactions') as any)
            .update({ split_data: { ...sd, data: updatedData } })
            .eq('id', linked_tx_id)
        }
      }
    }

    // If an account was selected, create an income entry for A (the confirmer)
    if (accountId) {
      try {
        await supabase.from('transactions').insert({
          user_id: user.id,
          concept: `Cobro: ${String(d.concept)}`,
          type: 'TR-INGRESO',
          amount: Number(d.amount),
          adjustment: adjustmentFor('TR-INGRESO', Number(d.amount)),
          account_id: accountId,
          transaction_date: getMexicoNow().slice(0, 10),
          is_validated: true,
        })
      } catch { /* ignore */ }
      revalidatePath('/transactions')
    }

    // Notify the person who settled that their payment was confirmed
    try {
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
      })
    } catch { /* ignore */ }
  }

  revalidatePath('/shared')
  revalidatePath('/home')
  return { error: null }
}

export async function rejectSettledExpense(notificationId: string) {
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

    // Re-open B's debt: find B's IOWE transaction via from_tx_id and reset the participant
    const from_tx_id = d.from_tx_id ? String(d.from_tx_id) : null
    const from_participant_id = d.from_participant_id ? String(d.from_participant_id) : null
    if (from_tx_id && from_participant_id) {
      const { data: bTx } = await (admin.from('transactions') as any).select('*').eq('id', from_tx_id).maybeSingle()
      if (bTx?.split_data) {
        const sd = bTx.split_data as import('@/lib/types').SplitData
        if (Array.isArray(sd.data)) {
          const reopenedData = sd.data.map((p: SplitParticipant) =>
            p.id === from_participant_id ? { ...p, paidStatus: false, paidAmount: 0 } : p
          )
          await (admin.from('transactions') as any)
            .update({ split_data: { ...sd, data: reopenedData } })
            .eq('id', from_tx_id)
        }
      }
    }

    // Notify B that A rejected their payment claim
    try {
      await (admin.from('notifications') as any).insert({
        user_id: String(d.from_user_id),
        type: 'expense_settle_rejected',
        data: {
          from_user_id: user.id,
          from_username: myProfile?.username ?? '',
          from_name: myProfile?.full_name ?? '',
          concept: String(d.concept),
          amount: Number(d.amount),
        },
      })
    } catch { /* ignore */ }
  }

  revalidatePath('/shared')
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

// Accept = acknowledge the debt only. No money movement. The actual payment
// happens later when the recipient marks as settled from Compartidos.
export async function acceptSharedExpense(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: notif } = await supabase
    .from('notifications').select('*').eq('id', notificationId).eq('user_id', user.id).single()
  if (!notif) return { error: 'Notificación no encontrada' }

  const d = notif.data as Record<string, unknown>
  const participantAmount = Number(d.participant_amount)
  const today = getMexicoNow().slice(0, 10)
  const fromUserId = String(d.from_user_id)
  const admin = createAdminClient()

  // Find or create a person record for the creator in the recipient's people table
  const { data: existingPerson } = await supabase
    .from('people').select('id, name')
    .eq('user_id', user.id)
    .eq('linked_user_id', fromUserId)
    .maybeSingle()

  let creatorPersonId: string | null = existingPerson?.id ?? null
  const creatorName = existingPerson?.name ?? String(d.from_name ?? d.from_username ?? 'Desconocido')

  if (!creatorPersonId) {
    const newId = `PER-${Date.now()}`
    const { error: personErr } = await supabase.from('people').insert({
      id: newId,
      user_id: user.id,
      name: String(d.from_name ?? d.from_username ?? 'Desconocido'),
      linked_user_id: fromUserId,
      is_me: false,
    })
    if (!personErr) creatorPersonId = newId
  }

  const origTxId = String(d.transaction_id ?? '')
  const participantPersonId = String(d.participant_person_id ?? '')

  // Debt tracking transaction: no account_id, no money movement, paidStatus: false
  // linked_tx_id / linked_participant_id enable bidirectional update when settling
  const splitData = creatorPersonId ? {
    mode: 'AMT',
    splitMode: 'IOWE',
    linked_tx_id: origTxId || undefined,
    linked_participant_id: participantPersonId || undefined,
    data: [{
      id: creatorPersonId,
      nombre: creatorName,
      value: participantAmount,
      paidAmount: 0,
      paidStatus: false,
    }],
  } : null

  // If B already accepted this transaction before (e.g. creator edited the amount),
  // update the existing IOWE tx instead of creating a duplicate.
  const { data: existingTxs } = await supabase
    .from('transactions')
    .select('id, split_data')
    .eq('user_id', user.id)
    .not('split_data', 'is', null)
  const existingIowe = origTxId
    ? (existingTxs ?? []).find((tx: any) => String((tx.split_data as any)?.linked_tx_id) === origTxId)
    : null

  let txError: { message: string } | null = null
  if (existingIowe) {
    const prevSplit = existingIowe.split_data as any
    const updatedSplit = {
      ...prevSplit,
      data: prevSplit.data.map((p: any) => ({
        ...p,
        value: participantAmount,
        paidAmount: 0,
        paidStatus: false,
      })),
    }
    const { error } = await supabase
      .from('transactions')
      .update({ amount: participantAmount, split_data: updatedSplit })
      .eq('id', existingIowe.id)
      .eq('user_id', user.id)
    txError = error
  } else {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      concept: String(d.concept) || `Gasto con ${String(d.from_name ?? d.from_username ?? 'contacto')}`,
      type: 'TR-GASTO',
      amount: participantAmount,
      adjustment: 0,
      category_id: d.category_id && String(d.category_id).startsWith('CAT-DEF-') ? String(d.category_id) : null,
      account_id: null,
      transaction_date: today,
      is_validated: false,
      split_data: splitData,
    })
    txError = error
  }
  if (txError) return { error: txError.message }

  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)

  // Notify creator that B accepted (acknowledged the debt)
  const { data: myProfile } = await supabase
    .from('profiles').select('username, full_name').eq('id', user.id).single()
  try {
    await (admin.from('notifications') as any).insert({
      user_id: fromUserId,
      type: 'shared_expense_accepted',
      data: {
        from_user_id: user.id,
        from_username: myProfile?.username ?? '',
        from_name: myProfile?.full_name ?? '',
        concept: String(d.concept),
        amount: participantAmount,
      },
    })
  } catch { /* ignore */ }

  revalidatePath('/home')
  revalidatePath('/transactions')
  revalidatePath('/shared')
  return { error: null }
}

export async function declineSharedExpense(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: notif } = await supabase
    .from('notifications').select('*').eq('id', notificationId).eq('user_id', user.id).maybeSingle()

  await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', user.id)

  if (notif) {
    const d = notif.data as Record<string, unknown>
    const { data: myProfile } = await supabase.from('profiles').select('username, full_name').eq('id', user.id).single()
    const admin = createAdminClient()
    try {
      await (admin.from('notifications') as any).insert({
        user_id: String(d.from_user_id),
        type: 'shared_expense_declined',
        data: {
          from_user_id: user.id,
          from_username: myProfile?.username ?? '',
          from_name: myProfile?.full_name ?? '',
          concept: String(d.concept),
          amount: Number(d.participant_amount),
        },
      })
    } catch { /* ignore */ }
  }

  return { error: null }
}

export async function acceptReceivableInvite(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: notif } = await supabase
    .from('notifications').select('*').eq('id', notificationId).eq('user_id', user.id).single()
  if (!notif) return { error: 'Notificación no encontrada' }

  const d = notif.data as Record<string, unknown>
  const participantAmount = Number(d.participant_amount)
  const today = getMexicoNow().slice(0, 10)
  const fromUserId = String(d.from_user_id)
  const admin = createAdminClient()

  // Find or create a person record for the creator in the recipient's people table
  const { data: existingPerson } = await supabase
    .from('people').select('id, name')
    .eq('user_id', user.id)
    .eq('linked_user_id', fromUserId)
    .maybeSingle()

  let creatorPersonId: string | null = existingPerson?.id ?? null
  const creatorName = existingPerson?.name ?? String(d.from_name ?? d.from_username ?? 'Desconocido')

  if (!creatorPersonId) {
    const newId = `PER-${Date.now()}`
    const { error: personErr } = await supabase.from('people').insert({
      id: newId,
      user_id: user.id,
      name: String(d.from_name ?? d.from_username ?? 'Desconocido'),
      linked_user_id: fromUserId,
      is_me: false,
    })
    if (!personErr) creatorPersonId = newId
  }

  const origTxId = String(d.transaction_id ?? '')
  const participantPersonId = String(d.participant_person_id ?? '')

  // B owes A money — IOWE gasto with no money movement until settled
  const splitData = creatorPersonId ? {
    mode: 'AMT',
    splitMode: 'IOWE',
    linked_tx_id: origTxId || undefined,
    linked_participant_id: participantPersonId || undefined,
    data: [{
      id: creatorPersonId,
      nombre: creatorName,
      value: participantAmount,
      paidAmount: 0,
      paidStatus: false,
    }],
  } : null

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: user.id,
    concept: String(d.concept) || `Cobro de ${String(d.from_name ?? d.from_username ?? 'contacto')}`,
    type: 'TR-GASTO',
    amount: participantAmount,
    adjustment: 0,
    category_id: d.category_id && String(d.category_id).startsWith('CAT-DEF-') ? String(d.category_id) : null,
    account_id: null,
    transaction_date: today,
    is_validated: false,
    split_data: splitData,
  })
  if (txError) return { error: txError.message }

  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)

  // Notify creator that B acknowledged the receivable
  const { data: myProfile } = await supabase
    .from('profiles').select('username, full_name').eq('id', user.id).single()
  try {
    await (admin.from('notifications') as any).insert({
      user_id: fromUserId,
      type: 'shared_expense_accepted',
      data: {
        from_user_id: user.id,
        from_username: myProfile?.username ?? '',
        from_name: myProfile?.full_name ?? '',
        concept: String(d.concept),
        amount: participantAmount,
      },
    })
  } catch { /* ignore */ }

  revalidatePath('/home')
  revalidatePath('/transactions')
  revalidatePath('/shared')
  return { error: null }
}

export async function declineReceivableInvite(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: notif } = await supabase
    .from('notifications').select('*').eq('id', notificationId).eq('user_id', user.id).maybeSingle()

  await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', user.id)

  if (notif) {
    const d = notif.data as Record<string, unknown>
    const { data: myProfile } = await supabase.from('profiles').select('username, full_name').eq('id', user.id).single()
    const admin = createAdminClient()
    try {
      await (admin.from('notifications') as any).insert({
        user_id: String(d.from_user_id),
        type: 'shared_expense_declined',
        data: {
          from_user_id: user.id,
          from_username: myProfile?.username ?? '',
          from_name: myProfile?.full_name ?? '',
          concept: String(d.concept),
          amount: Number(d.participant_amount),
        },
      })
    } catch { /* ignore */ }
  }

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

// Marks an IOWE (is_payable) transaction as settled.
// Adjustment was already applied at creation — only the flag changes here.
export async function settlePayable(txId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('transactions')
    .update({ is_payable: false, is_validated: true })
    .eq('id', txId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/transactions')
  return { error: null }
}
