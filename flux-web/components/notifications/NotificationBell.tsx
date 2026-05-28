'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { markNotificationsRead, respondFriendRequest } from '@/actions/friends'
import { acceptSharedExpense, declineSharedExpense } from '@/actions/transactions'
import { formatCurrency } from '@/lib/utils'
import type { Notification } from '@/lib/types'

function notifLabel(n: Notification): { icon: string; iconColor: string; text: string } {
  const d = n.data as Record<string, string>
  switch (n.type) {
    case 'friend_request':
      return { icon: 'fa-solid fa-user-plus', iconColor: 'var(--f-blue)', text: `@${d.from_username || d.from_name} quiere ser tu amigo` }
    case 'friend_accepted':
      return { icon: 'fa-solid fa-user-check', iconColor: 'var(--f-income)', text: `@${d.from_username || d.from_name} aceptó tu solicitud` }
    case 'friend_declined':
      return { icon: 'fa-solid fa-user-xmark', iconColor: 'var(--f-expense)', text: `@${d.from_username || d.from_name} rechazó tu solicitud` }
    case 'shared_expense_invite':
      return { icon: 'fa-solid fa-receipt', iconColor: 'var(--f-transfer)', text: `@${d.from_username} te invita a dividir: ${d.concept}` }
    case 'shared_expense_sent': {
      const names = Array.isArray(d.invited_names) ? (d.invited_names as string[]).join(', ') : ''
      return { icon: 'fa-solid fa-paper-plane', iconColor: 'var(--f-blue)', text: `Invitaste a ${names} a dividir: ${d.concept}` }
    }
    case 'expense_settled':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-income)', text: `@${d.from_username} saldó una deuda` }
    default:
      return { icon: 'fa-solid fa-bell', iconColor: 'var(--f-text-3)', text: 'Notificación' }
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptAccountId, setAcceptAccountId] = useState('')

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .then(({ count }) => setUnread(count ?? 0))
  }, [])

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    const supabase = createClient()
    const [{ data: notifs }, { data: accs }] = await Promise.all([
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('accounts').select('id, name').eq('is_active', true).order('sort_order'),
    ])
    setList(notifs ?? [])
    setAccounts(accs ?? [])
    setLoading(false)
    if (unread > 0) {
      setUnread(0)
      startTransition(async () => { await markNotificationsRead() })
    }
  }

  function handleAcceptExpense(notifId: string) {
    if (!acceptAccountId) return
    startTransition(async () => {
      const res = await acceptSharedExpense(notifId, acceptAccountId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Gasto registrado')
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
      setAcceptingId(null)
      setAcceptAccountId('')
    })
  }

  function handleDeclineExpense(notifId: string) {
    startTransition(async () => {
      const res = await declineSharedExpense(notifId)
      if (res.error) { toast.error(res.error); return }
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    })
  }

  function handleFriendResponse(friendshipId: string, accept: boolean) {
    startTransition(async () => {
      const res = await respondFriendRequest(friendshipId, accept)
      if (res.error) { toast.error(res.error); return }
      toast.success(accept ? 'Solicitud aceptada' : 'Solicitud rechazada')
      setList(prev => prev.filter(n => {
        if (n.type !== 'friend_request') return true
        const d = n.data as Record<string, string>
        return d.friendship_id !== friendshipId
      }))
    })
  }

  const bellButton = (
    <button
      onClick={handleOpen}
      className="relative flex items-center justify-center rounded-[14px] transition-all active:scale-90"
      style={{ width: 44, height: 44, background: unread > 0 ? 'var(--f-accent-bg)' : 'transparent' }}
    >
      <i className="fa-solid fa-bell text-[20px]" style={{ color: unread > 0 ? 'var(--f-blue)' : 'var(--f-text-3)' }} />
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white px-1"
          style={{ background: 'var(--f-expense)', lineHeight: 1 }}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )

  const panel = open && mounted && createPortal(
    <div
      className="fixed inset-0 z-[200]"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] flex flex-col"
        style={{
          background: 'var(--f-bg-card)',
          border: '1px solid var(--f-line)',
          maxHeight: '85dvh',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--f-line)' }}>
          <p className="text-[17px] font-black" style={{ color: 'var(--f-text)' }}>Notificaciones</p>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex justify-center">
              <i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: 'var(--f-text-4)' }} />
            </div>
          ) : list.length === 0 ? (
            <div className="py-20 text-center">
              <i className="fa-solid fa-bell-slash text-3xl mb-4 block" style={{ color: 'var(--f-text-4)' }} />
              <p className="text-[14px] font-semibold" style={{ color: 'var(--f-text-4)' }}>Sin notificaciones</p>
            </div>
          ) : list.map(n => {
            const { icon, iconColor, text } = notifLabel(n)
            const d = n.data as Record<string, string>
            return (
              <div
                key={n.id}
                className="px-5 py-4"
                style={{ background: n.read ? 'transparent' : 'var(--f-accent-bg)', borderBottom: '1px solid var(--f-line)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--f-bg-input)' }}>
                    <i className={`${icon} text-[14px]`} style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold leading-snug" style={{ color: 'var(--f-text)' }}>{text}</p>
                    <p className="text-[12px] mt-0.5 font-medium" style={{ color: 'var(--f-text-4)' }}>
                      {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                    </p>
                    {n.type === 'friend_request' && !n.read && d.friendship_id && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleFriendResponse(d.friendship_id, false)}
                          disabled={isPending}
                          className="flex-1 py-2 rounded-[10px] text-[12px] font-black transition-all active:scale-95 disabled:opacity-50"
                          style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleFriendResponse(d.friendship_id, true)}
                          disabled={isPending}
                          className="flex-[2] py-2 rounded-[10px] text-[12px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                          style={{ background: 'var(--f-blue)' }}
                        >
                          {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Aceptar'}
                        </button>
                      </div>
                    )}
                    {n.type === 'shared_expense_invite' && !n.read && (
                      <>
                        <p className="text-[12px] mt-1 font-bold tabular-nums" style={{ color: 'var(--f-transfer)' }}>
                          Tu parte: {formatCurrency(Number(d.participant_amount))}
                        </p>
                        {acceptingId === n.id ? (
                          <div className="mt-3 space-y-2">
                            <select
                              value={acceptAccountId}
                              onChange={e => setAcceptAccountId(e.target.value)}
                              className="w-full rounded-[10px] px-3 py-2 text-[13px] font-semibold outline-none"
                              style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)', colorScheme: 'dark' }}
                            >
                              <option value="">¿En qué cuenta?</option>
                              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setAcceptingId(null); setAcceptAccountId('') }}
                                className="flex-1 py-2 rounded-[10px] text-[12px] font-black"
                                style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleAcceptExpense(n.id)}
                                disabled={!acceptAccountId || isPending}
                                className="flex-[2] py-2 rounded-[10px] text-[12px] font-black text-white disabled:opacity-50 active:scale-95"
                                style={{ background: 'var(--f-transfer)' }}
                              >
                                {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Confirmar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleDeclineExpense(n.id)}
                              disabled={isPending}
                              className="flex-1 py-2 rounded-[10px] text-[12px] font-black transition-all active:scale-95 disabled:opacity-50"
                              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                            >
                              Ignorar
                            </button>
                            <button
                              onClick={() => { setAcceptingId(n.id); setAcceptAccountId('') }}
                              disabled={isPending}
                              className="flex-[2] py-2 rounded-[10px] text-[12px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                              style={{ background: 'var(--f-transfer)' }}
                            >
                              Registrar
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      {bellButton}
      {panel}
    </>
  )
}
