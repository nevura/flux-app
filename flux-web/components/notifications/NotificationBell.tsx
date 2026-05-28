'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { markNotificationsRead, respondFriendRequest } from '@/actions/friends'
import type { Notification } from '@/lib/types'

interface Props {
  notifications: Notification[]
}

function notifLabel(n: Notification): { icon: string; iconColor: string; text: string } {
  const d = n.data as Record<string, string>
  switch (n.type) {
    case 'friend_request':
      return {
        icon: 'fa-solid fa-user-plus',
        iconColor: 'var(--f-blue)',
        text: `@${d.from_username || d.from_name} quiere ser tu amigo`,
      }
    case 'friend_accepted':
      return {
        icon: 'fa-solid fa-user-check',
        iconColor: 'var(--f-income)',
        text: `@${d.from_username || d.from_name} aceptó tu solicitud`,
      }
    case 'friend_declined':
      return {
        icon: 'fa-solid fa-user-xmark',
        iconColor: 'var(--f-expense)',
        text: `@${d.from_username || d.from_name} rechazó tu solicitud`,
      }
    case 'shared_expense_invite':
      return {
        icon: 'fa-solid fa-receipt',
        iconColor: 'var(--f-transfer)',
        text: `@${d.from_username} compartió un gasto contigo`,
      }
    case 'expense_settled':
      return {
        icon: 'fa-solid fa-circle-check',
        iconColor: 'var(--f-income)',
        text: `@${d.from_username} saldó una deuda`,
      }
    default:
      return { icon: 'fa-solid fa-bell', iconColor: 'var(--f-text-3)', text: 'Notificación' }
  }
}

export default function NotificationBell({ notifications }: Props) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<Notification[]>(notifications)
  const [isPending, startTransition] = useTransition()

  const unread = list.filter(n => !n.read).length

  function openPanel() {
    setOpen(true)
    // mark all as read optimistically
    if (unread > 0) {
      setList(prev => prev.map(n => ({ ...n, read: true })))
      startTransition(async () => { await markNotificationsRead() })
    }
  }

  function handleFriendResponse(friendshipId: string, accept: boolean) {
    startTransition(async () => {
      const res = await respondFriendRequest(friendshipId, accept)
      if (res.error) { toast.error(res.error); return }
      toast.success(accept ? 'Solicitud aceptada' : 'Solicitud rechazada')
      // remove the notification from the list
      setList(prev => prev.filter(n => {
        if (n.type !== 'friend_request') return true
        const d = n.data as Record<string, string>
        return d.friendship_id !== friendshipId
      }))
    })
  }

  return (
    <>
      {/* Bell button */}
      <button
        onClick={openPanel}
        className="relative w-9 h-9 flex items-center justify-center rounded-[11px] transition-all active:scale-90"
        style={{ background: unread > 0 ? 'var(--f-accent-bg)' : 'transparent' }}
      >
        <i className="fa-solid fa-bell text-[17px]" style={{ color: unread > 0 ? 'var(--f-blue)' : 'var(--f-text-3)' }} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white px-1"
            style={{ background: 'var(--f-expense)', lineHeight: 1 }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-3 rounded-[20px] overflow-hidden shadow-2xl w-[320px]"
            style={{
              top: 'calc(var(--safe-top) + 56px)',
              background: 'var(--f-bg-card)',
              border: '1px solid var(--f-line-strong)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.28)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--f-line)' }}>
              <p className="text-[15px] font-black" style={{ color: 'var(--f-text)' }}>Notificaciones</p>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--f-text-4)' }}>
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {list.length === 0 ? (
                <div className="py-10 text-center">
                  <i className="fa-solid fa-bell-slash text-2xl mb-3 block" style={{ color: 'var(--f-text-4)' }} />
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--f-text-4)' }}>Sin notificaciones</p>
                </div>
              ) : (
                list.map(n => {
                  const { icon, iconColor, text } = notifLabel(n)
                  const d = n.data as Record<string, string>
                  const isFriendRequest = n.type === 'friend_request'
                  return (
                    <div
                      key={n.id}
                      className="px-4 py-3 space-y-2"
                      style={{
                        background: n.read ? 'transparent' : 'var(--f-accent-bg)',
                        borderBottom: '1px solid var(--f-line)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'var(--f-bg-input)' }}>
                          <i className={`${icon} text-[13px]`} style={{ color: iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--f-text)' }}>{text}</p>
                          <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--f-text-4)' }}>
                            {formatDistanceToNow(new Date(n.created_at), { locale: es, addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Friend request actions */}
                      {isFriendRequest && d.friendship_id && (
                        <div className="flex gap-2 pl-11">
                          <button
                            onClick={() => handleFriendResponse(d.friendship_id, false)}
                            disabled={isPending}
                            className="flex-1 py-1.5 rounded-[8px] text-[12px] font-black transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleFriendResponse(d.friendship_id, true)}
                            disabled={isPending}
                            className="flex-1 py-1.5 rounded-[8px] text-[12px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--f-blue)' }}
                          >
                            Aceptar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
