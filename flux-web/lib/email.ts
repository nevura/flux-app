// Plain server-side utility — imported by server actions and API routes.
// No 'use server' directive needed here; that's on the callers.

const FROM    = 'FluxApp Finance <no-reply@fluxappfinance.com>'
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
    ? `<tr><td style="padding-top:24px"><a href="${cta.url}" style="display:block;background:${cta.color ?? '#007AFF'};color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-size:15px;font-weight:700">${cta.label}</a></td></tr>`
    : ''
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
  <tr><td style="padding-bottom:24px">
    <span style="color:#007AFF;font-size:22px;font-weight:900;letter-spacing:-0.5px">fluxapp finance</span>
  </td></tr>
  <tr><td style="background:#FFFFFF;border-radius:20px;padding:28px;border:1px solid rgba(0,0,0,0.08);box-shadow:0 2px 12px rgba(0,0,0,0.04)">
    <h2 style="color:#1D1D1F;margin:0 0 12px;font-size:20px;font-weight:700">${title}</h2>
    ${body}${btn}
  </td></tr>
  <tr><td style="padding-top:20px;text-align:center;color:#6E6E73;font-size:12px">
    fluxapp finance &middot; <a href="${APP_URL}" style="color:#6E6E73;text-decoration:none">fluxappfinance.com</a>
    &middot; Si no esperabas este correo, ignóralo.
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

// Chip/card element reusable in light theme
function card(content: string) {
  return `<div style="background:#F5F5F7;border-radius:12px;padding:16px;border:1px solid rgba(0,0,0,0.06)">${content}</div>`
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
    `<p style="color:#6E6E73;margin:0 0 16px">Un nuevo usuario quiere acceso a FluxApp Finance.</p>
     ${card(`<p style="color:#1D1D1F;margin:0 0 4px"><strong>Email:</strong> ${opts.applicantEmail}</p>
             ${opts.applicantName ? `<p style="color:#1D1D1F;margin:0"><strong>Nombre:</strong> ${opts.applicantName}</p>` : ''}`)}
     <div style="margin-top:20px">
       <a href="${opts.approveUrl}" style="display:inline-block;background:#34C759;color:#fff;text-decoration:none;border-radius:10px;padding:10px 20px;font-weight:700;margin-right:10px">Aprobar</a>
       <a href="${opts.rejectUrl}" style="display:inline-block;background:#FF3B30;color:#fff;text-decoration:none;border-radius:10px;padding:10px 20px;font-weight:700">Rechazar</a>
     </div>`,
  )
  return send(opts.adminEmail, `Solicitud de acceso — ${opts.applicantEmail}`, html)
}

export async function sendApprovalGrantedEmail(opts: { to: string; loginUrl: string }) {
  const html = base(
    'Tu acceso fue aprobado',
    `<p style="color:#6E6E73;margin:0">Bienvenido a FluxApp Finance. Tu cuenta está activa y lista para usar.</p>`,
    { url: opts.loginUrl, label: 'Entrar a FluxApp Finance' },
  )
  return send(opts.to, 'Tu acceso a FluxApp Finance fue aprobado', html)
}

export async function sendApprovalRejectedEmail(opts: { to: string }) {
  const html = base(
    'Solicitud de acceso',
    `<p style="color:#6E6E73;margin:0">Por el momento no podemos aprobar tu solicitud. ¿Dudas? <a href="mailto:hola@fluxappfinance.com" style="color:#007AFF">hola@fluxappfinance.com</a>.</p>`,
  )
  return send(opts.to, 'Solicitud de acceso a FluxApp Finance', html)
}

export async function sendPasswordResetEmail(opts: { to: string; resetUrl: string }) {
  const html = base(
    'Restablece tu contraseña',
    `<p style="color:#6E6E73;margin:0 0 12px">Recibimos una solicitud para restablecer la contraseña de tu cuenta en FluxApp Finance.</p>
     <p style="color:#6E6E73;margin:0">Este enlace expira en 1 hora. Si no fuiste tú, ignora este correo — tu contraseña no cambiará.</p>`,
    { url: opts.resetUrl, label: 'Restablecer contraseña' },
  )
  return send(opts.to, 'Restablece tu contraseña — FluxApp Finance', html)
}

// ── TDC & monthly reminders ──────────────────────────────────────────────────

