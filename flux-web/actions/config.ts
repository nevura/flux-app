'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateCategoryId, generateAccountId, adjustmentFor, getMexicoNow } from '@/lib/utils'
import type { Category, Account, ScheduledTransaction } from '@/lib/types'

// ── Categories ────────────────────────────────────────────────────────────────

export async function saveCategory(data: Partial<Category> & { name: string; icon_id: string; color_id: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const id = data.id || generateCategoryId(data.name)
  const { error } = await supabase.from('categories').upsert({ ...data, id, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/settings')
  return { error: null, id }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { error: null }
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export async function saveAccount(data: Partial<Account> & { name: string; payment_method_id: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const id = data.id || generateAccountId(data.payment_method_id)

  // If editing an existing account, block currency changes after the first transaction
  if (data.id && data.currency) {
    const [{ data: existing }, { count }] = await Promise.all([
      supabase.from('accounts').select('currency').eq('id', data.id).eq('user_id', user.id).single(),
      supabase.from('transactions').select('id', { count: 'exact', head: true })
        .eq('account_id', data.id).eq('user_id', user.id),
    ])
    if (existing && (count ?? 0) > 0 && existing.currency !== data.currency) {
      return { error: 'No se puede cambiar la divisa de una cuenta con movimientos registrados' }
    }
  }

  // Strip display_exchange_rate from upsert payload — it's managed internally
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { display_exchange_rate: _der, ...upsertData } = data as Account
  const { error } = await supabase.from('accounts').upsert({ ...upsertData, id, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/settings')
  return { error: null, id }
}

export async function reorderAccounts(orderedIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('accounts').update({ sort_order: i + 1 }).eq('id', orderedIds[i]).eq('user_id', user.id)
  }
  revalidatePath('/home')
  revalidatePath('/settings')
  return { error: null }
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Block deletion if the account has any transactions
  const { count } = await supabase.from('transactions').select('id', { count: 'exact', head: true })
    .eq('account_id', id).eq('user_id', user.id)
  if ((count ?? 0) > 0) {
    return { error: 'No se puede eliminar una cuenta con movimientos. Puedes desactivarla en su lugar.' }
  }

  const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { error: null }
}

// ── Scheduled Transactions ────────────────────────────────────────────────────

export async function saveScheduled(data: Partial<ScheduledTransaction>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const payload = { ...data, user_id: user.id }
  const { error } = data.id
    ? await supabase.from('scheduled_transactions').update(payload).eq('id', data.id).eq('user_id', user.id)
    : await supabase.from('scheduled_transactions').insert(payload)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { error: null }
}

export async function deleteScheduled(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('scheduled_transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { error: null }
}

// ── Budget ────────────────────────────────────────────────────────────────────

export async function saveBudget(amount: number, year: number, month: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: existing } = await supabase
    .from('budgets').select('id')
    .eq('user_id', user.id).eq('year', year).eq('month', month)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('budgets').update({ amount }).eq('id', existing.id)
    : await supabase.from('budgets').insert({ user_id: user.id, amount, year, month })

  if (error) return { error: error.message }
  revalidatePath('/home')
  return { error: null }
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
  return { error: null }
}

export async function markCoachMarkDone(pageKey: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('coach_marks_seen').eq('id', user.id).single()
  const seen: string[] = (profile as any)?.coach_marks_seen ?? []
  if (!seen.includes(pageKey)) {
    await supabase.from('profiles').update({ coach_marks_seen: [...seen, pageKey] }).eq('id', user.id)
  }
}

export async function updateProfile(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() || null }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/settings')
  return { error: null }
}

export async function updateThemePreference(theme: 'dark' | 'light') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('profiles').update({ theme_preference: theme }).eq('id', user.id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateBaseCurrency(currency: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('profiles').update({ currency }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/settings')
  revalidatePath('/insights')
  return { error: null }
}

export async function saveDefaultBudget(amount: number | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('profiles').update({ default_monthly_budget: amount }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/home')
  revalidatePath('/settings')
  return { error: null }
}

// ── Apply balance adjustment ──────────────────────────────────────────────────

export async function addPerson(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado', person: null }

  const suffix = Math.random().toString(36).slice(2, 10).toUpperCase()
  const id = `PER-${suffix}`
  const { data: person, error } = await supabase.from('people').insert({ id, user_id: user.id, name }).select().single()
  if (error) return { error: error.message, person: null }
  revalidatePath('/home')
  revalidatePath('/transactions')
  revalidatePath('/settings')
  return { error: null, person }
}

export async function updatePerson(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('people').update({ name: name.trim() }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/transactions')
  return { error: null }
}

export async function deletePerson(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('people').delete().eq('id', id).eq('user_id', user.id).eq('is_me', false)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/transactions')
  return { error: null }
}

export async function chargeScheduled(id: string, skip: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: sched, error: fetchErr } = await supabase
    .from('scheduled_transactions').select('*')
    .eq('id', id).eq('user_id', user.id).single()
  if (fetchErr || !sched) return { error: 'Recurrente no encontrado' }

  const base = sched.next_charge_date ? new Date(sched.next_charge_date + 'T12:00:00') : new Date()
  const next = new Date(base)
  const num = sched.frequency_num
  if (sched.frequency_unit === 'dia') next.setDate(next.getDate() + num)
  else if (sched.frequency_unit === 'semana') next.setDate(next.getDate() + num * 7)
  else if (sched.frequency_unit === 'mes') next.setMonth(next.getMonth() + num)
  else if (sched.frequency_unit === 'año') next.setFullYear(next.getFullYear() + num)
  const nextDateStr = next.toISOString().slice(0, 10)
  const today = getMexicoNow().slice(0, 10)

  if (!skip) {
    const amount = Number(sched.amount)
    // Fetch account currency at charge time (same pattern as addTransaction)
    const { data: acct } = await supabase
      .from('accounts').select('currency, display_exchange_rate')
      .eq('id', sched.account_id).eq('user_id', user.id).maybeSingle()
    const currency = acct?.currency ?? 'MXN'
    const exchange_rate = acct?.display_exchange_rate ?? 1
    const { error: txErr } = await supabase.from('transactions').insert({
      user_id: user.id,
      concept: sched.name,
      type: sched.type,
      amount,
      adjustment: sched.type === 'TR-TRANSFER' ? -amount : adjustmentFor(sched.type, amount),
      currency,
      exchange_rate,
      category_id: sched.category_id ?? null,
      account_id: sched.account_id,
      destination_account_id: sched.destination_account_id ?? null,
      transaction_date: today,
      is_validated: true,
      scheduled_id: id,
    })
    if (txErr) return { error: txErr.message }
  }

  const { error: updateErr } = await supabase
    .from('scheduled_transactions')
    .update({ next_charge_date: nextDateStr, ...(skip ? {} : { last_charge_date: today }) })
    .eq('id', id).eq('user_id', user.id)
  if (updateErr) return { error: updateErr.message }

  revalidatePath('/home')
  revalidatePath('/transactions')
  return { error: null }
}

export async function applyAdjustment(accountId: string, accountName: string, delta: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    concept: `Ajuste en ${accountName}`,
    type: delta > 0 ? 'TR-INGRESO' : 'TR-GASTO',
    amount: Math.abs(delta),
    adjustment: delta,
    category_id: 'CAT-AUDIT',
    account_id: accountId,
    is_validated: false,
  })
  if (error) return { error: error.message }
  revalidatePath('/home')
  return { error: null }
}

// ── Credit card payments ───────────────────────────────────────────────────────

export async function saveCreditPayment(data: {
  account_id: string
  year: number
  month: number
  amount: number
  payment_type: 'transfer' | 'deposit'
  source_account_id?: string | null
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Delete any previous transaction linked to this payment before upserting
  const { data: existing } = await supabase
    .from('credit_payments')
    .select('transaction_id')
    .eq('user_id', user.id)
    .eq('account_id', data.account_id)
    .eq('year', data.year)
    .eq('month', data.month)
    .maybeSingle()

  if (existing?.transaction_id) {
    await supabase.from('transactions').delete().eq('id', existing.transaction_id)
  }

  let transaction_id: string | null = null

  // When paying by transfer, create a real transaction so the source account balance decreases
  if (data.payment_type === 'transfer' && data.source_account_id && data.amount > 0) {
    const { data: acc } = await supabase
      .from('accounts').select('name').eq('id', data.account_id).single()
    const tdcName = acc?.name ?? 'TDC'
    const today = getMexicoNow().slice(0, 10)

    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        concept: `Pago ${tdcName}`,
        type: 'TR-TRANSFER',
        amount: data.amount,
        adjustment: -data.amount,
        account_id: data.source_account_id,
        destination_account_id: data.account_id,
        transaction_date: today,
        is_validated: true,
      })
      .select('id')
      .single()

    if (txErr) return { error: txErr.message }
    transaction_id = tx?.id ?? null
  }

  const { error } = await supabase.from('credit_payments').upsert(
    { ...data, user_id: user.id, transaction_id },
    { onConflict: 'user_id,account_id,year,month' },
  )
  if (error) return { error: error.message }
  revalidatePath('/home')
  return { error: null }
}

export async function deleteCreditPayment(account_id: string, year: number, month: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Also delete the linked transaction if any
  const { data: existing } = await supabase
    .from('credit_payments')
    .select('transaction_id')
    .eq('user_id', user.id)
    .eq('account_id', account_id)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (existing?.transaction_id) {
    await supabase.from('transactions').delete().eq('id', existing.transaction_id)
  }

  const { error } = await supabase
    .from('credit_payments')
    .delete()
    .eq('user_id', user.id)
    .eq('account_id', account_id)
    .eq('year', year)
    .eq('month', month)
  if (error) return { error: error.message }
  revalidatePath('/home')
  return { error: null }
}
