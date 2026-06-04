'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSupportReplyEmail } from '@/lib/email'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''  // notification recipient
const ADMIN_AUTH_EMAIL = process.env.ADMIN_AUTH_EMAIL || process.env.ADMIN_EMAIL || 'bernardo.perezro06@gmail.com'
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
  if (!user || user.email !== ADMIN_AUTH_EMAIL) throw new Error('No autorizado')
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
  shortcut_ever_used: boolean
  shortcut_last_used_at: string | null
  shortcut_apple_pay_at: string | null
  shortcut_quick_register_at: string | null
  friend_count: number
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
  // Auth verified by app/admin/page.tsx before this is called —
  // verifyAdmin() here re-reads cookies in a server-action context where
  // they may not be available, causing false "No autorizado" errors.
  const admin = createAdminClient()

  const [{ data: profiles }, { data: txData }, { data: accData }, { data: tokenData }, { data: friendData }] = await Promise.all([
    (admin.from('profiles') as any).select('id, email, full_name, username, phone, status, subscription_status, stripe_customer_id, trial_ends_at, subscription_ends_at, onboarding_completed, created_at, updated_at').order('created_at', { ascending: false }),
    (admin.from('transactions') as any).select('user_id'),
    (admin.from('accounts') as any).select('user_id, is_active'),
    (admin.from('shortcut_tokens') as any).select('user_id, last_used_at, apple_pay_last_used_at, quick_register_last_used_at'),
    (admin.from('friendships') as any).select('requester_id, addressee_id').eq('status', 'accepted'),
  ])

  const txMap: Record<string, number> = {}
  for (const t of txData ?? []) txMap[t.user_id] = (txMap[t.user_id] ?? 0) + 1

  const accMap: Record<string, number> = {}
  for (const a of accData ?? []) {
    if (a.is_active) accMap[a.user_id] = (accMap[a.user_id] ?? 0) + 1
  }

  // shortcut: track general + per-source usage
  const shortcutMap: Record<string, { last: string | null; apple_pay: string | null; quick_register: string | null }> = {}
  for (const tok of tokenData ?? []) {
    const uid = tok.user_id
    if (!shortcutMap[uid]) shortcutMap[uid] = { last: null, apple_pay: null, quick_register: null }
    if (tok.last_used_at && (!shortcutMap[uid].last || tok.last_used_at > shortcutMap[uid].last!))
      shortcutMap[uid].last = tok.last_used_at
    if (tok.apple_pay_last_used_at && (!shortcutMap[uid].apple_pay || tok.apple_pay_last_used_at > shortcutMap[uid].apple_pay!))
      shortcutMap[uid].apple_pay = tok.apple_pay_last_used_at
    if (tok.quick_register_last_used_at && (!shortcutMap[uid].quick_register || tok.quick_register_last_used_at > shortcutMap[uid].quick_register!))
      shortcutMap[uid].quick_register = tok.quick_register_last_used_at
  }

  const friendMap: Record<string, number> = {}
  for (const f of friendData ?? []) {
    friendMap[f.requester_id] = (friendMap[f.requester_id] ?? 0) + 1
    friendMap[f.addressee_id] = (friendMap[f.addressee_id] ?? 0) + 1
  }

  return (profiles ?? []).map((p: any) => ({
    ...p,
    tx_count: txMap[p.id] ?? 0,
    acc_count: accMap[p.id] ?? 0,
    shortcut_ever_used: !!(shortcutMap[p.id]?.last),
    shortcut_last_used_at: shortcutMap[p.id]?.last ?? null,
    shortcut_apple_pay_at: shortcutMap[p.id]?.apple_pay ?? null,
    shortcut_quick_register_at: shortcutMap[p.id]?.quick_register ?? null,
    friend_count: friendMap[p.id] ?? 0,
  })) as AdminProfile[]
}

