'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSupportReplyEmail } from '@/lib/email'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'bernardo.perezro06@gmail.com'
const FROM_EMAIL  = 'FluxApp Finance <no-reply@fluxappfinance.com>'

async function sendAdminEmail(subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  // Lazy instantiation — avoid module-level constructor that throws at build time
  const { Resend: ResendClient } = await import('resend')
  const resend = new ResendClient(key)
  await resend.emails.send({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject, html }).catch(() => {})
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('No autorizado')
  return user
}

export interface AdminProfile {
  id: string
  email: string | null
  full_name: string | null
  username: string | null
  phone: string | null
  status: 'pending' | 'approved' | 'rejected'
  subscription_status: string
  stripe_customer_id: string | null
  trial_ends_at: string | null
  subscription_ends_at: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
  tx_count: number
  acc_count: number
}

export interface SupportTicket {
  id: string
  user_id: string
  message: string
  admin_reply: string | null
  is_read: boolean
  created_at: string
  replied_at: string | null
  user_email?: string | null
  user_name?: string | null
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  await verifyAdmin()
  const admin = createAdminClient()

  const [{ data: profiles }, { data: txData }, { data: accData }] = await Promise.all([
    (admin.from('profiles') as any).select('id, email, full_name, username, phone, status, subscription_status, stripe_customer_id, trial_ends_at, subscription_ends_at, onboarding_completed, created_at, updated_at').order('created_at', { ascending: false }),
    (admin.from('transactions') as any).select('user_id'),
    (admin.from('accounts') as any).select('user_id, is_active'),
  ])

  const txMap: Record<string, number> = {}
  for (const t of txData ?? []) txMap[t.user_id] = (txMap[t.user_id] ?? 0) + 1

  const accMap: Record<string, number> = {}
  for (const a of accData ?? []) {
    if (a.is_active) accMap[a.user_id] = (accMap[a.user_id] ?? 0) + 1
  }

  return (profiles ?? []).map((p: any) => ({
    ...p,
    tx_count: txMap[p.id] ?? 0,
    acc_count: accMap[p.id] ?? 0,
  })) as AdminProfile[]
}

export async function setUserAccountStatus(userId: string, status: 'approved' | 'rejected') {
  await verifyAdmin()
  const admin = createAdminClient()
  const { error } = await (admin.from('profiles') as any).update({ status }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function extendUserTrial(userId: string, days: number) {
  await verifyAdmin()
  const admin = createAdminClient()

  const { data: profile } = await (admin.from('profiles') as any)
    .select('trial_ends_at').eq('id', userId).single()

  const base = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()
    ? new Date(profile.trial_ends_at)
    : new Date()
  base.setDate(base.getDate() + days)

  const { error } = await (admin.from('profiles') as any)
    .update({ trial_ends_at: base.toISOString(), subscription_status: 'trialing' })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function setUserSubscriptionStatus(userId: string, status: string) {
  await verifyAdmin()
  const admin = createAdminClient()
  const { error } = await (admin.from('profiles') as any)
    .update({ subscription_status: status })
    .eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

// ── Support tickets ───────────────────────────────────────────────────────────

export async function sendSupportMessage(message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
  const { error } = await supabase.from('support_tickets' as any).insert({ user_id: user.id, message })
  if (error) return { error: error.message }

  const userName = (profile as any)?.full_name ?? (profile as any)?.email ?? user.email ?? 'Usuario'
  const userEmail = (profile as any)?.email ?? user.email ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'

  await sendAdminEmail(
    `Nuevo mensaje de soporte — ${userName}`,
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
    <table width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:24px">
        <span style="color:#007AFF;font-size:22px;font-weight:900">fluxapp finance</span>
        <span style="color:#6E6E73;font-size:13px;margin-left:8px">Soporte</span>
      </td></tr>
      <tr><td style="background:#FFFFFF;border-radius:20px;padding:28px;border:1px solid rgba(0,0,0,0.08)">
        <h2 style="color:#1D1D1F;margin:0 0 16px;font-size:18px;font-weight:700">Nuevo mensaje de soporte</h2>
        <div style="background:#F5F5F7;border-radius:12px;padding:14px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06)">
          <p style="color:#6E6E73;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px">Usuario</p>
          <p style="color:#1D1D1F;font-size:15px;font-weight:600;margin:0">${userName}</p>
          <p style="color:#6E6E73;font-size:13px;margin:2px 0 0">${userEmail}</p>
        </div>
        <div style="background:#F5F5F7;border-radius:12px;padding:14px;border:1px solid rgba(0,0,0,0.06)">
          <p style="color:#6E6E73;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px">Mensaje</p>
          <p style="color:#1D1D1F;font-size:14px;margin:0;line-height:1.6;border-left:3px solid #007AFF;padding-left:10px">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <a href="${appUrl}/admin" style="display:block;background:#007AFF;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-size:15px;font-weight:700;margin-top:20px">Responder en el panel</a>
      </td></tr>
      <tr><td style="padding-top:20px;text-align:center;color:#6E6E73;font-size:12px">
        fluxapp finance &middot; <a href="${appUrl}" style="color:#6E6E73;text-decoration:none">fluxappfinance.com</a>
      </td></tr>
    </table></td></tr></table>
    </body></html>`,
  )

  return { error: null }
}

export async function getMyTickets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await (supabase.from('support_tickets' as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20))
  return (data ?? []) as SupportTicket[]
}

export async function getAdminTickets(): Promise<SupportTicket[]> {
  await verifyAdmin()
  const admin = createAdminClient()
  const { data: tickets } = await (admin.from('support_tickets') as any)
    .select('*, profiles(email, full_name)')
    .order('is_read', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(100)

  return (tickets ?? []).map((t: any) => ({
    ...t,
    user_email: t.profiles?.email ?? null,
    user_name: t.profiles?.full_name ?? null,
    profiles: undefined,
  })) as SupportTicket[]
}

export async function replyToTicket(ticketId: string, reply: string) {
  await verifyAdmin()
  const admin = createAdminClient()

  // Fetch ticket + user info before updating
  const { data: ticket } = await (admin.from('support_tickets') as any)
    .select('message, user_id, profiles(email, full_name)')
    .eq('id', ticketId)
    .single()

  const { error } = await (admin.from('support_tickets') as any)
    .update({ admin_reply: reply, is_read: true, replied_at: new Date().toISOString() })
    .eq('id', ticketId)
  if (error) return { error: error.message }

  // Send reply email to user fire-and-forget
  const userEmail = ticket?.profiles?.email
  if (userEmail) {
    const userName = ticket?.profiles?.full_name ?? userEmail
    sendSupportReplyEmail({
      to: userEmail,
      userName,
      originalMessage: ticket.message ?? '',
      reply,
    }).catch(() => {})
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function markTicketRead(ticketId: string) {
  await verifyAdmin()
  const admin = createAdminClient()
  await (admin.from('support_tickets') as any).update({ is_read: true }).eq('id', ticketId)
  revalidatePath('/admin')
}
