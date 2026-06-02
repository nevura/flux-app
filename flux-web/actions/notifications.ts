'use server'

import { createClient } from '@/lib/supabase/server'
import { getMexicoNow, currentYearMonth, formatCurrency } from '@/lib/utils'
import { sendScheduledDueEmail, sendTdcDueEmail, sendBudgetAlertEmail } from '@/lib/email'

export async function generateSystemNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = getMexicoNow().slice(0, 10)
  const { year, month } = currentYearMonth()

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonthStart = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const [
    { data: scheduled },
    { data: tdcAccounts },
    { data: existing },
    { data: creditPayments },
    { data: budgetRow },
    { data: profileRow },
    { data: monthExpenses },
    { data: budgetAlertsSent },
  ] = await Promise.all([
    supabase
      .from('scheduled_transactions')
      .select('id, name, amount, type, next_charge_date')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVO')
      .lte('next_charge_date', today),
    supabase
      .from('accounts')
      .select('id, name, payment_day')
      .eq('user_id', user.id)
      .eq('payment_method_id', 'MP-TDC')
      .eq('is_active', true)
      .not('payment_day', 'is', null),
    supabase
      .from('notifications')
      .select('type, data')
      .eq('user_id', user.id)
      .in('type', ['scheduled_due', 'tdc_due'])
      .gte('created_at', today + 'T00:00:00'),
    supabase
      .from('credit_payments')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('month', month),
    supabase
      .from('budgets')
      .select('amount')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('default_monthly_budget')
      .eq('id', user.id)
      .single(),
    supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'TR-GASTO')
      .gte('transaction_date', monthStart)
      .lt('transaction_date', nextMonthStart),
    supabase
      .from('notifications')
      .select('data')
      .eq('user_id', user.id)
      .eq('type', 'budget_alert')
      .gte('created_at', monthStart + 'T00:00:00'),
  ])

  // Keys of notifications already created today — avoids duplicates
  const existingKeys = new Set(
    (existing ?? []).map((n: any) => `${n.type}:${(n.data as any)?.source_id}`)
  )
  const paidAccountIds = new Set((creditPayments ?? []).map((p: any) => p.account_id))
  const inserts: any[] = []

  // Scheduled transactions overdue/due today
  for (const s of (scheduled ?? [])) {
    const key = `scheduled_due:${s.id}`
    if (!existingKeys.has(key)) {
      inserts.push({
        user_id: user.id,
        type: 'scheduled_due',
        data: { source_id: s.id, name: s.name, amount: String(s.amount), transaction_type: s.type },
      })
    }
  }

  // TDC payment due within 3 days
  const todayDate = new Date(today + 'T12:00:00')
  for (const acc of (tdcAccounts ?? [])) {
    if (paidAccountIds.has(acc.id)) continue
    const payDay = acc.payment_day as number
    let payDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), payDay, 12)
    if (payDate < todayDate) {
      payDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, payDay, 12)
    }
    const daysUntil = Math.ceil((payDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 3) {
      const key = `tdc_due:${acc.id}`
      if (!existingKeys.has(key)) {
        inserts.push({
          user_id: user.id,
          type: 'tdc_due',
          data: { source_id: acc.id, name: acc.name, days_until: String(daysUntil) },
        })
      }
    }
  }

  // Budget alert
  const budgetLimit = (budgetRow as any)?.amount ?? (profileRow as any)?.default_monthly_budget
  if (budgetLimit && Number(budgetLimit) > 0) {
    const spent = ((monthExpenses ?? []) as any[]).reduce((s: number, t: any) => s + Number(t.amount), 0)
    const percent = Math.round((spent / Number(budgetLimit)) * 100)
    const alertedLevels = new Set(((budgetAlertsSent ?? []) as any[]).map((n: any) => String((n.data as any)?.level)))
    const period = `${year}-${String(month).padStart(2, '0')}`

    if (percent >= 100 && !alertedLevels.has('100')) {
      inserts.push({
        user_id: user.id,
        type: 'budget_alert',
        data: { level: '100', period, spent: String(Math.round(spent)), limit: String(budgetLimit) },
      })
    } else if (percent >= 80 && !alertedLevels.has('80') && !alertedLevels.has('100')) {
      inserts.push({
        user_id: user.id,
        type: 'budget_alert',
        data: { level: '80', period, spent: String(Math.round(spent)), limit: String(budgetLimit) },
      })
    }
  }

  if (inserts.length > 0) {
    await supabase.from('notifications').insert(inserts)

    // Fire-and-forget emails — don't block the response
    const email = user.email
    if (email) {
      for (const n of inserts) {
        if (n.type === 'scheduled_due') {
          sendScheduledDueEmail({ to: email, name: n.data.name, amount: formatCurrency(Number(n.data.amount)) }).catch(() => {})
        } else if (n.type === 'tdc_due') {
          sendTdcDueEmail({ to: email, accountName: n.data.name, daysUntil: Number(n.data.days_until) }).catch(() => {})
        } else if (n.type === 'budget_alert') {
          sendBudgetAlertEmail({
            to: email,
            percent: Number(n.data.level),
            spent: formatCurrency(Number(n.data.spent)),
            limit: formatCurrency(Number(n.data.limit)),
          }).catch(() => {})
        }
      }
    }
  }
}
