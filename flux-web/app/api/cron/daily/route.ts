import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adjustmentFor, getMexicoNow, nextRecurringDate, formatCurrency } from '@/lib/utils'
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

  // Collect user emails for grouped recurring charge notification
  const recurringByUser: Record<string, { email: string; items: { name: string; amount: number }[] }> = {}

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

        // Collect for grouped email notification
        if (!recurringByUser[s.user_id]) {
          const { data: prof } = await (admin.from('profiles') as any)
            .select('email').eq('id', s.user_id).eq('status', 'approved').single()
          if (prof?.email) recurringByUser[s.user_id] = { email: prof.email, items: [] }
        }
        recurringByUser[s.user_id]?.items.push({ name: s.name, amount: Number(s.amount) })

        results.recurring++
      } catch (e) {
        results.errors.push(`recurring(${s.id}): ${String(e)}`)
      }
    }
  }

  // Send one grouped email per user for all their recurring charges today
  for (const [, { email, items }] of Object.entries(recurringByUser)) {
    if (!items.length) continue
    const total = items.reduce((s, i) => s + i.amount, 0)
    const firstName = items[0].name
    const subject = items.length === 1
      ? `Cobro registrado hoy: ${firstName}`
      : `${items.length} cobros registrados hoy en Flux`
    // Reuse sendScheduledDueEmail with a composite amount for single items,
    // or build a multi-item message
    const itemList = items.map(i => `<li style="margin:4px 0;color:#F8FAFC">${i.name} — <strong>${formatCurrency(i.amount)}</strong></li>`).join('')
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromAddr = 'Flux App <no-reply@send.fluxappfinance.com>'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
  <tr><td style="padding-bottom:20px"><span style="color:#007AFF;font-size:22px;font-weight:900">Flux</span></td></tr>
  <tr><td style="background:#0F172A;border-radius:20px;padding:28px;border:1px solid #1E293B">
    <h2 style="color:#F8FAFC;margin:0 0 12px;font-size:20px;font-weight:900">Cobros de hoy</h2>
    <p style="color:#94A3B8;margin:0 0 16px">Se registraron automáticamente y requieren validación en la app.</p>
    <ul style="margin:0 0 16px;padding-left:20px">${itemList}</ul>
    <div style="background:#1C1C2E;border-radius:12px;padding:12px 16px">
      <span style="color:#94A3B8;font-size:13px">Total hoy</span>
      <span style="color:#FF453A;font-size:20px;font-weight:900;margin-left:12px">${formatCurrency(total)}</span>
    </div>
    <a href="${appUrl}" style="display:block;background:#007AFF;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-size:15px;font-weight:900;margin-top:20px">Validar en Flux</a>
  </td></tr>
  <tr><td style="padding-top:20px;text-align:center;color:#475569;font-size:12px">
    Flux &middot; <a href="${appUrl}" style="color:#64748B;text-decoration:none">fluxappfinance.com</a>
  </td></tr>
</table></td></tr></table>
</body></html>`
    await resend.emails.send({ from: fromAddr, to: email, subject, html }).catch(() => {})
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
