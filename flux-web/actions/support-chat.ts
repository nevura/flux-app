'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSupportReplyEmail } from '@/lib/email'

export interface SupportConversation {
  id: string
  user_id: string
  status: 'open' | 'closed'
  last_message_at: string
  unread_admin: number
  unread_user: number
  created_at: string
  // joined from profiles (admin view)
  user_email?: string | null
  user_name?: string | null
}

export interface SupportMessage {
  id: string
  conversation_id: string
  sender: 'user' | 'admin'
  body: string
  created_at: string
}

// ── User actions ──────────────────────────────────────────────────────────────

/** Get the user's active conversation, or create one if none exists. */
export async function getOrCreateConversation(): Promise<SupportConversation | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try to find existing open conversation
  const { data: existing } = await supabase
    .from('support_conversations' as any)
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing as SupportConversation

  // Create new conversation
  const { data: created } = await supabase
    .from('support_conversations' as any)
    .insert({ user_id: user.id })
    .select()
    .single()

  return (created ?? null) as SupportConversation | null
}

/** Get all messages for a conversation (user must own it). */
export async function getMessages(conversationId: string): Promise<SupportMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('support_messages' as any)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  return (data ?? []) as SupportMessage[]
}

/** Send a message as the current user. */
export async function sendUserMessage(conversationId: string, body: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Mensaje vacío' }

  const { error: msgErr } = await supabase
    .from('support_messages' as any)
    .insert({ conversation_id: conversationId, sender: 'user', body: trimmed })

  if (msgErr) return { error: msgErr.message }

  // Update conversation metadata
  await supabase
    .from('support_conversations' as any)
    .update({ last_message_at: new Date().toISOString(), unread_admin: 1 })
    .eq('id', conversationId)

  // Notify admin via email (fire-and-forget)
  const adminEmail = process.env.ADMIN_EMAIL ?? ''
  if (adminEmail) {
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
    const userName = (profile as any)?.full_name ?? (profile as any)?.email ?? user.email ?? 'Usuario'
    const userEmail = (profile as any)?.email ?? user.email ?? ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
<tr><td style="padding-bottom:24px"><span style="color:#007AFF;font-size:22px;font-weight:900">fluxapp finance</span><span style="color:#6E6E73;font-size:13px;margin-left:8px">Soporte</span></td></tr>
<tr><td style="background:#FFFFFF;border-radius:20px;padding:28px;border:1px solid rgba(0,0,0,0.08)">
<h2 style="color:#1D1D1F;margin:0 0 16px;font-size:18px;font-weight:700">Nuevo mensaje de soporte</h2>
<div style="background:#F5F5F7;border-radius:12px;padding:14px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06)">
<p style="color:#6E6E73;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px">Usuario</p>
<p style="color:#1D1D1F;font-size:15px;font-weight:600;margin:0">${userName}</p>
<p style="color:#6E6E73;font-size:13px;margin:2px 0 0">${userEmail}</p>
</div>
<div style="background:#F5F5F7;border-radius:12px;padding:14px;border:1px solid rgba(0,0,0,0.06)">
<p style="color:#6E6E73;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px">Mensaje</p>
<p style="color:#1D1D1F;font-size:14px;margin:0;line-height:1.6;border-left:3px solid #007AFF;padding-left:10px">${trimmed.replace(/\n/g, '<br>')}</p>
</div>
<a href="${appUrl}/admin" style="display:block;background:#007AFF;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-size:15px;font-weight:700;margin-top:20px">Responder en el panel</a>
</td></tr>
<tr><td style="padding-top:20px;text-align:center;color:#6E6E73;font-size:12px">fluxapp finance &middot; <a href="${appUrl}" style="color:#6E6E73;text-decoration:none">fluxappfinance.com</a></td></tr>
</table></td></tr></table></body></html>`

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    resend.emails.send({
      from: 'FluxApp Finance <no-reply@fluxappfinance.com>',
      to: adminEmail,
      subject: `Nuevo mensaje de soporte — ${userName}`,
      html,
    }).catch(() => {})
  }

  return { error: null }
}

/** Mark the user's unread messages as read. */
export async function markReadByUser(conversationId: string) {
  const supabase = await createClient()
  await supabase
    .from('support_conversations' as any)
    .update({ unread_user: 0 })
    .eq('id', conversationId)
}

// ── Admin actions ─────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bernardo.perezro06@gmail.com'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('No autorizado')
  return user
}

/** Get all conversations (admin only), sorted by unread then recency. */
export async function getAdminConversations(): Promise<SupportConversation[]> {
  await verifyAdmin()
  const admin = createAdminClient()
  const { data } = await (admin.from('support_conversations') as any)
    .select('*, profiles(email, full_name)')
    .order('unread_admin', { ascending: false })
    .order('last_message_at', { ascending: false })
    .limit(100)

  return ((data ?? []) as any[]).map((c: any) => ({
    ...c,
    user_email: c.profiles?.email ?? null,
    user_name: c.profiles?.full_name ?? null,
    profiles: undefined,
  })) as SupportConversation[]
}

/** Get messages for any conversation (admin only). */
export async function getAdminMessages(conversationId: string): Promise<SupportMessage[]> {
  await verifyAdmin()
  const admin = createAdminClient()
  const { data } = await (admin.from('support_messages') as any)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  return (data ?? []) as SupportMessage[]
}

/** Send a reply as admin. */
export async function sendAdminMessage(conversationId: string, body: string): Promise<{ error: string | null }> {
  await verifyAdmin()
  const admin = createAdminClient()
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Mensaje vacío' }

  const { error: msgErr } = await (admin.from('support_messages') as any)
    .insert({ conversation_id: conversationId, sender: 'admin', body: trimmed })

  if (msgErr) return { error: msgErr.message }

  // Update conversation
  await (admin.from('support_conversations') as any)
    .update({ last_message_at: new Date().toISOString(), unread_user: 1 })
    .eq('id', conversationId)

  // Get user email to send notification
  const { data: conv } = await (admin.from('support_conversations') as any)
    .select('user_id, profiles(email, full_name)')
    .eq('id', conversationId)
    .single()

  const userEmail = (conv as any)?.profiles?.email
  const userName = (conv as any)?.profiles?.full_name ?? userEmail ?? 'Usuario'

  if (userEmail) {
    // Get last user message for context
    const { data: msgs } = await (admin.from('support_messages') as any)
      .select('body, sender')
      .eq('conversation_id', conversationId)
      .eq('sender', 'user')
      .order('created_at', { ascending: false })
      .limit(1)

    const lastUserMsg = (msgs as any)?.[0]?.body ?? ''
    sendSupportReplyEmail({
      to: userEmail,
      userName,
      originalMessage: lastUserMsg,
      reply: trimmed,
    }).catch(() => {})
  }

  revalidatePath('/admin')
  return { error: null }
}

/** Mark conversation as read by admin. */
export async function markReadByAdmin(conversationId: string) {
  await verifyAdmin()
  const admin = createAdminClient()
  await (admin.from('support_conversations') as any)
    .update({ unread_admin: 0 })
    .eq('id', conversationId)
  revalidatePath('/admin')
}
