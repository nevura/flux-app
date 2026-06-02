// Plain server-side utility — imported by server actions and API routes.
// No 'use server' directive needed here; that's on the callers.

const FROM = 'Flux App <no-reply@fluxappfinance.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) { console.warn('[email] RESEND_API_KEY not set — skipping email to', to); return }
  const { Resend } = await import('resend')
  const resend = new Resend(key)
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) console.error('[email]', error)
}

function base(title: string, body: string, cta?: { url: string; label: string; color?: string }) {
  const btn = cta
    ? `<tr><td style="padding-top:20px"><a href="${cta.url}" style="display:block;background:${cta.color ?? '#007AFF'};color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-size:15px;font-weight:900">${cta.label}</a></td></tr>`
    : ''
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
  <tr><td style="padding-bottom:20px">
    <span style="color:#007AFF;font-size:22px;font-weight:900;letter-spacing:-0.5px">Flux</span>
    <span style="color:#334155;font-size:14px;margin-left:8px">Finanzas personales</span>
  </td></tr>
  <tr><td style="background:#0F172A;border-radius:20px;padding:28px;border:1px solid #1E293B">
    <h2 style="color:#F8FAFC;margin:0 0 12px;font-size:20px;font-weight:900">${title}</h2>
    ${body}${btn}
  </td></tr>
  <tr><td style="padding-top:20px;text-align:center;color:#475569;font-size:12px">
    Flux &middot; <a href="${APP_URL}" style="color:#64748B;text-decoration:none">fluxappfinance.com</a>
    &middot; Si no esperabas este correo, ignóralo.
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

// ── Approval flow ────────────────────────────────────────────────────────────

export async function sendApprovalRequestEmail(opts: {
  adminEmail: string
  applicantEmail: string
  applicantName?: string
  approveUrl: string
  rejectUrl: string
}) {
  const html = base(
    'Nueva solicitud de acceso',
    `<p style="color:#94A3B8;margin:0 0 16px">Un nuevo usuario quiere acceso a Flux.</p>
     <p style="color:#F8FAFC;margin:0"><strong>Email:</strong> ${opts.applicantEmail}</p>
     ${opts.applicantName ? `<p style="color:#F8FAFC;margin:4px 0 0"><strong>Nombre:</strong> ${opts.applicantName}</p>` : ''}
     <div style="margin-top:20px">
       <a href="${opts.approveUrl}" style="display:inline-block;background:#30D158;color:#fff;text-decoration:none;border-radius:10px;padding:10px 20px;font-weight:900;margin-right:10px">Aprobar</a>
       <a href="${opts.rejectUrl}" style="display:inline-block;background:#FF453A;color:#fff;text-decoration:none;border-radius:10px;padding:10px 20px;font-weight:900">Rechazar</a>
     </div>`,
  )
  return send(opts.adminEmail, `Solicitud de acceso — ${opts.applicantEmail}`, html)
}

export async function sendApprovalGrantedEmail(opts: { to: string; loginUrl: string }) {
  const html = base(
    'Tu acceso fue aprobado',
    `<p style="color:#94A3B8;margin:0">Bienvenido a Flux. Tu cuenta está activa y lista para usar.</p>`,
    { url: opts.loginUrl, label: 'Entrar a Flux' },
  )
  return send(opts.to, 'Tu acceso a Flux fue aprobado', html)
}

export async function sendApprovalRejectedEmail(opts: { to: string }) {
  const html = base(
    'Solicitud de acceso',
    `<p style="color:#94A3B8;margin:0">Por el momento no podemos aprobar tu solicitud. Dudas: <a href="mailto:hola@fluxappfinance.com" style="color:#007AFF">hola@fluxappfinance.com</a>.</p>`,
  )
  return send(opts.to, 'Solicitud de acceso a Flux', html)
}

// ── TDC & monthly reminders ──────────────────────────────────────────────────

export async function sendTdcReminderEmail(opts: { to: string; accountName: string; paymentDay: number }) {
  const html = base(
    `Pago de ${opts.accountName} mañana`,
    `<p style="color:#94A3B8;margin:0 0 8px">Recuerda realizar el pago antes del día <strong style="color:#F8FAFC">${opts.paymentDay}</strong>.</p>
     <p style="color:#94A3B8;margin:0">Puedes registrarlo desde la pantalla de inicio en Flux.</p>`,
    { url: APP_URL, label: 'Registrar pago', color: '#FF9F0A' },
  )
  return send(opts.to, `Recordatorio: pago de ${opts.accountName} mañana`, html)
}

export async function sendMonthlyAdjustmentEmail(opts: { to: string }) {
  const html = base(
    'Cierre de mes',
    `<p style="color:#94A3B8;margin:0">Revisa tus saldos y ajusta lo necesario antes de cerrar el mes.</p>`,
    { url: APP_URL, label: 'Revisar saldos' },
  )
  return send(opts.to, 'Cierre de mes — revisa tus saldos en Flux', html)
}

// ── System notifications ─────────────────────────────────────────────────────

export async function sendScheduledDueEmail(opts: { to: string; name: string; amount: string }) {
  const html = base(
    `Cobro pendiente: ${opts.name}`,
    `<p style="color:#94A3B8;margin:0 0 12px">Tu cobro recurrente está pendiente de registrar.</p>
     <div style="background:#1C1C2E;border-radius:12px;padding:16px">
       <p style="margin:0;font-size:16px;font-weight:bold;color:#F8FAFC">${opts.name}</p>
       <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#FF453A">${opts.amount}</p>
     </div>`,
    { url: APP_URL, label: 'Registrar en Flux', color: '#FF453A' },
  )
  return send(opts.to, `Cobro recurrente pendiente: ${opts.name}`, html)
}

export async function sendTdcDueEmail(opts: { to: string; accountName: string; daysUntil: number }) {
  const dueText = opts.daysUntil === 0 ? 'hoy' : opts.daysUntil === 1 ? 'mañana' : `en ${opts.daysUntil} días`
  const html = base(
    `Pago de ${opts.accountName} vence ${dueText}`,
    `<p style="color:#94A3B8;margin:0">Tu tarjeta <strong style="color:#F8FAFC">${opts.accountName}</strong> tiene fecha de pago <strong style="color:#FF9F0A">${dueText}</strong>. Registra el pago en Flux para mantener tus saldos al día.</p>`,
    { url: APP_URL, label: 'Registrar pago', color: '#FF9F0A' },
  )
  return send(opts.to, `Pago de ${opts.accountName} vence ${dueText}`, html)
}

// ── Friends ──────────────────────────────────────────────────────────────────

export async function sendFriendRequestEmail(opts: {
  to: string; toName: string; fromName: string; fromUsername: string
}) {
  const html = base(
    'Solicitud de amistad',
    `<p style="color:#94A3B8;margin:0"><strong style="color:#F8FAFC">${opts.fromName}</strong> (@${opts.fromUsername}) quiere conectar contigo en Flux para dividir gastos.</p>`,
    { url: APP_URL, label: 'Ver solicitud' },
  )
  return send(opts.to, `${opts.fromName} quiere ser tu amigo en Flux`, html)
}

export async function sendFriendAcceptedEmail(opts: {
  to: string; toName: string; acceptedByName: string; acceptedByUsername: string
}) {
  const html = base(
    'Solicitud aceptada',
    `<p style="color:#94A3B8;margin:0"><strong style="color:#F8FAFC">${opts.acceptedByName}</strong> (@${opts.acceptedByUsername}) aceptó tu solicitud. Ya pueden dividir gastos juntos.</p>`,
    { url: APP_URL, label: 'Abrir Flux', color: '#30D158' },
  )
  return send(opts.to, `${opts.acceptedByName} aceptó tu solicitud de amistad`, html)
}

export async function sendAppInviteEmail(opts: { to: string; fromName: string; signupUrl: string }) {
  const html = base(
    'Te invitan a Flux',
    `<p style="color:#94A3B8;margin:0"><strong style="color:#F8FAFC">${opts.fromName}</strong> te invita a Flux, la app de finanzas personales donde pueden dividir gastos fácilmente.</p>`,
    { url: opts.signupUrl, label: 'Crear cuenta gratis' },
  )
  return send(opts.to, `${opts.fromName} te invita a Flux`, html)
}

// ── Shared expenses ──────────────────────────────────────────────────────────

export async function sendSharedExpenseInviteEmail(opts: {
  to: string; toName: string; fromName: string; fromUsername: string; concept: string; amount: string
}) {
  const html = base(
    'Gasto compartido',
    `<p style="color:#94A3B8;margin:0 0 12px"><strong style="color:#F8FAFC">@${opts.fromUsername}</strong> te invita a dividir un gasto.</p>
     <div style="background:#1C1C2E;border-radius:12px;padding:16px">
       <p style="margin:0;font-size:16px;font-weight:bold;color:#F8FAFC">${opts.concept}</p>
       <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#64D2FF">${opts.amount}</p>
       <p style="margin:2px 0 0;font-size:12px;color:#64748B">tu parte</p>
     </div>`,
    { url: APP_URL, label: 'Aceptar en Flux', color: '#64D2FF' },
  )
  return send(opts.to, `${opts.fromName} te invita a dividir: ${opts.concept}`, html)
}

export async function sendSharedExpensePaidEmail(opts: {
  to: string; toName: string; fromName: string; fromUsername: string; concept: string; amount: string
}) {
  const html = base(
    'Pago reportado',
    `<p style="color:#94A3B8;margin:0 0 12px"><strong style="color:#F8FAFC">@${opts.fromUsername}</strong> reporta que pagó su parte.</p>
     <div style="background:#1C1C2E;border-radius:12px;padding:16px">
       <p style="margin:0;font-size:16px;font-weight:bold;color:#F8FAFC">${opts.concept}</p>
       <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#30D158">${opts.amount}</p>
     </div>`,
    { url: APP_URL, label: 'Confirmar en Flux', color: '#30D158' },
  )
  return send(opts.to, `${opts.fromName} pagó su parte de: ${opts.concept}`, html)
}