export async function sendTdcReminderEmail(opts: { to: string; accountName: string; paymentDay: number }) {
  const html = base(
    `Pago de ${opts.accountName} mañana`,
    `<p style="color:#6E6E73;margin:0 0 16px">Recuerda realizar el pago antes del día <strong style="color:#1D1D1F">${opts.paymentDay}</strong>. Puedes registrarlo desde la pantalla de inicio.</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Tarjeta</p>
             <p style="color:#1D1D1F;font-size:17px;font-weight:700;margin:0">${opts.accountName}</p>`)}`,
    { url: APP_URL, label: 'Registrar pago', color: '#FF9F0A' },
  )
  return send(opts.to, `Recordatorio: pago de ${opts.accountName} mañana`, html)
}

export async function sendMonthlyAdjustmentEmail(opts: { to: string }) {
  const html = base(
    'Cierre de mes',
    `<p style="color:#6E6E73;margin:0">Revisa tus saldos y ajusta lo necesario antes de cerrar el mes para mantener tus finanzas al día.</p>`,
    { url: APP_URL, label: 'Revisar saldos' },
  )
  return send(opts.to, 'Cierre de mes — revisa tus saldos en FluxApp Finance', html)
}

// ── System notifications ─────────────────────────────────────────────────────

export async function sendScheduledDueEmail(opts: { to: string; name: string; amount: string }) {
  const html = base(
    `Cobro pendiente: ${opts.name}`,
    `<p style="color:#6E6E73;margin:0 0 16px">Tu cobro recurrente está pendiente de registrar.</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Concepto</p>
             <p style="color:#1D1D1F;font-size:16px;font-weight:700;margin:0 0 8px">${opts.name}</p>
             <p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Monto</p>
             <p style="color:#FF3B30;font-size:22px;font-weight:900;margin:0">${opts.amount}</p>`)}`,
    { url: APP_URL, label: 'Ver en FluxApp Finance', color: '#FF3B30' },
  )
  return send(opts.to, `Cobro recurrente pendiente: ${opts.name}`, html)
}

export async function sendTdcDueEmail(opts: { to: string; accountName: string; daysUntil: number }) {
  const dueText = opts.daysUntil === 0 ? 'hoy' : opts.daysUntil === 1 ? 'mañana' : `en ${opts.daysUntil} días`
  const html = base(
    `Pago de ${opts.accountName} vence ${dueText}`,
    `<p style="color:#6E6E73;margin:0 0 16px">Tu tarjeta tiene fecha de pago próxima. Regístralo para mantener tus saldos al día.</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Tarjeta</p>
             <p style="color:#1D1D1F;font-size:16px;font-weight:700;margin:0 0 8px">${opts.accountName}</p>
             <p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Vencimiento</p>
             <p style="color:#FF9F0A;font-size:17px;font-weight:700;margin:0">${dueText.charAt(0).toUpperCase() + dueText.slice(1)}</p>`)}`,
    { url: APP_URL, label: 'Registrar pago', color: '#FF9F0A' },
  )
  return send(opts.to, `Pago de ${opts.accountName} vence ${dueText}`, html)
}

// ── Budget alerts ────────────────────────────────────────────────────────────

export async function sendBudgetAlertEmail(opts: { to: string; percent: number; spent: string; limit: string }) {
  const isRed = opts.percent >= 100
  const color = isRed ? '#FF3B30' : '#FF9F0A'
  const title = isRed ? 'Presupuesto agotado' : 'Presupuesto al 80%'
  const html = base(
    title,
    `<p style="color:#6E6E73;margin:0 0 16px">Tu gasto mensual ha alcanzado el <strong style="color:${color}">${opts.percent}%</strong> del límite establecido.</p>
     ${card(`<table width="100%" cellpadding="0" cellspacing="0">
       <tr>
         <td style="color:#6E6E73;font-size:13px;padding-bottom:6px">Gastado</td>
         <td style="color:#1D1D1F;font-weight:700;text-align:right;padding-bottom:6px">${opts.spent}</td>
       </tr>
       <tr>
         <td style="color:#6E6E73;font-size:13px;padding-bottom:12px">Límite mensual</td>
         <td style="color:#1D1D1F;font-weight:700;text-align:right;padding-bottom:12px">${opts.limit}</td>
       </tr>
       <tr>
         <td colspan="2">
           <div style="background:#E5E5EA;border-radius:6px;overflow:hidden;height:8px">
             <div style="background:${color};height:8px;width:${Math.min(opts.percent, 100)}%;border-radius:6px"></div>
           </div>
         </td>
       </tr>
     </table>`)}`,
    { url: APP_URL, label: 'Ver mis gastos', color },
  )
  return send(opts.to, `${title} — ${opts.percent}% usado este mes`, html)
}

// ── Trial expiry ─────────────────────────────────────────────────────────────

export async function sendTrialExpiryEmail(opts: { to: string; daysLeft: number; upgradeUrl: string }) {
  const html = base(
    `Tu prueba vence en ${opts.daysLeft} días`,
    `<p style="color:#6E6E73;margin:0 0 16px">Tu período de prueba gratuita está por terminar. Suscríbete para seguir usando FluxApp Finance sin interrupciones.</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0 0 4px;text-align:center">Días restantes</p>
             <p style="color:#FF9F0A;font-size:48px;font-weight:900;margin:0;text-align:center;line-height:1">${opts.daysLeft}</p>`)}`,
    { url: opts.upgradeUrl, label: 'Ver planes de suscripción' },
  )
  return send(opts.to, `Tu prueba de FluxApp Finance vence en ${opts.daysLeft} días`, html)
}

