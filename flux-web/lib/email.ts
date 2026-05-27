import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import { join } from 'path'

let _transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    })
  }
  return _transporter
}

const FROM = `FluxApp <${process.env.GMAIL_USER ?? 'nevura.solutions@gmail.com'}>`

function loadTemplate(name: string): string {
  return readFileSync(join(process.cwd(), 'email-templates', `${name}.html`), 'utf-8')
}

async function send(to: string, subject: string, html: string) {
  return getTransporter().sendMail({ from: FROM, to, subject, html })
}

export async function sendApprovalRequestEmail(opts: {
  adminEmail: string
  applicantEmail: string
  applicantName?: string
  approveUrl: string
  rejectUrl: string
}) {
  const html = loadTemplate('approval-request')
    .replace(/\{\{APPLICANT_EMAIL\}\}/g, opts.applicantEmail)
    .replace(/\{\{APPLICANT_NAME\}\}/g, opts.applicantName ?? opts.applicantEmail)
    .replace(/\{\{APPROVE_URL\}\}/g, opts.approveUrl)
    .replace(/\{\{REJECT_URL\}\}/g, opts.rejectUrl)

  return send(opts.adminEmail, `Nueva solicitud de acceso — ${opts.applicantEmail}`, html)
}

export async function sendApprovalGrantedEmail(opts: { to: string; loginUrl: string }) {
  const html = loadTemplate('approval-granted')
    .replace(/\{\{LOGIN_URL\}\}/g, opts.loginUrl)

  return send(opts.to, 'Tu acceso a Flux fue aprobado', html)
}

export async function sendApprovalRejectedEmail(opts: { to: string }) {
  return send(opts.to, 'Solicitud de acceso a Flux', loadTemplate('approval-rejected'))
}

export async function sendTdcReminderEmail(opts: {
  to: string
  accountName: string
  paymentDay: number
}) {
  const html = loadTemplate('tdc-reminder')
    .replace(/\{\{ACCOUNT_NAME\}\}/g, opts.accountName)
    .replace(/\{\{PAYMENT_DAY\}\}/g, String(opts.paymentDay))

  return send(opts.to, `Recordatorio: pago de ${opts.accountName} mañana`, html)
}

export async function sendMonthlyAdjustmentEmail(opts: { to: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxapp-nevura.vercel.app'
  const html = loadTemplate('monthly-adjustment')
    .replace(/\{\{APP_URL\}\}/g, appUrl)

  return send(opts.to, 'Cierre de mes — revisa tus saldos en Flux', html)
}
