'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  setUserAccountStatus,
  extendUserTrial,
  setUserSubscriptionStatus,
  type AdminProfile,
} from '@/actions/admin'
import {
  getAdminConversations,
  getAdminMessages,
  sendAdminMessage,
  markReadByAdmin,
  type SupportConversation,
  type SupportMessage,
} from '@/actions/support-chat'
import { getAdminMetrics, type AdminMetrics } from '@/actions/admin'
import { createClient } from '@/lib/supabase/client'

const BLUE   = '#007AFF'
const DARK   = '#1D1D1F'
const GRAY   = '#6E6E73'
const LIGHT  = '#F5F5F7'
const GREEN  = '#00AD40'
const RED    = '#FF004F'
const ORANGE = '#FF9500'

function accountBadge(status: string) {
  if (status === 'approved') return { label: 'Aprobado',  bg: 'rgba(0,173,64,0.12)',  color: GREEN }
  if (status === 'rejected') return { label: 'Rechazado', bg: 'rgba(255,0,79,0.10)',  color: RED }
  return                            { label: 'Pendiente', bg: 'rgba(255,149,0,0.12)', color: ORANGE }
}

function subBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    trialing:           { label: 'En prueba',    color: BLUE },
    active:             { label: 'Activo',        color: GREEN },
    grace:              { label: 'Gracia',        color: ORANGE },
    expired:            { label: 'Expirado',      color: RED },
    canceled:           { label: 'Cancelado',     color: GRAY },
    past_due:           { label: 'Vencido',       color: RED },
    paused:             { label: 'Pausado',        color: GRAY },
    unpaid:             { label: 'Sin pago',      color: RED },
    incomplete:         { label: 'Incompleto',    color: ORANGE },
    incomplete_expired: { label: 'Inc. expirado', color: RED },
  }
  const m = map[status] ?? { label: status, color: GRAY }
  return { ...m, bg: `${m.color}18` }
}

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function initials(p: AdminProfile) {
  return (p.full_name || p.email || '?')[0].toUpperCase()
}

function formatMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

