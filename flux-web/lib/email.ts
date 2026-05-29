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

export async function sendFriendRequestEmail(opts: {
  to: string
  toName: string
  fromName: string
  fromUsername: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flux.nevura.app'
  const html = loadTemplate('friend-request')
    .replace(/\{\{TO_NAME\}\}/g, opts.toName || opts.to)
    .replace(/\{\{FROM_NAME\}\}/g, opts.fromName)
    .replace(/\{\{FROM_USERNAME\}\}/g, opts.fromUsername)
    .replace(/\{\{APP_URL\}\}/g, appUrl)

  return send(opts.to, `${opts.fromName} quiere ser tu amigo en Flux`, html)
}

export async function sendFriendAcceptedEmail(opts: {
  to: string
  toName: string
  acceptedByName: string
  acceptedByUsername: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://flux.nevura.app'
  const html = loadTemplate('friend-accepted')
    .replace(/\{\{TO_NAME\}\}/g, opts.toName || opts.to)
    .replace(/\{\{ACCEPTED_BY_NAME\}\}/g, opts.acceptedByName)
    .replace(/\{\{ACCEPTED_BY_USERNAME\}\}/g, opts.acceptedByUsername)
    .replace(/\{\{APP_URL\}\}/g, appUrl)

  return send(opts.to, `${opts.acceptedByName} aceptó tu solicitud de amistad`, html)
}

export async function sendAppInviteEmail(opts: {
  to: string
  fromName: string
  signupUrl: string
}) {
  const html = loadTemplate('app-invite')
    .replace(/\{\{FROM_NAME\}\}/g, opts.fromName)
    .replace(/\{\{SIGNUP_URL\}\}/g, opts.signupUrl)

  return send(opts.to, `${opts.fromName} te invita a Flux`, html)
}

export async function sendSharedExpenseInviteEmail(opts: {
  to: string
  toName: string
  fromName: string
  fromUsername: string
  concept: string
  amount: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxapp-nevura.vercel.app'
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0F172A;color:#fff;padding:32px">
<div style="max-width:480px;margin:auto">
  <h2 style="color:#64D2FF;margin-bottom:4px">Gasto compartido</h2>
  <p style="color:#94a3b8;margin-top:0">@${opts.fromUsername} te invita a dividir un gasto</p>
  <div style="background:#1C1C1E;border-radius:16px;padding:20px;margin:20px 0">
    <p style="margin:0;font-size:18px;font-weight:bold">${opts.concept}</p>
    <p style="margin:8px 0 0;font-size:24px;font-weight:900;color:#64D2FF">${opts.amount}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">tu parte</p>
  </div>
  <a href="${appUrl}" style="display:block;background:#007AFF;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-weight:900">
    Abrir Flux para aceptar
  </a>
  <p style="color:#475569;font-size:12px;margin-top:24px;text-align:center">Flux · Finanzas personales</p>
</div></body></html>`
  return send(opts.to, `${opts.fromName} te invita a dividir: ${opts.concept}`, html)
}

export async function sendSharedExpensePaidEmail(opts: {
  to: string
  toName: string
  fromName: string
  fromUsername: string
  concept: string
  amount: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxapp-nevura.vercel.app'
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0F172A;color:#fff;padding:32px">
<div style="max-width:480px;margin:auto">
  <h2 style="color:#30D158;margin-bottom:4px">Pago reportado</h2>
  <p style="color:#94a3b8;margin-top:0">@${opts.fromUsername} reporta que pagó su parte</p>
  <div style="background:#1C1C1E;border-radius:16px;padding:20px;margin:20px 0">
    <p style="margin:0;font-size:18px;font-weight:bold">${opts.concept}</p>
    <p style="margin:8px 0 0;font-size:24px;font-weight:900;color:#30D158">${opts.amount}</p>
  </div>
  <a href="${appUrl}" style="display:block;background:#30D158;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-weight:900">
    Abrir Flux para confirmar
  </a>
  <p style="color:#475569;font-size:12px;margin-top:24px;text-align:center">Flux · Finanzas personales</p>
</div></body></html>`
  return send(opts.to, `${opts.fromName} pagó su parte de: ${opts.concept}`, html)
}
