import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ ok: false, reason: 'no_key' })

  // Auth via user session (called from the browser)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, userMessage } = await req.json()

  // Verify user owns the conversation
  const admin = createAdminClient()
  const { data: conv } = await (admin.from('support_conversations') as any)
    .select('user_id')
    .eq('id', conversationId)
    .single()
  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = user.id

  // Fetch history + user context in parallel (no longer passed from client)
  const [historyResult, profileResult] = await Promise.all([
    (admin.from('support_messages') as any)
      .select('sender, body')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20),
    (admin.from('profiles') as any)
      .select('full_name, subscription_status, trial_ends_at, shortcut_tokens(last_used_at)')
      .eq('id', userId)
      .single(),
  ])

  const history: { sender: string; body: string }[] = historyResult.data ?? []
  const profileFull = profileResult.data
  const daysLeft = profileFull?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profileFull.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : null
  const userContext = {
    name: profileFull?.full_name ?? 'Usuario',
    subscriptionStatus: profileFull?.subscription_status ?? 'trialing',
    daysLeft,
    shortcutEverUsed: !!(profileFull?.shortcut_tokens as any)?.[0]?.last_used_at,
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

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
- Cómo instalar el atajo: ve a fluxappfinance.com/guia, ahí encontrarás el video de instalación paso a paso. En resumen: descarga el atajo desde el enlace en Configuración → Atajos, y asegúrate de que el nombre de tu cuenta en Flux coincida exactamente con el de tu tarjeta en Wallet.

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

    const recent = (history as { sender: string; body: string }[]).slice(-10)
    const contextBlock = `Usuario: ${userContext.name} | Suscripción: ${userContext.subscriptionStatus}${userContext.daysLeft !== null ? ` (${userContext.daysLeft}d restantes)` : ''} | Atajos: ${userContext.shortcutEverUsed ? 'sí' : 'no'}`

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: `[Contexto del usuario] ${contextBlock}` },
      { role: 'assistant', content: 'Entendido, estoy listo para ayudar.' },
      ...recent.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.body,
      })),
    ]

    if (messages[messages.length - 1]?.role !== 'user') {
      messages.push({ role: 'user', content: userMessage })
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
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(cleaned)
      reply = parsed.reply ?? ''
      escalate = !!parsed.escalate
    } catch {
      reply = raw
    }

    if (!reply) return NextResponse.json({ ok: false, reason: 'empty_reply' })

    const usage = response.usage

    await Promise.all([
      (admin.from('support_messages') as any).insert({
        conversation_id: conversationId,
        sender: 'admin',
        body: reply,
      }),
      (admin.from('bot_usage_logs') as any).insert({
        conversation_id: conversationId,
        user_id: userId,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
      }),
    ])

    await (admin.from('support_conversations') as any)
      .update({
        last_message_at: new Date().toISOString(),
        unread_user: 1,
        ...(escalate ? { escalated: true } : {}),
      })
      .eq('id', conversationId)

    if (escalate) {
      const adminEmail = process.env.ADMIN_EMAIL ?? ''
      if (adminEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const historyHtml = [...(history as any[]).slice(-6), { sender: 'user', body: userMessage }]
          .map((m: any) => `<tr><td style="padding:4px 0;color:${m.sender === 'user' ? '#1D1D1F' : '#007AFF'};font-size:13px"><strong>${m.sender === 'user' ? userContext.name : 'Bot'}:</strong> ${m.body}</td></tr>`)
          .join('')
        resend.emails.send({
          from: 'FluxApp Finance <no-reply@fluxappfinance.com>',
          to: adminEmail,
          subject: `Escalación de soporte — ${userContext.name}`,
          html: `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#F5F5F7;margin:0;padding:40px 20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:28px;border:1px solid rgba(0,0,0,0.08)">
<h2 style="color:#FF3B30;margin:0 0 4px;font-size:18px">El usuario necesita atención humana</h2>
<p style="color:#6E6E73;font-size:13px;margin:0 0 20px">${userContext.name} · ${userContext.subscriptionStatus}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;border-radius:12px;padding:14px;margin-bottom:20px">${historyHtml}</table>
<a href="${appUrl}/admin" style="display:block;background:#007AFF;color:#fff;text-decoration:none;border-radius:12px;padding:14px;text-align:center;font-weight:700;font-size:15px">Ir al buzón de soporte</a>
</div></body></html>`,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ok: true, escalate })
  } catch (e) {
    console.error('[support-bot]', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
