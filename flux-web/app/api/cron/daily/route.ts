import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adjustmentFor, getMexicoNow, nextRecurringDate, formatCurrency } from '@/lib/utils'
import { sendTdcReminderEmail, sendMonthlyAdjustmentEmail, sendTrialExpiryEmail, sendShortcutReminderEmail, sendReengagementEmail } from '@/lib/email'

export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const todayStr = getMexicoNow().slice(0, 10) // 'YYYY-MM-DD'
  const today    = new Date(todayStr)

  const results = { recurring: 0, tdc: 0, adjustment: 0, trialWarnings: 0, shortcutReminders: 0, reengagements: 0, errors: [] as string[] }

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
    const fromAddr = 'FluxApp Finance <no-reply@fluxappfinance.com>'
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

  // ── 5. Aviso de fin de trial (3-5 días antes) ─────────────────────────────
  const in3Days = new Date(today); in3Days.setDate(in3Days.getDate() + 3)
  const in5Days = new Date(today); in5Days.setDate(in5Days.getDate() + 5)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'

  const { data: expiringTrials } = await (admin.from('profiles') as any)
    .select('id, email, trial_ends_at')
    .eq('subscription_status', 'trialing')
    .eq('status', 'approved')
    .gte('trial_ends_at', in3Days.toISOString().slice(0, 10))
    .lte('trial_ends_at', in5Days.toISOString().slice(0, 10))

  for (const p of (expiringTrials ?? [])) {
    try {
      // Only notify once per user — check if notification already exists ever
      const { data: alreadySent } = await (admin.from('notifications') as any)
        .select('id').eq('user_id', p.id).eq('type', 'trial_expiring').maybeSingle()
      if (alreadySent) continue

      const daysLeft = Math.ceil((new Date(p.trial_ends_at).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      await (admin.from('notifications') as any).insert({
        user_id: p.id,
        type: 'trial_expiring',
        data: { days_left: String(daysLeft) },
      })

      if (p.email) {
        sendTrialExpiryEmail({ to: p.email, daysLeft, upgradeUrl: `${appUrl}/settings` }).catch(() => {})
      }

      results.trialWarnings++
    } catch (e) {
      results.errors.push(`trial_expiry(${p.id}): ${String(e)}`)
    }
  }

  // ── 6. Recordatorio de Atajo (usuarios que nunca lo han usado) ───────────────
  // Only run on Tuesdays (day 2) to keep a predictable weekly cadence
  if (today.getDay() === 2) {
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    // Get approved active users who signed up at least 3 days ago
    const { data: candidates } = await (admin.from('profiles') as any)
      .select('id, email, full_name')
      .eq('status', 'approved')
      .in('subscription_status', ['trialing', 'active'])
      .lte('created_at', threeDaysAgo.toISOString())
      .not('email', 'is', null)

    // Get which of those users have EVER used a shortcut
    const candidateIds: string[] = (candidates ?? []).map((p: any) => p.id)
    const { data: usedTokens } = candidateIds.length > 0
      ? await (admin.from('shortcut_tokens') as any)
          .select('user_id')
          .in('user_id', candidateIds)
          .not('last_used_at', 'is', null)
      : { data: [] }

    const usedSet = new Set((usedTokens ?? []).map((t: any) => t.user_id))

    // 14-day dedup window
    const dedup14dAgo = new Date(today)
    dedup14dAgo.setDate(dedup14dAgo.getDate() - 14)

    for (const p of (candidates ?? [])) {
      if (usedSet.has(p.id)) continue  // already using shortcuts

      try {
        const { data: alreadySent } = await (admin.from('notifications') as any)
          .select('id')
          .eq('user_id', p.id)
          .eq('type', 'shortcut_reminder')
          .gte('created_at', dedup14dAgo.toISOString())
          .maybeSingle()

        if (alreadySent) continue

        await (admin.from('notifications') as any).insert({
          user_id: p.id,
          type: 'shortcut_reminder',
          data: {},
        })

        const userName = p.full_name ?? p.email?.split('@')[0] ?? 'ahí'
        sendShortcutReminderEmail({ to: p.email, userName }).catch(() => {})
        results.shortcutReminders++
      } catch (e) {
        results.errors.push(`shortcut_reminder(${p.id}): ${String(e)}`)
      }
    }
  }

  // ── 7. Re-engagement para usuarios inactivos (sin movimientos en 7+ días) ───
  // Run every day — dedup prevents over-sending
  {
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: activeUsers } = await (admin.from('profiles') as any)
      .select('id, email, full_name')
      .eq('status', 'approved')
      .in('subscription_status', ['trialing', 'active'])
      .lte('created_at', threeDaysAgo.toISOString())
      .not('email', 'is', null)

    if ((activeUsers ?? []).length > 0) {
      const activeIds: string[] = (activeUsers ?? []).map((p: any) => p.id)

      // Get latest transaction per user (just user_id + created_at)
      const { data: recentTx } = await (admin.from('transactions') as any)
        .select('user_id, created_at')
        .in('user_id', activeIds)
        .gte('created_at', sevenDaysAgo.toISOString())

      const activeUserIds = new Set((recentTx ?? []).map((t: any) => t.user_id))

      // Get all transactions to compute last date for inactive users
      const { data: lastTxAll } = await (admin.from('transactions') as any)
        .select('user_id, created_at')
        .in('user_id', activeIds)
        .order('created_at', { ascending: false })
        .limit(activeIds.length * 2)

      const lastTxMap: Record<string, string> = {}
      for (const t of (lastTxAll ?? [])) {
        if (!lastTxMap[t.user_id]) lastTxMap[t.user_id] = t.created_at
      }

      // shortcut usage map for inactive users
      const { data: shortcutTokens } = await (admin.from('shortcut_tokens') as any)
        .select('user_id, last_used_at')
        .in('user_id', activeIds)

      const shortcutUsedMap: Record<string, boolean> = {}
      for (const tok of (shortcutTokens ?? [])) {
        if (tok.last_used_at) shortcutUsedMap[tok.user_id] = true
      }

      const dedup7dAgo = new Date(today)
      dedup7dAgo.setDate(dedup7dAgo.getDate() - 7)

      for (const p of (activeUsers ?? [])) {
        if (activeUserIds.has(p.id)) continue  // had recent activity

        try {
          const { data: alreadySent } = await (admin.from('notifications') as any)
            .select('id')
            .eq('user_id', p.id)
            .eq('type', 'reengagement')
            .gte('created_at', dedup7dAgo.toISOString())
            .maybeSingle()

          if (alreadySent) continue

          const lastTxAt = lastTxMap[p.id]
          const daysSince = lastTxAt
            ? Math.floor((today.getTime() - new Date(lastTxAt).getTime()) / (1000 * 60 * 60 * 24))
            : 7

          await (admin.from('notifications') as any).insert({
            user_id: p.id,
            type: 'reengagement',
            data: { days_since: String(daysSince) },
          })

          const userName = p.full_name ?? p.email?.split('@')[0] ?? 'ahí'
          sendReengagementEmail({
            to: p.email,
            userName,
            daysSince,
            hasShortcut: !!shortcutUsedMap[p.id],
          }).catch(() => {})
          results.reengagements++
        } catch (e) {
          results.errors.push(`reengagement(${p.id}): ${String(e)}`)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, date: todayStr, ...results })
}
