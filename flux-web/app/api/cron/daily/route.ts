import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adjustmentFor, getMexicoNow, nextRecurringDate } from '@/lib/utils'
import { sendTdcReminderEmail, sendMonthlyAdjustmentEmail } from '@/lib/email'

export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const todayStr = getMexicoNow().slice(0, 10) // 'YYYY-MM-DD'
  const today    = new Date(todayStr)

  const results = { recurring: 0, tdc: 0, adjustment: 0, errors: [] as string[] }

  // ── 1. Transacciones recurrentes ──────────────────────────────────────────
  const { data: scheduled, error: schedErr } = await (admin
    .from('scheduled_transactions') as any)
    .select('*')
    .eq('status', 'ACTIVO')
    .lte('next_charge_date', todayStr)
    .not('next_charge_date', 'is', null)

  if (schedErr) {
    results.errors.push(`scheduled_fetch: ${schedErr.message}`)
  } else {
    for (const s of (scheduled ?? [])) {
      try {
        // Insert transaction
        const txData: Record<string, unknown> = {
          user_id:          s.user_id,
          concept:          s.name,
          type:             s.type,
          amount:           s.amount,
          adjustment:       s.type === 'TR-TRANSFER' ? -s.amount : adjustmentFor(s.type, s.amount),
          category_id:      s.category_id ?? null,
          account_id:       s.account_id,
          transaction_date: s.next_charge_date,
          is_validated:     false, // auto-generated — user must confirm
          scheduled_id:     s.id,
          split_data:       s.split_data ?? null,
        }
        if (s.type === 'TR-TRANSFER') {
          txData.destination_account_id = s.destination_account_id
        }

        const { error: txErr } = await (admin.from('transactions') as any).insert(txData)
        if (txErr) { results.errors.push(`tx_insert(${s.id}): ${txErr.message}`); continue }

        // Advance next_charge_date
        const next = nextRecurringDate(new Date(s.next_charge_date), s.frequency_num, s.frequency_unit, s.payment_day)
        await (admin.from('scheduled_transactions') as any)
          .update({ next_charge_date: next.toISOString().slice(0, 10), last_charge_date: todayStr })
          .eq('id', s.id)

        results.recurring++
      } catch (e) {
        results.errors.push(`recurring(${s.id}): ${String(e)}`)
      }
    }
  }

  // ── 2. Recordatorios TDC ──────────────────────────────────────────────────
  const tomorrow    = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDay = tomorrow.getDate()

  const { data: tdcAccounts } = await (admin
    .from('accounts') as any)
    .select('id, user_id, name, payment_day')
    .eq('payment_method_id', 'MP-TDC')
    .eq('payment_day', tomorrowDay)
    .eq('is_active', true)

  for (const acc of (tdcAccounts ?? [])) {
    try {
      // Skip if payment already recorded for this month
      const { data: alreadyPaid } = await (admin
        .from('credit_payments') as any)
        .select('id')
        .eq('user_id', acc.user_id)
        .eq('account_id', acc.id)
        .eq('year', tomorrow.getFullYear())
        .eq('month', tomorrow.getMonth() + 1)
        .maybeSingle()

      if (alreadyPaid) continue

      const { data: profile } = await (admin
        .from('profiles') as any)
        .select('email')
        .eq('id', acc.user_id)
        .eq('status', 'approved')
        .single()

      if (profile?.email) {
        await sendTdcReminderEmail({ to: profile.email, accountName: acc.name, paymentDay: acc.payment_day })
        results.tdc++
      }
    } catch (e) {
      results.errors.push(`tdc(${acc.user_id}): ${String(e)}`)
    }
  }

  // ── 3. Recordatorio mensual de ajuste de saldos ───────────────────────────
  const lastDayOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysUntilEnd    = lastDayOfMonth.getDate() - today.getDate()
  const isLastSunday    = today.getDay() === 0 && daysUntilEnd < 7

  if (isLastSunday) {
    const { data: profiles } = await (admin
      .from('profiles') as any)
      .select('email')
      .eq('status', 'approved')
      .not('email', 'is', null)

    for (const p of (profiles ?? [])) {
      try {
        await sendMonthlyAdjustmentEmail({ to: p.email })
        results.adjustment++
      } catch (e) {
        results.errors.push(`adjustment(${p.email}): ${String(e)}`)
      }
    }
  }

  // ── 4. Expiración de trials y suscripciones ──────────────────────────────
  const graceCutoff = new Date(today)
  graceCutoff.setDate(graceCutoff.getDate() - 2) // 2 días de gracia
  const graceCutoffStr = graceCutoff.toISOString().slice(0, 10)

  // trialing → grace (trial terminó hace ≤2 días)
  await (admin.from('profiles') as any)
    .update({ subscription_status: 'grace' })
    .eq('subscription_status', 'trialing')
    .lt('trial_ends_at', todayStr)

  // trialing/grace → expired (pasaron los 2 días de gracia)
  await (admin.from('profiles') as any)
    .update({ subscription_status: 'expired' })
    .in('subscription_status', ['trialing', 'grace'])
    .lt('trial_ends_at', graceCutoffStr)

  // active → grace si la suscripción de Stripe venció (sin pago)
  await (admin.from('profiles') as any)
    .update({ subscription_status: 'grace' })
    .eq('subscription_status', 'active')
    .not('subscription_ends_at', 'is', null)
    .lt('subscription_ends_at', todayStr)

  // grace → expired (2 días después de que venció la suscripción)
  await (admin.from('profiles') as any)
    .update({ subscription_status: 'expired' })
    .eq('subscription_status', 'grace')
    .not('subscription_ends_at', 'is', null)
    .lt('subscription_ends_at', graceCutoffStr)

  return NextResponse.json({ ok: true, date: todayStr, ...results })
}