export interface AdminMetrics {
  users: { total: number; approved: number; pending: number; rejected: number }
  subs: { trialing: number; active: number; expired: number; grace: number }
  shortcuts: {
    ever_used: number; never_used: number; total_approved: number
    apple_pay: number; quick_register: number; unknown_source: number
  }
  activity: { active_7d: number; inactive_7d: number }
  emails: { trial_expiring: number; shortcut_reminder: number; reengagement: number }
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const admin = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: profiles }, { data: recentTx }, { data: tokenData }, { data: notifData }] = await Promise.all([
    (admin.from('profiles') as any).select('id, status, subscription_status'),
    (admin.from('transactions') as any).select('user_id').gte('created_at', sevenDaysAgo),
    (admin.from('shortcut_tokens') as any).select('user_id, last_used_at, apple_pay_last_used_at, quick_register_last_used_at'),
    (admin.from('notifications') as any)
      .select('user_id, type')
      .in('type', ['trial_expiring', 'shortcut_reminder', 'reengagement']),
  ])

  const allProfiles: any[] = profiles ?? []
  const approvedIds = new Set(allProfiles.filter(p => p.status === 'approved').map(p => p.id))

  // User counts
  const total     = allProfiles.length
  const approved  = allProfiles.filter(p => p.status === 'approved').length
  const pending   = allProfiles.filter(p => p.status === 'pending').length
  const rejected  = allProfiles.filter(p => p.status === 'rejected').length
  const trialing  = allProfiles.filter(p => p.subscription_status === 'trialing').length
  const active    = allProfiles.filter(p => p.subscription_status === 'active').length
  const expired   = allProfiles.filter(p => ['expired', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(p.subscription_status)).length
  const grace     = allProfiles.filter(p => p.subscription_status === 'grace').length

  // Shortcut usage (only approved users)
  const shortcutByUser: Record<string, { any: boolean; apple_pay: boolean; quick_register: boolean }> = {}
  for (const tok of (tokenData ?? [])) {
    if (!approvedIds.has(tok.user_id)) continue
    if (!shortcutByUser[tok.user_id]) shortcutByUser[tok.user_id] = { any: false, apple_pay: false, quick_register: false }
    if (tok.last_used_at) shortcutByUser[tok.user_id].any = true
    if (tok.apple_pay_last_used_at) shortcutByUser[tok.user_id].apple_pay = true
    if (tok.quick_register_last_used_at) shortcutByUser[tok.user_id].quick_register = true
  }
  const shortcutEverUsed  = [...approvedIds].filter(id => shortcutByUser[id]?.any).length
  const shortcutNeverUsed = [...approvedIds].filter(id => !shortcutByUser[id]?.any).length
  const shortcutApplePay  = [...approvedIds].filter(id => shortcutByUser[id]?.apple_pay).length
  const shortcutQuickReg  = [...approvedIds].filter(id => shortcutByUser[id]?.quick_register).length
  // used shortcut but source not yet identified (old shortcut without source field)
  const shortcutUnknown   = [...approvedIds].filter(id =>
    shortcutByUser[id]?.any && !shortcutByUser[id]?.apple_pay && !shortcutByUser[id]?.quick_register
  ).length

  // Activity last 7 days (approved users with at least one tx)
  const activeUserIds = new Set((recentTx ?? []).map((t: any) => t.user_id))
  const active7d   = [...approvedIds].filter(id => activeUserIds.has(id)).length
  const inactive7d = [...approvedIds].filter(id => !activeUserIds.has(id)).length

  // Notification / email counts
  const notifs: any[] = notifData ?? []
  const trialExpiring   = new Set(notifs.filter(n => n.type === 'trial_expiring').map(n => n.user_id)).size
  const shortcutReminder = new Set(notifs.filter(n => n.type === 'shortcut_reminder').map(n => n.user_id)).size
  const reengagement    = new Set(notifs.filter(n => n.type === 'reengagement').map(n => n.user_id)).size

  return {
    users: { total, approved, pending, rejected },
    subs: { trialing, active, expired, grace },
    shortcuts: { ever_used: shortcutEverUsed, never_used: shortcutNeverUsed, total_approved: approved, apple_pay: shortcutApplePay, quick_register: shortcutQuickReg, unknown_source: shortcutUnknown },
    activity: { active_7d: active7d, inactive_7d: inactive7d },
    emails: { trial_expiring: trialExpiring, shortcut_reminder: shortcutReminder, reengagement },
  }
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
