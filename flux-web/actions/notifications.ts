'use server'

import { createClient } from '@/lib/supabase/server'
import { getMexicoNow, currentYearMonth, formatCurrency } from '@/lib/utils'
import { sendScheduledDueEmail, sendTdcDueEmail } from '@/lib/email'

export async function generateSystemNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = getMexicoNow().slice(0, 10)
  const { year, month } = currentYearMonth()

  const [
    { data: scheduled },
    { data: tdcAccounts },
    { data: existing },
    { data: creditPayments },
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
        }
      }
    }
  }
}
