import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { join } from 'path'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

function loadTemplate(name: string): string {
  return readFileSync(join(process.cwd(), 'email-templates', `${name}.html`), 'utf-8')
}

export async function sendApprovalRequestEmail(opts: {
  adminEmail: string
  applicantEmail: string
  applicantName?: string
  approveUrl: string
  rejectUrl: string
}) {
  const template = loadTemplate('approval-request')
  const html = template
    .replace(/\{\{APPLICANT_EMAIL\}\}/g, opts.applicantEmail)
    .replace(/\{\{APPLICANT_NAME\}\}/g, opts.applicantName ?? opts.applicantEmail)
    .replace(/\{\{APPROVE_URL\}\}/g, opts.approveUrl)
    .replace(/\{\{REJECT_URL\}\}/g, opts.rejectUrl)

  return getResend().emails.send({
    from: `FluxApp <${FROM}>`,
    to: opts.adminEmail,
    subject: `Nueva solicitud de acceso — ${opts.applicantEmail}`,
    html,
  })
}

export async function sendApprovalGrantedEmail(opts: {
  to: string
  loginUrl: string
}) {
  const template = loadTemplate('approval-granted')
  const html = template.replace(/\{\{LOGIN_URL\}\}/g, opts.loginUrl)

  return getResend().emails.send({
    from: `FluxApp <${FROM}>`,
    to: opts.to,
    subject: 'Tu acceso a Flux fue aprobado',
    html,
  })
}

export async function sendApprovalRejectedEmail(opts: { to: string }) {
  const template = loadTemplate('approval-rejected')

  return getResend().emails.send({
    from: `FluxApp <${FROM}>`,
    to: opts.to,
    subject: 'Solicitud de acceso a Flux',
    html: template,
  })
}

export async function sendTdcReminderEmail(opts: {
  to: string
  accountName: string
  paymentDay: number
}) {
  const html = loadTemplate('tdc-reminder')
    .replace(/\{\{ACCOUNT_NAME\}\}/g, opts.accountName)
    .replace(/\{\{PAYMENT_DAY\}\}/g, String(opts.paymentDay))

  return getResend().emails.send({
    from: `FluxApp <${FROM}>`,
    to: opts.to,
    subject: `Recordatorio: pago de ${opts.accountName} mañana`,
    html,
  })
}

export async function sendMonthlyAdjustmentEmail(opts: { to: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxapp-nevura.vercel.app'
  const html = loadTemplate('monthly-adjustment')
    .replace(/\{\{APP_URL\}\}/g, appUrl)

  return getResend().emails.send({
    from: `FluxApp <${FROM}>`,
    to: opts.to,
    subject: 'Cierre de mes — revisa tus saldos en Flux',
    html,
  })
}
