'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSupportReplyEmail } from '@/lib/email'

// ── Bot ───────────────────────────────────────────────────────────────────────

const BOT_SYSTEM_PROMPT = `Eres el asistente de soporte de FluxApp Finance, una app de finanzas personales para iPhone en México.

Tu rol: responder dudas de usuarios de forma amigable, clara y breve (2-4 oraciones máximo). Tutea al usuario.

Lo que hace FluxApp Finance:
- Registra gastos, ingresos y transferencias entre cuentas
- Se integra con Apple Pay vía Atajos de iPhone — registra gastos automáticamente al pagar
- Tiene un Atajo de Registro Rápido para anotar gastos desde Siri o la app de Atajos
- Gastos compartidos con amigos (dividir, cobrar, abonar)
- Ingresos pendientes de cobro (cuentas por cobrar)
- Presupuesto mensual con alertas al 80%
- Gastos e ingresos recurrentes (streaming, renta, nómina)
- Estadísticas y gráficas de tendencia mensual
- Plan: 20 días de prueba gratis, luego $89/mes

Preguntas frecuentes y respuestas clave:
- Atajo no funciona: el nombre de la cuenta en Flux debe ser IDÉNTICO al nombre de la tarjeta en Ajustes → Wallet y Apple Pay → [tarjeta]. Hasta el acento importa.
- Saldo incorrecto: usa Auditoría en Configuración → Cuentas (ícono de balanza) para ajustar manualmente.
- No llegan notificaciones: asegúrate de tener notificaciones activadas para Flux en Ajustes → Notificaciones.
- Cancelar suscripción: Configuración → Plan y suscripción → Gestionar.
- ¿Cómo agrego una cuenta?: Configuración → Cuentas → Nueva cuenta.
- Gasto compartido: al crear el gasto, activa "Compartir gasto" y selecciona personas.

IMPORTANTE — debes responder en JSON válido con este formato EXACTO (sin texto extra):
{"reply": "Tu respuesta aquí", "escalate": false}

Marca escalate: true si:
- El usuario pide hablar con una persona real / soporte humano
- Hay una disputa de cobro, cargo no reconocido o solicitud de reembolso
- El usuario reporta un bug grave que no puedes resolver con instrucciones
- El usuario muestra frustración intensa o ha preguntado lo mismo 3+ veces sin solución
- Solicita eliminar su cuenta o sus datos
- El problema es demasiado específico de su cuenta y no puedes resolverlo con información general

Si escalate es true, en el reply avisa amablemente que un humano lo contactará pronto.`