export async function sendGraceStartedEmail(opts: { to: string; graceDays: number; upgradeUrl: string }) {
  const html = base(
    'Tu prueba terminó',
    `<p style="color:#6E6E73;margin:0 0 16px">Tu período de prueba gratuita terminó. Tienes ${opts.graceDays} días más de acceso completo para suscribirte — después, tu cuenta pasa a modo solo lectura (tus datos seguirán guardados).</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0 0 4px;text-align:center">Días de gracia restantes</p>
             <p style="color:#FF3B30;font-size:48px;font-weight:900;margin:0;text-align:center;line-height:1">${opts.graceDays}</p>`)}`,
    { url: opts.upgradeUrl, label: 'Ver planes de suscripción', color: '#FF3B30' },
  )
  return send(opts.to, 'Tu prueba terminó — tienes días de gracia para suscribirte', html)
}

/** Generic fallback used by lib/notify.ts for notification types that don't
 * have a dedicated branded template — keeps every notification type covered
 * by instant email without requiring a bespoke template for each one. */
export async function sendGenericNotificationEmail(opts: { to: string; subject: string; text: string }) {
  const html = base(
    opts.subject,
    `<p style="color:#6E6E73;margin:0">${opts.text}</p>`,
    { url: APP_URL + '/home', label: 'Abrir Flux' },
  )
  return send(opts.to, opts.subject, html)
}

// ── Support ──────────────────────────────────────────────────────────────────

export async function sendSupportReplyEmail(opts: { to: string; userName: string; originalMessage: string; reply: string }) {
  const html = base(
    'Respuesta de soporte',
    `<p style="color:#6E6E73;margin:0 0 16px">Hola <strong style="color:#1D1D1F">${opts.userName}</strong>, hemos respondido a tu mensaje.</p>
     ${card(`<p style="color:#6E6E73;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px">Tu mensaje</p>
             <p style="color:#6E6E73;font-size:14px;margin:0 0 16px;border-left:3px solid #E5E5EA;padding-left:10px">${opts.originalMessage.replace(/\n/g, '<br>')}</p>
             <p style="color:#6E6E73;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px">Respuesta</p>
             <p style="color:#1D1D1F;font-size:14px;margin:0;border-left:3px solid #007AFF;padding-left:10px">${opts.reply.replace(/\n/g, '<br>')}</p>`)}
     <p style="color:#6E6E73;font-size:13px;margin:16px 0 0">¿Tienes más preguntas? Contáctanos en <a href="mailto:hola@fluxappfinance.com" style="color:#007AFF">hola@fluxappfinance.com</a>.</p>`,
    { url: APP_URL, label: 'Abrir FluxApp Finance' },
  )
  return send(opts.to, 'Respuesta a tu mensaje de soporte — FluxApp Finance', html)
}

// ── Re-engagement & shortcut reminder ───────────────────────────────────────

export async function sendReengagementEmail(opts: { to: string; userName: string; daysSince: number; hasShortcut: boolean }) {
  const days = opts.daysSince
  const dayLabel = days === 1 ? 'ayer' : `hace ${days} días`
  const html = base(
    `¿Cómo van tus finanzas?`,
    `<p style="color:#6E6E73;margin:0 0 16px">Hola <strong style="color:#1D1D1F">${opts.userName}</strong>, tu último movimiento fue ${dayLabel}.</p>
     <p style="color:#6E6E73;margin:0 0 16px">Registrar tus gastos consistentemente es lo que hace que FluxApp Finance funcione — entre más datos tienes, mejor ves a dónde va tu dinero.</p>
     ${!opts.hasShortcut ? `<div style="background:#F5F5F7;border-radius:12px;padding:16px;border:1px solid rgba(0,0,0,0.06);margin-bottom:16px">
       <p style="color:#1D1D1F;font-size:14px;font-weight:700;margin:0 0 6px">💡 Truco: instala el Atajo de Apple Pay</p>
       <p style="color:#6E6E73;font-size:13px;margin:0">Registra gastos automáticamente al pagar — sin abrir la app. Ve a Configuración → Atajos.</p>
     </div>` : ''}`,
    { url: APP_URL, label: 'Registrar un movimiento' },
  )
  return send(opts.to, `¿Cómo van tus finanzas, ${opts.userName}?`, html)
}

export async function sendShortcutReminderEmail(opts: { to: string; userName: string }) {
  const html = base(
    'Registra gastos sin abrir la app ⚡',
    `<p style="color:#6E6E73;margin:0 0 16px">Hola <strong style="color:#1D1D1F">${opts.userName}</strong>, aún no has instalado el Atajo de Apple Pay.</p>
     ${card(`<p style="color:#1D1D1F;font-size:15px;font-weight:700;margin:0 0 8px">¿Qué hace el Atajo?</p>
             <p style="color:#6E6E73;font-size:14px;margin:0 0 6px">• Cada vez que pagas con Apple Pay, Flux registra el gasto automáticamente</p>
             <p style="color:#6E6E73;font-size:14px;margin:0 0 6px">• No tienes que abrir la app ni recordar el monto</p>
             <p style="color:#6E6E73;font-size:14px;margin:0">• Tarda menos de 2 minutos en configurar</p>`)}
     <p style="color:#6E6E73;font-size:13px;margin:16px 0 0">Ve a <strong style="color:#1D1D1F">Configuración → Atajos</strong> dentro de la app para instalarlo.</p>`,
    { url: `${APP_URL}/settings`, label: 'Instalar Atajo de Apple Pay', color: '#bf5af2' },
  )
  return send(opts.to, 'Registra gastos sin abrir la app — Atajo de Apple Pay', html)
}

// ── Friends ──────────────────────────────────────────────────────────────────

export async function sendFriendRequestEmail(opts: {
  to: string; toName: string; fromName: string; fromUsername: string
}) {
  const html = base(
    'Solicitud de amistad',
    `<p style="color:#6E6E73;margin:0 0 16px"><strong style="color:#1D1D1F">${opts.fromName}</strong> (@${opts.fromUsername}) quiere conectar contigo en FluxApp Finance para dividir gastos.</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0">Abre la app para aceptar o rechazar la solicitud.</p>`)}`,
    { url: APP_URL, label: 'Ver solicitud' },
  )
  return send(opts.to, `${opts.fromName} quiere ser tu amigo en FluxApp Finance`, html)
}

