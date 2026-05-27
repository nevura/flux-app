'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adjustmentFor, parseAmount, getMexicoNow } from '@/lib/utils'
import type { TransactionForm, SplitParticipant } from '@/lib/types'

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
    const { error } = await supabase.from('transactions').insert({
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
    })
    if (error) return { error: error.message }
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

export async function settleParticipant(txId: string, participantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('split_data')
    .eq('id', txId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !tx) return { error: 'Transacción no encontrada' }

  const sd = tx.split_data
  if (!sd || !Array.isArray(sd.data)) return { error: 'Datos de desglose inválidos' }

  const newData = (sd.data as SplitParticipant[]).map(p =>
    p.id === participantId ? { ...p, paidStatus: true, paidAmount: p.value } : p
  )

  const { error } = await supabase
    .from('transactions')
    .update({ split_data: { ...sd, data: newData } })
    .eq('id', txId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/shared')
  revalidatePath('/home')
  return { error: null }
}

export async function partialSettle(txId: string, participantId: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: tx, error: fetchErr } = await supabase
    .from('transactions').select('split_data')
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

  revalidatePath('/shared')
  revalidatePath('/home')
  revalidatePath('/transactions')
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