async function runSupportBot(opts: {
  conversationId: string
  userId: string
  userMessage: string
  history: { sender: string; body: string }[]
  userContext: { name: string; subscriptionStatus: string; daysLeft: number | null; shortcutEverUsed: boolean }
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return

  const admin = createAdminClient()

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    // Build conversation history for Claude (last 10 messages for context)
    const recent = opts.history.slice(-10)
    const contextBlock = `Usuario: ${opts.userContext.name} | Suscripción: ${opts.userContext.subscriptionStatus}${opts.userContext.daysLeft !== null ? ` (${opts.userContext.daysLeft}d restantes)` : ''} | Atajos: ${opts.userContext.shortcutEverUsed ? 'sí' : 'no'}`

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: `[Contexto del usuario] ${contextBlock}` },
      { role: 'assistant', content: 'Entendido, estoy listo para ayudar.' },
      ...recent.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.body,
      })),
    ]

    // Ensure last message is from user
    if (messages[messages.length - 1]?.role !== 'user') {
      messages.push({ role: 'user', content: opts.userMessage })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: BOT_SYSTEM_PROMPT,
      messages,
    })

    const raw = (response.content[0] as { type: string; text: string }).text.trim()

    let reply = ''
    let escalate = false
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(cleaned)
      reply = parsed.reply ?? ''
      escalate = !!parsed.escalate
    } catch {
      // If JSON parse fails, use raw text as reply
      reply = raw
    }

    if (!reply) return

    // Insert bot reply as admin message
    await (admin.from('support_messages') as any).insert({
      conversation_id: opts.conversationId,
      sender: 'admin',
      body: reply,
    })

    await (admin.from('support_conversations') as any)
      .update({
        last_message_at: new Date().toISOString(),
        unread_user: 1,
        ...(escalate ? { escalated: true } : {}),
      })
      .eq('id', opts.conversationId)

    // Escalation: notify admin by email
    if (escalate) {
      const adminEmail = process.env.ADMIN_EMAIL ?? ''
      if (adminEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const historyHtml = [...opts.history.slice(-6), { sender: 'user', body: opts.userMessage }]
          .map(m => `<tr><td style="padding:4px 0;color:${m.sender === 'user' ? '#1D1D1F' : '#007AFF'};font-size:13px"><strong>${m.sender === 'user' ? opts.userContext.name : 'Bot'}:</strong> ${m.body}</td></tr>`)
          .join('')
        resend.emails.send({
          from: 'FluxApp Finance <no-reply@fluxappfinance.com>',
          to: adminEmail,
          subject: `🚨 Escalación de soporte — ${opts.userContext.name}`,
          html: `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#F5F5F7;margin:0;padding:40px 20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;border:1px solid rgba(0,0,0,0.08)">
<h2 style="color:#FF3B30;margin:0 0 4px;font-size:18px">🚨 El usuario necesita atención humana</h2>
<p style="color:#6E6E73;font-size:13px;margin:0 0 20px">${opts.userContext.name} · ${opts.userContext.subscriptionStatus}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:12px;padding:14px;margin-bottom:20px">${historyHtml}</table>
<a href="${appUrl}/admin" style="display:block;background:#007AFF;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-weight:700;font-size:15px">Ir al buzón de soporte</a>
</div></body></html>`,
        }).catch(() => {})
      }
    }
  } catch (e) {
    console.error('[support-bot] error:', e)
  }
}

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

  // Fire bot response in background (doesn't block the user's action)
  const admin = createAdminClient()
  const { data: history } = await (admin.from('support_messages') as any)
    .select('sender, body')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  const { data: profileFull } = await (admin.from('profiles') as any)
    .select('full_name, subscription_status, trial_ends_at, shortcut_tokens(last_used_at)')
    .eq('id', user.id)
    .single()

  const daysLeft = profileFull?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profileFull.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : null

  runSupportBot({
    conversationId,
    userId: user.id,
    userMessage: trimmed,
    history: (history ?? []) as { sender: string; body: string }[],
    userContext: {
      name: profileFull?.full_name ?? 'Usuario',
      subscriptionStatus: profileFull?.subscription_status ?? 'trialing',
      daysLeft,
      shortcutEverUsed: !!(profileFull?.shortcut_tokens as any)?.[0]?.last_used_at,
    },
  }).catch(() => {})

  return { error: null }
}

/** Get count of unread admin messages for the current user (without creating a conversation). */
export async function getUserUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data } = await supabase
    .from('support_conversations' as any)
    .select('unread_user')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as any)?.unread_user ?? 0
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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bernardo.perezro06@gmail.com'  // notification recipient
const ADMIN_AUTH_EMAIL = process.env.ADMIN_AUTH_EMAIL || process.env.ADMIN_EMAIL || 'bernardo.perezro06@gmail.com'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_AUTH_EMAIL) throw new Error('No autorizado')
  return user
}

/** Get all conversations (admin only), sorted by unread then recency. */
export async function getAdminConversations(): Promise<SupportConversation[]> {
  await verifyAdmin()
  const admin = createAdminClient()
  const { data, error } = await (admin.from('support_conversations') as any)
    .select('*, profiles(email, full_name)')
    .order('unread_admin', { ascending: false })
    .order('last_message_at', { ascending: false })
    .limit(100)

  if (error) console.error('[getAdminConversations]', error)

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