export async function sendFriendAcceptedEmail(opts: {
  to: string; toName: string; acceptedByName: string; acceptedByUsername: string
}) {
  const html = base(
    'Solicitud aceptada',
    `<p style="color:#6E6E73;margin:0"><strong style="color:#1D1D1F">${opts.acceptedByName}</strong> (@${opts.acceptedByUsername}) aceptó tu solicitud. Ya pueden dividir gastos juntos.</p>`,
    { url: APP_URL, label: 'Abrir FluxApp Finance', color: '#34C759' },
  )
  return send(opts.to, `${opts.acceptedByName} aceptó tu solicitud de amistad`, html)
}

export async function sendAppInviteEmail(opts: { to: string; fromName: string; signupUrl: string }) {
  const html = base(
    'Te invitan a FluxApp Finance',
    `<p style="color:#6E6E73;margin:0"><strong style="color:#1D1D1F">${opts.fromName}</strong> te invita a FluxApp Finance, la app de finanzas personales donde pueden dividir gastos fácilmente.</p>`,
    { url: opts.signupUrl, label: 'Crear cuenta gratis' },
  )
  return send(opts.to, `${opts.fromName} te invita a FluxApp Finance`, html)
}

// ── Shared expenses ──────────────────────────────────────────────────────────

export async function sendSharedExpenseInviteEmail(opts: {
  to: string; toName: string; fromName: string; fromUsername: string; concept: string; amount: string
}) {
  const html = base(
    `@${opts.fromUsername} pagó y dice que le debes`,
    `<p style="color:#6E6E73;margin:0 0 16px"><strong style="color:#1D1D1F">${opts.fromName}</strong> pagó <strong style="color:#1D1D1F">${opts.concept}</strong> e incluye tu parte en el cobro.</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Concepto</p>
             <p style="color:#1D1D1F;font-size:16px;font-weight:700;margin:0 0 10px">${opts.concept}</p>
             <p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Tu parte</p>
             <p style="color:#007AFF;font-size:22px;font-weight:900;margin:0">${opts.amount}</p>`)}
     <div style="margin-top:16px;padding:14px;background:#F0F6FF;border-radius:12px;border:1px solid rgba(0,122,255,0.12)">
       <p style="color:#1D1D1F;font-size:14px;font-weight:700;margin:0 0 6px">¿Qué hago?</p>
       <p style="color:#6E6E73;font-size:13px;margin:0 0 4px">1. Abre la notificación en FluxApp Finance</p>
       <p style="color:#6E6E73;font-size:13px;margin:0 0 4px">2. Toca <strong style="color:#1D1D1F">Sí, lo debo</strong> para guardarlo</p>
       <p style="color:#6E6E73;font-size:13px;margin:0">3. Ve a <strong style="color:#1D1D1F">Compartidos</strong> cuando lo hayas pagado y regístralo</p>
     </div>
     <p style="color:#6E6E73;font-size:12px;margin:12px 0 0">No tienes que pagar ahora. Al aceptar, <strong style="color:#1D1D1F">tu saldo y cuentas no cambian</strong> — solo cuando registres el pago desde Compartidos.</p>`,
    { url: APP_URL, label: 'Ver en FluxApp Finance', color: '#007AFF' },
  )
  return send(opts.to, `${opts.fromName} pagó ${opts.concept} — te toca ${opts.amount}`, html)
}

export async function sendSharedExpensePaidEmail(opts: {
  to: string; toName: string; fromName: string; fromUsername: string; concept: string; amount: string
}) {
  const html = base(
    `@${opts.fromUsername} dice que ya te pagó`,
    `<p style="color:#6E6E73;margin:0 0 16px"><strong style="color:#1D1D1F">${opts.fromName}</strong> marcó su parte de <strong style="color:#1D1D1F">${opts.concept}</strong> como pagada y necesita que lo confirmes.</p>
     ${card(`<p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Concepto</p>
             <p style="color:#1D1D1F;font-size:16px;font-weight:700;margin:0 0 10px">${opts.concept}</p>
             <p style="color:#6E6E73;font-size:13px;margin:0 0 4px">Monto reportado</p>
             <p style="color:#34C759;font-size:22px;font-weight:900;margin:0">${opts.amount}</p>`)}
     <div style="margin-top:16px;padding:14px;background:#F0FFF4;border-radius:12px;border:1px solid rgba(52,199,89,0.15)">
       <p style="color:#1D1D1F;font-size:14px;font-weight:700;margin:0 0 6px">¿Qué hago?</p>
       <p style="color:#6E6E73;font-size:13px;margin:0 0 4px">• Si <strong style="color:#1D1D1F">sí recibiste el pago</strong>: abre la app y toca <strong style="color:#34C759">✓ Sí, me pagó</strong></p>
       <p style="color:#6E6E73;font-size:13px;margin:0">• Si <strong style="color:#1D1D1F">no recibiste nada</strong>: toca <strong style="color:#FF3B30">No recibí nada</strong> y el saldo queda pendiente</p>
     </div>`,
    { url: APP_URL, label: 'Confirmar o rechazar en FluxApp Finance', color: '#34C759' },
  )
  return send(opts.to, `${opts.fromName} dice que ya te pagó — ${opts.concept}`, html)
}

// ── Admin: new user registered ───────────────────────────────────────────────

export async function sendNewUserRegistrationEmail(opts: {
  adminEmail: string
  userEmail: string
  userName?: string
  provider: string
}) {
  const html = base(
    'Nuevo usuario registrado',
    `<p style="color:#6E6E73;margin:0 0 16px">Alguien acaba de crear una cuenta en FluxApp Finance.</p>
     ${card(`<p style="color:#1D1D1F;margin:0 0 4px"><strong>Email:</strong> ${opts.userEmail}</p>
             ${opts.userName ? `<p style="color:#1D1D1F;margin:0 0 4px"><strong>Nombre:</strong> ${opts.userName}</p>` : ''}
             <p style="color:#6E6E73;margin:0;font-size:13px">Método: ${opts.provider}</p>`)}`,
    { url: `${APP_URL}/admin`, label: 'Ver en Admin', color: '#007AFF' },
  )
  return send(opts.adminEmail, `Nuevo usuario — ${opts.userEmail}`, html)
}