// ── Stat card (2×2 grid) ──────────────────────────────────────────────────────
function StatCard({ label, value, color, onClick, active }: { label: string; value: number; color: string; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className="rounded-[20px] p-4 text-left transition-all active:scale-[0.97] w-full"
      style={{
        background: active ? color : LIGHT,
        border: active ? 'none' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <p className="text-[32px] font-black leading-none" style={{ color: active ? '#fff' : DARK }}>{value}</p>
      <p className="text-[11px] font-bold mt-1.5 uppercase tracking-wide leading-tight" style={{ color: active ? 'rgba(255,255,255,0.75)' : GRAY }}>{label}</p>
    </button>
  )
}

// ── User card ─────────────────────────────────────────────────────────────────
function UserCard({ profile, isPending, onApprove, onReject, onExtend, onSetSub }: {
  profile: AdminProfile
  isPending: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onExtend: (id: string, days: number) => void
  onSetSub: (id: string, status: string) => void
}) {
  const [open, setOpen] = useState(profile.status === 'pending')
  const sb = subBadge(profile.subscription_status)
  const trialLeft = daysLeft(profile.trial_ends_at)
  const subLeft   = daysLeft(profile.subscription_ends_at)
  const relevantDays = profile.subscription_status === 'trialing' ? trialLeft : subLeft

  const avatarBg = profile.subscription_status === 'active' ? GREEN
    : profile.subscription_status === 'trialing' ? BLUE
    : GRAY

  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{ background: profile.status === 'pending' ? 'rgba(255,149,0,0.05)' : LIGHT, border: profile.status === 'pending' ? '1.5px solid rgba(255,149,0,0.3)' : '1px solid rgba(0,0,0,0.06)' }}
    >
      <button className="w-full text-left p-5 flex items-start gap-4" onClick={() => setOpen(o => !o)}>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-[17px] font-black text-white"
          style={{ background: avatarBg }}
        >
          {initials(profile)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Row 1: Nombre */}
          <p className="text-[16px] font-bold leading-tight" style={{ color: DARK }}>
            {profile.full_name || '(sin nombre)'}
          </p>

          {/* Row 2: Correo · @username */}
          <p className="text-[13px] font-medium mt-0.5 truncate" style={{ color: GRAY }}>
            {profile.email}
            {profile.username && <> · <span style={{ color: BLUE }}>@{profile.username}</span></>}
          </p>

          {/* Row 3: Resumen */}
          <p className="text-[12px] font-medium mt-1.5" style={{ color: GRAY }}>
            {profile.tx_count} mov · {profile.acc_count} ctas
            {profile.friend_count > 0 && <> · {profile.friend_count} {profile.friend_count === 1 ? 'amigo' : 'amigos'}</>}
          </p>

          {/* Row 4: Estado + Atajos */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: sb.bg, color: sb.color }}>
              {sb.label}
              {relevantDays !== null && (
                <> · {relevantDays > 0 ? `${relevantDays}d` : 'vencido'}</>
              )}
            </span>
            {profile.shortcut_apple_pay_at && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(0,0,0,0.07)', color: DARK }}
                title={`Apple Pay: ${fmtDate(profile.shortcut_apple_pay_at)}`}>
                <i className="fa-brands fa-apple text-[10px]" /> Pay ✓
              </span>
            )}
            {profile.shortcut_quick_register_at && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(191,90,242,0.12)', color: '#bf5af2' }}
                title={`Registro Rápido: ${fmtDate(profile.shortcut_quick_register_at)}`}>
                <i className="fa-solid fa-bolt text-[9px]" /> Rápido ✓
              </span>
            )}
            {!profile.shortcut_ever_used && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.06)', color: GRAY }}>
                Sin atajo
              </span>
            )}
            {profile.shortcut_ever_used && !profile.shortcut_apple_pay_at && !profile.shortcut_quick_register_at && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'rgba(191,90,242,0.12)', color: '#bf5af2' }}
                title="Atajo usado — fuente no identificada">
                <i className="fa-solid fa-bolt text-[9px]" /> Atajo ✓
              </span>
            )}
          </div>
        </div>

        <i className={`fa-solid fa-chevron-down text-[13px] transition-transform duration-200 mt-1 flex-shrink-0 ${open ? 'rotate-180' : ''}`} style={{ color: GRAY }} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div>
              <p className="font-bold" style={{ color: GRAY }}>Se unió</p>
              <p style={{ color: DARK }}>{fmtDate(profile.created_at)}</p>
            </div>
            <div>
              <p className="font-bold" style={{ color: GRAY }}>Prueba vence</p>
              <p style={{ color: DARK }}>{fmtDate(profile.trial_ends_at)}</p>
            </div>
            {profile.subscription_ends_at && (
              <div>
                <p className="font-bold" style={{ color: GRAY }}>Suscripción vence</p>
                <p style={{ color: DARK }}>{fmtDate(profile.subscription_ends_at)}</p>
              </div>
            )}
            <div>
              <p className="font-bold" style={{ color: GRAY }}>Onboarding</p>
              <p style={{ color: profile.onboarding_completed ? GREEN : ORANGE }}>
                {profile.onboarding_completed ? 'Completado' : 'Pendiente'}
              </p>
            </div>
          </div>

          {profile.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => onApprove(profile.id)} disabled={isPending}
                className="flex-1 py-3 rounded-[14px] text-[15px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: GREEN }}>
                <i className="fa-solid fa-check mr-2" />Aprobar
              </button>
              <button onClick={() => onReject(profile.id)} disabled={isPending}
                className="flex-1 py-3 rounded-[14px] text-[15px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ background: RED }}>
                <i className="fa-solid fa-xmark mr-2" />Rechazar
              </button>
            </div>
          )}

          {profile.status === 'rejected' && (
            <button onClick={() => onApprove(profile.id)} disabled={isPending}
              className="w-full py-3 rounded-[14px] text-[15px] font-black transition-all active:scale-95 disabled:opacity-50"
              style={{ background: LIGHT, color: DARK, border: '1px solid rgba(0,0,0,0.1)' }}>
              <i className="fa-solid fa-rotate-left mr-2" />Restaurar acceso
            </button>
          )}

          {profile.status === 'approved' && (
            <div>
              <p className="text-[12px] font-black uppercase tracking-wide mb-2" style={{ color: GRAY }}>Extender prueba</p>
              <div className="flex gap-2">
                {[7, 30, 90].map(d => (
                  <button key={d} onClick={() => onExtend(profile.id, d)} disabled={isPending}
                    className="flex-1 py-2.5 rounded-[12px] text-[14px] font-black transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: 'rgba(0,122,255,0.1)', color: BLUE }}>
                    +{d}d
                  </button>
                ))}
              </div>
            </div>
          )}

          {profile.status === 'approved' && (
            <div>
              <p className="text-[12px] font-black uppercase tracking-wide mb-2" style={{ color: GRAY }}>Estado suscripción</p>
              <div className="flex gap-2 flex-wrap">
                {(['trialing', 'active', 'grace', 'expired'] as const).map(s => {
                  const isActive = profile.subscription_status === s
                  return (
                    <button key={s} onClick={() => onSetSub(profile.id, s)}
                      disabled={isPending || isActive}
                      className="px-3 py-2 rounded-[10px] text-[13px] font-bold transition-all active:scale-95 disabled:opacity-60"
                      style={isActive ? { background: BLUE, color: '#fff' } : { background: LIGHT, color: GRAY, border: '1px solid rgba(0,0,0,0.1)' }}>
                      {s === 'trialing' ? 'Prueba' : s === 'active' ? 'Activo' : s === 'grace' ? 'Gracia' : 'Expirado'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Admin inbox ───────────────────────────────────────────────────────────────
function AdminInbox() {
  const [convs, setConvs] = useState<SupportConversation[]>([])
  const [selected, setSelected] = useState<SupportConversation | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgsRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAdminConversations().then(c => { setConvs(c); setLoading(false) })
  }, [])

  async function openConv(conv: SupportConversation) {
    setSelected(conv)
    setMessages([])
    const msgs = await getAdminMessages(conv.id)
    setMessages(msgs)
    setTimeout(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }), 80)
    if (conv.unread_admin > 0) {
      await markReadByAdmin(conv.id)
      setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unread_admin: 0 } : c))
    }
    const supabase = createClient()
    supabase
      .channel(`admin-chat-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${conv.id}` },
        (payload) => {
          const msg = payload.new as SupportMessage
          setMessages(prev => {
            const withoutOpt = prev.filter(m =>
              !(m.id.startsWith('opt-') && m.sender === msg.sender && m.body === msg.body)
            )
            if (withoutOpt.find(m => m.id === msg.id)) return withoutOpt
            return [...withoutOpt, msg]
          })
          setTimeout(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }), 80)
        }
      )
      .subscribe()
  }

  async function handleSend() {
    if (!selected || !reply.trim() || sending) return
    const body = reply.trim()
    setReply('')
    setSending(true)
    const optimistic: SupportMessage = { id: `opt-${Date.now()}`, conversation_id: selected.id, sender: 'admin', body, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }), 80)
    const { error } = await sendAdminMessage(selected.id, body)
    setSending(false)
    if (error) { toast.error(error); setMessages(prev => prev.filter(m => m.id !== optimistic.id)); setReply(body) }
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="py-20 text-center">
      <i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: GRAY }} />
    </div>
  )

  // ── Thread view: fixed full-screen overlay for proper PWA/mobile chat ──────
  if (selected) return (
    <div
      className="z-50 flex flex-col"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '100dvh',
        background: '#fff',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)' }}>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-[14px] font-bold mr-1" style={{ color: BLUE }}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-black text-white flex-shrink-0" style={{ background: BLUE }}>
          {(selected.user_name || selected.user_email || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate" style={{ color: DARK }}>{selected.user_name ?? 'Sin nombre'}</p>
          <p className="text-[12px] font-medium truncate" style={{ color: GRAY }}>{selected.user_email ?? ''}</p>
        </div>
      </div>

      {/* Messages — scrollable, messages anchored to bottom (WhatsApp style) */}
      <div ref={msgsRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column', padding: '12px 16px' }}>
        <div style={{ flex: 1 }} />
        {messages.map(msg => {
          const isAdmin = msg.sender === 'admin'
          return (
            <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className="max-w-[78%] flex flex-col" style={{ alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                <div className="px-4 py-2.5 rounded-[18px] text-[14px] font-medium leading-relaxed"
                  style={{
                    background: isAdmin ? BLUE : LIGHT,
                    color: isAdmin ? '#fff' : DARK,
                    border: isAdmin ? 'none' : '1px solid rgba(0,0,0,0.07)',
                    borderBottomRightRadius: isAdmin ? 4 : 18,
                    borderBottomLeftRadius: isAdmin ? 18 : 4,
                  }}>
                  {msg.body}
                </div>
                <span className="text-[10px] font-medium mt-0.5 px-1" style={{ color: GRAY }}>{fmtTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input — pinned at bottom with safe area */}
      <div
        className="flex-shrink-0 flex items-end gap-2 px-4 pt-3"
        style={{
          borderTop: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          background: '#fff',
        }}
      >
        <textarea
          rows={1}
          value={reply}
          onChange={e => {
            setReply(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onFocus={() => setTimeout(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }), 350)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Escribe tu respuesta…"
          className="flex-1 rounded-[16px] px-4 py-3 text-[14px] font-medium outline-none resize-none"
          style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.09)', color: DARK, minHeight: 44, maxHeight: 120, overflowY: 'auto' }}
        />
        <button onClick={handleSend} disabled={!reply.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 mb-0.5"
          style={{ background: BLUE }}>
          {sending ? <i className="fa-solid fa-spinner fa-spin text-white text-[13px]" /> : <i className="fa-solid fa-arrow-up text-white text-[13px]" />}
        </button>
      </div>
    </div>
  )

  // ── Conversation list ──────────────────────────────────────────────────────
  if (convs.length === 0) return (
    <div className="py-20 text-center">
      <i className="fa-solid fa-comments text-4xl mb-4 block" style={{ color: 'rgba(0,0,0,0.15)' }} />
      <p className="text-[16px] font-semibold" style={{ color: GRAY }}>Sin conversaciones de soporte</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {convs.map(c => (
        <button key={c.id} onClick={() => openConv(c)} className="w-full text-left rounded-[20px] p-5 flex items-center gap-4 transition-all active:scale-[0.99]"
          style={{
            background: c.unread_admin > 0 ? 'rgba(0,122,255,0.04)' : LIGHT,
            border: c.unread_admin > 0 ? '1.5px solid rgba(0,122,255,0.25)' : '1px solid rgba(0,0,0,0.06)',
          }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-black text-white flex-shrink-0" style={{ background: BLUE }}>
            {(c.user_name || c.user_email || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold truncate" style={{ color: DARK }}>{c.user_name ?? c.user_email ?? 'Usuario'}</p>
              {c.unread_admin > 0 && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BLUE }} />}
            </div>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: GRAY }}>{fmtDateTime(c.last_message_at)}</p>
          </div>
          <i className="fa-solid fa-chevron-right text-[13px] flex-shrink-0" style={{ color: GRAY }} />
        </button>
      ))}
    </div>
  )
}

function applyFilter(profiles: AdminProfile[], filter: string) {
  switch (filter) {
    case 'trialing': return profiles.filter(p => p.subscription_status === 'trialing')
    case 'active':   return profiles.filter(p => p.subscription_status === 'active')
    case 'expired':  return profiles.filter(p => ['expired','grace','past_due','unpaid','incomplete','incomplete_expired'].includes(p.subscription_status))
    default:         return profiles
  }
}

// ── Metrics view ─────────────────────────────────────────────────────────────
function MetricsView() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminMetrics().then(m => { setMetrics(m); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="py-20 text-center">
      <i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: GRAY }} />
    </div>
  )
  if (!metrics) return null

  function PctBar({ value, total, color }: { value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0
    return (
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[13px] font-black tabular-nums" style={{ color }}>{value}</span>
          <span className="text-[13px] font-bold" style={{ color: GRAY }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    )
  }

  function MetricCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
    return (
      <div className="rounded-[16px] p-4" style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="text-[28px] font-black leading-none tabular-nums" style={{ color }}>{value}</p>
        <p className="text-[12px] font-bold mt-1 leading-tight" style={{ color: DARK }}>{label}</p>
        {sub && <p className="text-[11px] font-medium mt-0.5" style={{ color: GRAY }}>{sub}</p>}
      </div>
    )
  }

  const totalApproved = metrics.shortcuts.total_approved

  return (
    <div className="space-y-8">

      {/* ── Usuarios + Suscripciones (fusionados) ── */}
      <section>
        <p className="text-[11px] font-black uppercase tracking-[3px] mb-3" style={{ color: GRAY }}>Usuarios</p>
        <MetricCard label="Total registrados" value={metrics.users.total} color={DARK} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <MetricCard label="En prueba" value={metrics.subs.trialing} color={BLUE} />
          <MetricCard label="Activos (pagando)" value={metrics.subs.active} color={GREEN} />
          <MetricCard label="Gracia" value={metrics.subs.grace} color={ORANGE} />
          <MetricCard label="Expirados" value={metrics.subs.expired} color={RED} />
        </div>
      </section>

      {/* ── Atajos ── */}
      <section>
        <p className="text-[11px] font-black uppercase tracking-[3px] mb-3" style={{ color: GRAY }}>Atajos de iPhone</p>
        <div className="rounded-[20px] p-5 space-y-4" style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.06)' }}>
          {/* Overall adoption */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold" style={{ color: DARK }}>Adopción total</span>
            <span className="text-[22px] font-black tabular-nums" style={{ color: '#bf5af2' }}>
              {totalApproved > 0 ? Math.round((metrics.shortcuts.ever_used / totalApproved) * 100) : 0}%
            </span>
          </div>
          <PctBar value={metrics.shortcuts.ever_used} total={totalApproved} color="#bf5af2" />

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)' }} />

          {/* Apple Pay breakdown */}
          <div className="space-y-2.5">
            <div>
              <p className="text-[12px] font-bold mb-1.5 flex items-center gap-1.5">
                <i className="fa-brands fa-apple text-[12px]" style={{ color: DARK }} />
                <span style={{ color: DARK }}>Apple Pay — {metrics.shortcuts.apple_pay} usuarios</span>
              </p>
              <PctBar value={metrics.shortcuts.apple_pay} total={totalApproved} color={DARK} />
            </div>
            <div>
              <p className="text-[12px] font-bold mb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-bolt text-[11px]" style={{ color: '#bf5af2' }} />
                <span style={{ color: DARK }}>Registro Rápido — {metrics.shortcuts.quick_register} usuarios</span>
              </p>
              <PctBar value={metrics.shortcuts.quick_register} total={totalApproved} color="#bf5af2" />
            </div>
            {metrics.shortcuts.unknown_source > 0 && (
              <div>
                <p className="text-[12px] font-bold mb-1.5" style={{ color: GRAY }}>
                  Sin fuente identificada — {metrics.shortcuts.unknown_source}
                  <span className="font-normal ml-1">(atajo antiguo sin campo source)</span>
                </p>
                <PctBar value={metrics.shortcuts.unknown_source} total={totalApproved} color={GRAY} />
              </div>
            )}
            <div>
              <p className="text-[12px] font-bold mb-1.5" style={{ color: GRAY }}>Sin usar — {metrics.shortcuts.never_used}</p>
              <PctBar value={metrics.shortcuts.never_used} total={totalApproved} color="rgba(0,0,0,0.15)" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Actividad ── */}
      <section>
        <p className="text-[11px] font-black uppercase tracking-[3px] mb-3" style={{ color: GRAY }}>Actividad (últimos 7 días)</p>
        <div className="rounded-[20px] p-5 space-y-4" style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] font-bold" style={{ color: DARK }}>Usuarios activos</span>
            <span className="text-[22px] font-black tabular-nums" style={{ color: GREEN }}>
              {totalApproved > 0 ? Math.round((metrics.activity.active_7d / totalApproved) * 100) : 0}%
            </span>
          </div>
          <div className="space-y-2.5">
            <div>
              <p className="text-[12px] font-bold mb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-circle text-[8px]" style={{ color: GREEN }} />
                <span style={{ color: DARK }}>Con movimientos — {metrics.activity.active_7d}</span>
              </p>
              <PctBar value={metrics.activity.active_7d} total={totalApproved} color={GREEN} />
            </div>
            <div>
              <p className="text-[12px] font-bold mb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-circle text-[8px]" style={{ color: GRAY }} />
                <span style={{ color: GRAY }}>Inactivos — {metrics.activity.inactive_7d}</span>
              </p>
              <PctBar value={metrics.activity.inactive_7d} total={totalApproved} color={GRAY} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Correos enviados ── */}
      <section>
        <p className="text-[11px] font-black uppercase tracking-[3px] mb-3" style={{ color: GRAY }}>Correos de retención (usuarios únicos)</p>
        <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          {[
            { label: 'Aviso fin de prueba', value: metrics.emails.trial_expiring, color: ORANGE, icon: 'fa-clock' },
            { label: 'Recordatorio de Atajo', value: metrics.emails.shortcut_reminder, color: '#bf5af2', icon: 'fa-bolt' },
            { label: 'Re-engagement (inactivos)', value: metrics.emails.reengagement, color: BLUE, icon: 'fa-rotate-right' },
          ].map((row, i) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-3.5"
              style={{ background: LIGHT, borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${row.color}18` }}>
                  <i className={`fa-solid ${row.icon} text-[12px]`} style={{ color: row.color }} />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: DARK }}>{row.label}</span>
              </div>
              <span className="text-[20px] font-black tabular-nums" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminClient({ profiles }: { profiles: AdminProfile[] }) {
  const router = useRouter()
  const [view, setView]     = useState<'users' | 'inbox' | 'metrics'>('users')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [unreadTickets, setUnreadTickets] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  function handleRefresh() {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1200)
  }

  useEffect(() => {
    getAdminConversations().then(convs => {
      setUnreadTickets(convs.filter(c => c.unread_admin > 0).length)
    })
  }, [])

  // Metrics
  const total    = profiles.length
  const trialing = profiles.filter(p => p.subscription_status === 'trialing').length
  const active   = profiles.filter(p => p.subscription_status === 'active').length
  const expired  = profiles.filter(p => ['expired','grace','past_due','unpaid','incomplete','incomplete_expired'].includes(p.subscription_status)).length

  // Revenue (estimate: paying users × $89/mo, annual ≈ same since we don't know plan)
  const mrr = active * 89

  const filtered = applyFilter(profiles, filter).filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q)
  })

  function handleApprove(id: string) {
    startTransition(async () => {
      const r = await setUserAccountStatus(id, 'approved')
      r.error ? toast.error(r.error) : toast.success('Usuario aprobado')
    })
  }
  function handleReject(id: string) {
    startTransition(async () => {
      const r = await setUserAccountStatus(id, 'rejected')
      r.error ? toast.error(r.error) : toast.success('Usuario rechazado')
    })
  }
  function handleExtend(id: string, days: number) {
    startTransition(async () => {
      const r = await extendUserTrial(id, days)
      r.error ? toast.error(r.error) : toast.success(`Prueba extendida ${days} días`)
    })
  }
  function handleSetSub(id: string, status: string) {
    startTransition(async () => {
      const r = await setUserSubscriptionStatus(id, status)
      r.error ? toast.error(r.error) : toast.success('Estado actualizado')
    })
  }
  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: DARK }}>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-3xl mx-auto px-5 h-[56px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[20px] font-black tracking-tight" style={{ color: BLUE }}>fluxapp</span>
            <span className="text-[13px] font-black px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(0,122,255,0.10)', color: BLUE }}>admin</span>
          </div>
          <div className="flex items-center gap-2">
            {isPending && <i className="fa-solid fa-spinner fa-spin text-sm" style={{ color: BLUE }} />}
            <button onClick={handleRefresh}
              className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all active:scale-90"
              style={{ background: LIGHT, color: GRAY }}
              title="Actualizar datos">
              <i className={`fa-solid fa-rotate-right text-[14px] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/home" className="text-[13px] font-bold px-3 py-1.5 rounded-[10px]"
              style={{ background: LIGHT, color: GRAY }}>← App</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-16">
        {/* ── Title + view tabs ── */}
        <div className="pt-8 pb-5">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-2" style={{ color: BLUE }}>Panel de control</p>
          {/* Title row */}
          <h1 className="text-[32px] font-black tracking-tight leading-tight mb-0.5" style={{ color: DARK }}>
            {view === 'users' ? 'Usuarios' : view === 'inbox' ? 'Buzón' : 'Métricas'}
          </h1>
          <p className="text-[14px] font-medium mb-4" style={{ color: GRAY }}>
            {view === 'users'
              ? `${profiles.length} ${profiles.length === 1 ? 'usuario' : 'usuarios'} registrados`
              : view === 'inbox'
              ? 'Conversaciones de soporte'
              : 'Estadísticas y retención'}
          </p>
          {/* View switcher — own row, full width */}
          <div className="flex gap-2">
              <button onClick={() => setView('users')}
                className="relative flex-1 py-2.5 rounded-[12px] text-[13px] font-bold transition-all"
                style={view === 'users' ? { background: BLUE, color: '#fff' } : { background: LIGHT, color: GRAY, border: '1px solid rgba(0,0,0,0.07)' }}>
                <i className="fa-solid fa-users mr-1.5" />Usuarios
              </button>
              <button onClick={() => setView('inbox')}
                className="relative flex-1 py-2.5 rounded-[12px] text-[13px] font-bold transition-all"
                style={view === 'inbox' ? { background: BLUE, color: '#fff' } : { background: LIGHT, color: GRAY, border: '1px solid rgba(0,0,0,0.07)' }}>
                <i className="fa-solid fa-inbox mr-1.5" />Buzón
                {unreadTickets > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black text-white flex items-center justify-center px-1"
                    style={{ background: RED }}>{unreadTickets}</span>
                )}
              </button>
              <button onClick={() => setView('metrics')}
                className="relative flex-1 py-2.5 rounded-[12px] text-[13px] font-bold transition-all"
                style={view === 'metrics' ? { background: BLUE, color: '#fff' } : { background: LIGHT, color: GRAY, border: '1px solid rgba(0,0,0,0.07)' }}>
                <i className="fa-solid fa-chart-line mr-1.5" />Métricas
              </button>
          </div>
        </div>

        {/* ════════════════════════════════ USERS VIEW ════════════════════════════════ */}
        {view === 'users' && (
          <>
            {/* ── Stats 2×2 grid ── */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <StatCard label="Total"      value={total}    color={DARK}  active={filter === 'all'}      onClick={() => setFilter('all')} />
              <StatCard label="En prueba"  value={trialing} color={BLUE}  active={filter === 'trialing'} onClick={() => setFilter(f => f === 'trialing' ? 'all' : 'trialing')} />
              <StatCard label="Activos"    value={active}   color={GREEN} active={filter === 'active'}   onClick={() => setFilter(f => f === 'active' ? 'all' : 'active')} />
              <StatCard label="Expirados"  value={expired}  color={RED}   active={filter === 'expired'}  onClick={() => setFilter(f => f === 'expired' ? 'all' : 'expired')} />
            </div>

            {/* ── Revenue card ── */}
            <div className="rounded-[20px] p-5 mb-6" style={{ background: 'rgba(0,173,64,0.06)', border: '1px solid rgba(0,173,64,0.2)' }}>
              <p className="text-[12px] font-black uppercase tracking-[3px] mb-3" style={{ color: GREEN }}>Ingresos</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[28px] font-black tabular-nums leading-none" style={{ color: DARK }}>{formatMXN(mrr)}</p>
                  <p className="text-[12px] font-bold mt-1" style={{ color: GRAY }}>MRR estimado</p>
                </div>
                <div>
                  <p className="text-[28px] font-black tabular-nums leading-none" style={{ color: DARK }}>{active}</p>
                  <p className="text-[12px] font-bold mt-1" style={{ color: GRAY }}>Clientes activos</p>
                </div>
              </div>
              <p className="text-[11px] font-medium mt-3" style={{ color: 'rgba(0,0,0,0.35)' }}>
                Estimado con plan mensual $89 · Revisa el total real en el Dashboard de Stripe
              </p>
            </div>

            {/* ── Search ── */}
            <div className="relative mb-5">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: GRAY }} />
              <input type="text" placeholder="Buscar por nombre, email o @username…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-[14px] text-[15px] font-medium outline-none"
                style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.07)', color: DARK }} />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: GRAY }}>
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              )}
            </div>

            {/* ── User list ── */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <i className="fa-solid fa-users-slash text-4xl mb-4 block" style={{ color: 'rgba(0,0,0,0.15)' }} />
                <p className="text-[16px] font-semibold" style={{ color: GRAY }}>
                  {search ? 'Sin resultados para esa búsqueda' : 'No hay usuarios en este filtro'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(p => (
                  <UserCard key={p.id} profile={p} isPending={isPending}
                    onApprove={handleApprove} onReject={handleReject}
                    onExtend={handleExtend} onSetSub={handleSetSub} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════ INBOX VIEW ════════════════════════════════ */}
        {view === 'inbox' && <AdminInbox />}

        {/* ════════════════════════════════ METRICS VIEW ════════════════════════════ */}
        {view === 'metrics' && <MetricsView />}
      </main>
    </div>
  )
}
