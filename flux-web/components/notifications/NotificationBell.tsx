'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { markNotificationsRead, respondFriendRequest, deleteNotification, clearAllNotifications } from '@/actions/friends'
import { acceptSharedExpense, declineSharedExpense, confirmSettledExpense, rejectSettledExpense, acceptReceivableInvite, declineReceivableInvite, acceptSyncProposal, declineSyncProposal } from '@/actions/transactions'
import { getExchangeRateForDate } from '@/actions/exchangeRates'
import { formatCurrency } from '@/lib/utils'
import { useBottomSheetSwipe } from '@/lib/hooks/useBottomSheetSwipe'
import { SwipeableRow } from '@/components/shared/SwipeableRow'
import AssignFriendModal from '@/components/friends/AssignFriendModal'
import type { Notification } from '@/lib/types'

function notifLabel(n: Notification): { icon: string; iconColor: string; text: string } {
  const d = n.data as Record<string, string>
  switch (n.type) {
    case 'friend_request':
      return { icon: 'fa-solid fa-user-plus', iconColor: 'var(--f-blue)', text: `@${d.from_username || d.from_name} quiere ser tu amigo en Flux` }
    case 'friend_accepted':
      return { icon: 'fa-solid fa-user-check', iconColor: 'var(--f-income)', text: `@${d.from_username || d.from_name} aceptó — ya pueden dividir gastos juntos` }
    case 'friend_declined':
      return { icon: 'fa-solid fa-user-xmark', iconColor: 'var(--f-expense)', text: `@${d.from_username || d.from_name} rechazó tu solicitud de amistad` }
    case 'shared_expense_invite':
      return { icon: 'fa-solid fa-receipt', iconColor: 'var(--f-transfer)', text: `@${d.from_username} pagó "${d.concept}" y dice que le debes tu parte` }
    case 'shared_expense_updated':
      return { icon: 'fa-solid fa-pen-to-square', iconColor: 'var(--f-transfer)', text: `@${d.from_username} cambió un gasto en el que participas: "${d.concept}"` }
    case 'sync_proposal':
      return { icon: 'fa-solid fa-arrows-rotate', iconColor: 'var(--f-blue)', text: `@${d.from_username} dice que participaste en: "${d.concept}" — ¿lo agregas a tu app?` }
    case 'sync_accepted':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-income)', text: `@${d.from_username} aceptó el gasto compartido: "${d.concept}"` }
    case 'sync_declined':
      return { icon: 'fa-solid fa-circle-xmark', iconColor: 'var(--f-expense)', text: `@${d.from_username} no reconoce el gasto: "${d.concept}"` }
    case 'shared_expense_sent': {
      const names = Array.isArray(d.invited_names) ? (d.invited_names as string[]).join(', ') : ''
      return { icon: 'fa-solid fa-paper-plane', iconColor: 'var(--f-blue)', text: `Le avisaste a ${names} sobre: "${d.concept}" — te avisaremos cuando acepte` }
    }
    case 'shared_expense_accepted':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-transfer)', text: `@${d.from_username} aceptó — te pagará cuando pueda. Revísalo en Compartidos` }
    case 'shared_expense_declined':
      return { icon: 'fa-solid fa-circle-xmark', iconColor: 'var(--f-expense)', text: `@${d.from_username} no aceptó el gasto: "${d.concept}"` }
    case 'expense_settled_confirm':
      return { icon: 'fa-solid fa-hand-holding-dollar', iconColor: 'var(--f-income)', text: `@${d.from_username} dice que ya te pagó "${d.concept}" — ¿lo confirmas?` }
    case 'expense_settled':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-income)', text: `Confirmaste que @${d.from_username} te pagó "${d.concept}"` }
    case 'expense_settle_rejected':
      return { icon: 'fa-solid fa-circle-xmark', iconColor: 'var(--f-expense)', text: `No confirmaste el pago de @${d.from_username} en "${d.concept}"` }
    case 'receivable_invite':
      return { icon: 'fa-solid fa-file-invoice-dollar', iconColor: '#FF9F0A', text: `@${d.from_username} dice que le debes: "${d.concept}" · ${formatCurrency(Number(d.participant_amount))}` }
    case 'receivable_abono':
      return { icon: 'fa-solid fa-coins', iconColor: 'var(--f-income)', text: `@${d.from_username} anotó que les pagaste ${formatCurrency(Number(d.amount))} de: "${d.concept}"` }
    case 'receivable_settled':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-income)', text: `@${d.from_username} confirmó que ya les pagaste todo: "${d.concept}"` }
    case 'scheduled_due':
      return { icon: 'fa-solid fa-calendar-exclamation', iconColor: 'var(--f-expense)', text: `Vence hoy: ${d.name} · ${formatCurrency(Number(d.amount))}` }
    case 'tdc_due': {
      const days = Number(d.days_until)
      const when = days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`
      return { icon: 'fa-solid fa-credit-card', iconColor: 'var(--f-transfer)', text: `Pago TDC ${d.name} — vence ${when}` }
    }
    case 'budget_alert': {
      const isRed = d.level === '100'
      return {
        icon: 'fa-solid fa-chart-pie',
        iconColor: isRed ? 'var(--f-expense)' : '#FF9F0A',
        text: isRed
          ? `Presupuesto agotado — ${formatCurrency(Number(d.spent))} de ${formatCurrency(Number(d.limit))}`
          : `Presupuesto al 80% — ${formatCurrency(Number(d.spent))} de ${formatCurrency(Number(d.limit))}`,
      }
    }
    case 'trial_expiring':
      return {
        icon: 'fa-solid fa-hourglass-half',
        iconColor: '#FF9F0A',
        text: `Tu prueba vence en ${d.days_left} ${Number(d.days_left) === 1 ? 'día' : 'días'} — ve a Ajustes`,
      }
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
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [confirmAccountId, setConfirmAccountId] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [assignFriend, setAssignFriend] = useState<{ userId: string; name: string } | null>(null)
  const [userCurrency, setUserCurrency] = useState('MXN')
  const [crossCurrencyPending, setCrossCurrencyPending] = useState<{
    notifId: string
    expenseCurrency: string
    amount: number
    concept: string
    convertedAmount: number | null
  } | null>(null)
  const [crossCurrencyLoading, setCrossCurrencyLoading] = useState(false)

  const [closing, setClosing] = useState(false)
  const handleClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(() => { setOpen(false); setClosing(false) }, 260)
  }, [closing])
  const { handleProps: swipeHandleProps, sheetStyle } = useBottomSheetSwipe(handleClose)

  // Lock body scroll while panel is open
  useEffect(() => {
    if (!open) return
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [open])

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

    // Initial unread count + subscribe to realtime
    ;(async () => {
      const [{ count }, { data: { user } }] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false),
        supabase.auth.getUser(),
      ])
      setUnread(count ?? 0)
      if (!user) return

      realtimeChannel = supabase
        .channel(`notif:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setUnread(prev => prev + 1)
            setList(prev => {
              if (prev.length === 0) return prev // panel closed — update on open
              return [payload.new as import('@/lib/types').Notification, ...prev]
            })
          }
        )
        .subscribe()
    })()

    return () => { if (realtimeChannel) supabase.removeChannel(realtimeChannel) }
  }, [])

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    const supabase = createClient()
    const [{ data: notifs }, { data: accs }, { data: profile }] = await Promise.all([
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('accounts').select('id, name').eq('is_active', true).order('sort_order'),
      supabase.from('profiles').select('currency').maybeSingle(),
    ])
    setList(notifs ?? [])
    setAccounts(accs ?? [])
    setUserCurrency((profile as any)?.currency ?? 'MXN')
    setLoading(false)
    if (unread > 0) {
      setUnread(0)
      // Don't auto-mark actionable notifications as read — they need explicit user action.
      // They get marked read only when accept/decline/confirm/reject is executed.
      const ACTIONABLE = ['friend_request', 'shared_expense_invite', 'shared_expense_updated', 'sync_proposal', 'receivable_invite', 'expense_settled_confirm']
      const passiveIds = (notifs ?? [])
        .filter(n => !n.read && !ACTIONABLE.includes(n.type))
        .map(n => n.id)
      if (passiveIds.length > 0) {
        startTransition(async () => { await markNotificationsRead(passiveIds) })
      }
    }
  }

  function handleAcceptExpense(notifId: string) {
    const notif = list.find(n => n.id === notifId)
    const d = (notif?.data ?? {}) as Record<string, unknown>
    const expenseCurrency = String(d.currency ?? 'MXN')

    if (expenseCurrency !== userCurrency) {
      const amount = Number(d.participant_amount ?? 0)
      setCrossCurrencyPending({ notifId, expenseCurrency, amount, concept: String(d.concept ?? ''), convertedAmount: null })
      setCrossCurrencyLoading(true)
      const today = new Date().toISOString().slice(0, 10)
      getExchangeRateForDate(expenseCurrency, userCurrency, today).then(rate => {
        const converted = rate != null ? Math.round(amount * rate * 100) / 100 : null
        setCrossCurrencyPending(prev => prev ? { ...prev, convertedAmount: converted } : null)
        setCrossCurrencyLoading(false)
      })
      return
    }

    startTransition(async () => {
      const res = await acceptSharedExpense(notifId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Guardado en Compartidos — paga cuando puedas y regístralo allí')
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    })
  }

  function doAccept(mode: 'original' | 'convert') {
    if (!crossCurrencyPending) return
    const { notifId, expenseCurrency, amount, convertedAmount } = crossCurrencyPending
    const finalCurrency = mode === 'convert' ? userCurrency : expenseCurrency
    const finalAmount = mode === 'convert' ? (convertedAmount ?? amount) : amount
    setCrossCurrencyPending(null)
    startTransition(async () => {
      const res = await acceptSharedExpense(notifId, finalCurrency, finalAmount)
      if (res.error) { toast.error(res.error); return }
      toast.success('Guardado en Compartidos — paga cuando puedas y regístralo allí')
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    })
  }

  function handleRejectSettle(notifId: string) {
    startTransition(async () => {
      const res = await rejectSettledExpense(notifId)
      if (res.error) { toast.error(res.error); return }
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
      setRejectingId(null)
    })
  }

  function handleConfirmSettle(notifId: string) {
    startTransition(async () => {
      const res = await confirmSettledExpense(notifId, confirmAccountId || undefined)
      if (res.error) { toast.error(res.error); return }
      toast.success(confirmAccountId ? 'Confirmado y registrado en cuenta' : 'Confirmado')
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
      setConfirmAccountId('')
    })
  }

  function handleDeclineExpense(notifId: string) {
    startTransition(async () => {
      const res = await declineSharedExpense(notifId)
      if (res.error) { toast.error(res.error); return }
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    })
  }

  function handleAcceptReceivable(notifId: string) {
    startTransition(async () => {
      const res = await acceptReceivableInvite(notifId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Guardado en Compartidos — págalo cuando puedas y regístralo allí')
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    })
  }

  function handleDeclineReceivable(notifId: string) {
    startTransition(async () => {
      const res = await declineReceivableInvite(notifId)
      if (res.error) { toast.error(res.error); return }
      setList(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteNotification(id)
      setList(prev => prev.filter(n => n.id !== id))
      setDeletingId(null)
    })
  }

  function handleClearAll() {
    startTransition(async () => {
      await clearAllNotifications()
      setList([])
      setUnread(0)
    })
  }

  function handleFriendResponse(n: Notification, accept: boolean) {
    const d = n.data as Record<string, string>
    const friendshipId = d.friendship_id
    startTransition(async () => {
      const res = await respondFriendRequest(friendshipId, accept)
      if (res.error) { toast.error(res.error); return }
      toast.success(accept ? 'Solicitud aceptada' : 'Solicitud rechazada')
      setList(prev => prev.filter(notif => notif.id !== n.id))
      if (accept) {
        setAssignFriend({
          userId: d.from_user_id,
          name: d.from_name || `@${d.from_username}` || 'Amigo',
        })
      }
    })
  }

  const bellButton = (
    <button
      onClick={handleOpen}
      className="relative flex items-center justify-center rounded-[14px] transition-all active:scale-90"
      style={{ width: 44, height: 44, background: unread > 0 ? 'var(--f-accent-bg)' : 'transparent' }}
    >
      <i className="fa-solid fa-bell text-[22px]" style={{ color: unread > 0 ? 'var(--f-blue)' : 'var(--f-text-3)' }} />
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[12px] font-black text-white px-1"
          style={{ background: 'var(--f-expense)', lineHeight: 1 }}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )

  const panel = (open || closing) && mounted && createPortal(
    <div
      className={`fixed inset-0 z-[200] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-[28px] flex flex-col ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{
          background: 'var(--f-bg-card)',
          border: '1px solid var(--f-line)',
          maxHeight: '85dvh',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          ...sheetStyle,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle — drag here to dismiss */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0" {...swipeHandleProps}>
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--f-line)' }}>
          <p className="text-[19px] font-black" style={{ color: 'var(--f-text)' }}>Notificaciones</p>
          <div className="flex items-center gap-2">
            {list.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isPending}
                className="px-3 py-1.5 rounded-[10px] text-[13px] font-bold disabled:opacity-50"
                style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
              >
                Limpiar todo
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          </div>
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
              <p className="text-[16px] font-semibold" style={{ color: 'var(--f-text-4)' }}>Sin notificaciones</p>
            </div>
          ) : list.map(n => {
            const { icon, iconColor, text } = notifLabel(n)
            const d = n.data as Record<string, string>
            return (
              <SwipeableRow
                key={n.id}
                rightActions={[{
                  icon: 'fa-solid fa-trash',
                  label: 'Eliminar',
                  bg: 'var(--f-expense)',
                  onClick: () => handleDelete(n.id),
                }]}
              >
              <div
                className="px-5 py-4"
                style={{ background: n.read ? 'transparent' : 'var(--f-accent-bg)', borderBottom: '1px solid var(--f-line)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--f-bg-input)' }}>
                    <i className={`${icon} text-[16px]`} style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold leading-snug" style={{ color: 'var(--f-text)' }}>{text}</p>
                    <p className="text-[14px] mt-0.5 font-medium" style={{ color: 'var(--f-text-4)' }}>
                      {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                    </p>
                    {n.type === 'friend_request' && !n.read && d.friendship_id && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleFriendResponse(n, false)}
                          disabled={isPending}
                          className="flex-1 py-3 rounded-[12px] text-[15px] font-black transition-all active:scale-95 disabled:opacity-50"
                          style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleFriendResponse(n, true)}
                          disabled={isPending}
                          className="flex-[2] py-3 rounded-[12px] text-[15px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                          style={{ background: 'var(--f-blue)' }}
                        >
                          {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Aceptar'}
                        </button>
                      </div>
                    )}
                    {n.type === 'expense_settled_confirm' && !n.read && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--f-income)' }}>
                          Monto reportado: {formatCurrency(Number(d.amount))}
                        </p>
                        <p className="text-[13px] font-medium leading-snug" style={{ color: 'var(--f-text-4)' }}>
                          ¿Realmente recibiste este pago? Si confirmas, el saldo compartido se cierra. Si seleccionas una cuenta, se registra también como ingreso en tu saldo.
                        </p>
                        <select
                          value={confirmAccountId}
                          onChange={e => setConfirmAccountId(e.target.value)}
                          className="w-full rounded-[10px] px-3 py-2 text-[15px] font-semibold outline-none"
                          style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)', colorScheme: 'dark' }}
                        >
                          <option value="">Solo cerrar saldo (sin mover cuenta)</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>Registrar en: {acc.name}</option>)}
                        </select>
                        {rejectingId === n.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRejectingId(null)}
                              className="flex-1 py-2.5 rounded-[12px] text-[15px] font-black"
                              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleRejectSettle(n.id)}
                              disabled={isPending}
                              className="flex-[2] py-2.5 rounded-[12px] text-[15px] font-black text-white disabled:opacity-50 active:scale-95"
                              style={{ background: 'var(--f-expense)' }}
                            >
                              {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Sí, rechazar pago'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRejectingId(n.id)}
                              disabled={isPending}
                              className="flex-1 py-2.5 rounded-[12px] text-[15px] font-black transition-all active:scale-95 disabled:opacity-50"
                              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                            >
                              No recibí nada
                            </button>
                            <button
                              onClick={() => handleConfirmSettle(n.id)}
                              disabled={isPending}
                              className="flex-[2] py-2.5 rounded-[12px] text-[15px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                              style={{ background: 'var(--f-income)' }}
                            >
                              {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : '✓ Sí, me pagó'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {(n.type === 'shared_expense_invite' || n.type === 'shared_expense_updated') && !n.read && (
                      <>
                        <p className="text-[14px] mt-1 font-bold tabular-nums" style={{ color: 'var(--f-transfer)' }}>
                          Tu parte: {formatCurrency(Number(d.participant_amount))}
                        </p>
                        <p className="text-[13px] mt-1 font-medium leading-snug" style={{ color: 'var(--f-text-4)' }}>
                          Si aceptas, quedará en <strong style={{ color: 'var(--f-text-3)' }}>Compartidos</strong>. Tu saldo no cambia ahora — solo cuando registres el pago.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDeclineExpense(n.id)}
                            disabled={isPending}
                            className="flex-1 py-3 rounded-[12px] text-[15px] font-black transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                          >
                            Ignorar
                          </button>
                          <button
                            onClick={() => handleAcceptExpense(n.id)}
                            disabled={isPending}
                            className="flex-[2] py-3 rounded-[12px] text-[15px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--f-transfer)' }}
                          >
                            {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Sí, lo debo'}
                          </button>
                        </div>
                      </>
                    )}
                    {n.type === 'sync_proposal' && !n.read && (
                      <>
                        <p className="text-[14px] mt-1 font-bold tabular-nums" style={{ color: 'var(--f-blue)' }}>
                          Tu parte: {formatCurrency(Number(d.participant_amount))}
                        </p>
                        <p className="text-[13px] mt-1 font-medium leading-snug" style={{ color: 'var(--f-text-4)' }}>
                          Si aceptas, se creará este gasto en tu app para que lo registres.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => { startTransition(async () => { const r = await declineSyncProposal(n.id); if (r.error) toast.error(r.error); setList(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)) }) }}
                            disabled={isPending}
                            className="flex-1 py-3 rounded-[12px] text-[15px] font-black transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                          >
                            No reconozco
                          </button>
                          <button
                            onClick={() => { startTransition(async () => { const r = await acceptSyncProposal(n.id); if (r.error) { toast.error(r.error); return } toast.success('Gasto agregado — lo verás en Compartidos'); setList(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)) }) }}
                            disabled={isPending}
                            className="flex-[2] py-3 rounded-[12px] text-[15px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--f-blue)' }}
                          >
                            {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Sí, agregar a mi app'}
                          </button>
                        </div>
                      </>
                    )}
                    {n.type === 'receivable_invite' && !n.read && (
                      <>
                        <p className="text-[14px] mt-1 font-bold tabular-nums" style={{ color: '#FF9F0A' }}>
                          Monto: {formatCurrency(Number(d.participant_amount))}
                        </p>
                        <p className="text-[13px] mt-1 font-medium leading-snug" style={{ color: 'var(--f-text-4)' }}>
                          Si aceptas, aparecerá en <strong style={{ color: 'var(--f-text-3)' }}>Compartidos</strong>. Tu saldo no cambia ahora — solo cuando registres el pago allí.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleDeclineReceivable(n.id)}
                            disabled={isPending}
                            className="flex-1 py-3 rounded-[12px] text-[15px] font-black transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                          >
                            No reconozco
                          </button>
                          <button
                            onClick={() => handleAcceptReceivable(n.id)}
                            disabled={isPending}
                            className="flex-[2] py-3 rounded-[12px] text-[15px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: '#FF9F0A' }}
                          >
                            {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Sí, lo acepto'}
                          </button>
                        </div>
                      </>
                    )}
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(n.id)}
                      disabled={deletingId === n.id || isPending}
                      className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
                      style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-4)' }}
                    >
                      {deletingId === n.id
                        ? <i className="fa-solid fa-spinner fa-spin text-[12px]" />
                        : <i className="fa-solid fa-xmark text-[12px]" />
                      }
                    </button>
                  </div>
                </div>
                {/* friend_accepted: offer to assign to a contact */}
                {n.type === 'friend_accepted' && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => setAssignFriend({ userId: d.from_user_id, name: d.from_name || `@${d.from_username}` })}
                      className="w-full py-2.5 rounded-[12px] text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-70"
                      style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}
                    >
                      <i className="fa-solid fa-link text-xs" />
                      Asignar a contacto
                    </button>
                  </div>
                )}
              </div>
            </SwipeableRow>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )

  const crossCurrencyModal = crossCurrencyPending && mounted && createPortal(
    <div className="fixed inset-0 z-[300] flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={() => !isPending && setCrossCurrencyPending(null)} />
      <div
        className="relative w-full rounded-t-[24px] p-6 pb-10 animate-slide-up"
        style={{ background: 'var(--f-bg-card)' }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--f-text-5)' }} />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--f-transfer-bg)' }}>
            <i className="fa-solid fa-arrow-right-arrow-left" style={{ color: 'var(--f-transfer)' }} />
          </div>
          <div>
            <p className="text-[16px] font-black" style={{ color: 'var(--f-text-1)' }}>Divisa diferente</p>
            <p className="text-[13px]" style={{ color: 'var(--f-text-4)' }}>
              Este gasto es en <strong style={{ color: 'var(--f-text-2)' }}>{crossCurrencyPending.expenseCurrency}</strong>, pero tu cuenta usa <strong style={{ color: 'var(--f-text-2)' }}>{userCurrency}</strong>
            </p>
          </div>
        </div>
        <p className="text-[26px] font-black tabular-nums mb-5 text-center" style={{ color: 'var(--f-transfer)' }}>
          {formatCurrency(crossCurrencyPending.amount, crossCurrencyPending.expenseCurrency)}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => doAccept('convert')}
            disabled={isPending || crossCurrencyLoading || crossCurrencyPending.convertedAmount === null}
            className="w-full py-4 rounded-[16px] text-[15px] font-black text-white flex items-center justify-between px-5 disabled:opacity-50 transition-all active:scale-95"
            style={{ background: 'var(--f-transfer)' }}
          >
            <span>Convertir a {userCurrency}</span>
            <span className="tabular-nums">
              {crossCurrencyLoading
                ? <i className="fa-solid fa-spinner fa-spin" />
                : crossCurrencyPending.convertedAmount != null
                  ? formatCurrency(crossCurrencyPending.convertedAmount, userCurrency)
                  : '—'
              }
            </span>
          </button>
          <button
            onClick={() => doAccept('original')}
            disabled={isPending}
            className="w-full py-4 rounded-[16px] text-[15px] font-black flex items-center justify-between px-5 disabled:opacity-50 transition-all active:scale-95"
            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-2)' }}
          >
            <span>Guardar en {crossCurrencyPending.expenseCurrency}</span>
            <span className="tabular-nums">{formatCurrency(crossCurrencyPending.amount, crossCurrencyPending.expenseCurrency)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      {bellButton}
      {panel}
      {crossCurrencyModal}
      {assignFriend && (
        <AssignFriendModal
          linkedUserId={assignFriend.userId}
          linkedUserName={assignFriend.name}
          onClose={() => setAssignFriend(null)}
        />
      )}
    </>
  )
}
