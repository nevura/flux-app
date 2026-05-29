'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { searchUsers, sendFriendRequest, sendAppInvite } from '@/actions/friends'
import { useBottomSheetSwipe } from '@/lib/hooks/useBottomSheetSwipe'
import type { PublicProfile, Friendship } from '@/lib/types'

interface Props {
  onClose: () => void
  existingFriendships: Friendship[]
  myUserId: string
}

export default function FriendSearchModal({ onClose, existingFriendships, myUserId }: Props) {
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setMounted(true)
    // Delayed focus prevents iOS Keychain autofill popup
    const t = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { handleProps: swipeHandleProps, sheetStyle } = useBottomSheetSwipe(onClose)

  function handleInput(v: string) {
    setQuery(v)
    setNotFound(false)
    setResults([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const clean = v.replace(/^@/, '').trim()
    if (clean.length < 2) { setSearching(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const res = await searchUsers(clean)
      setResults(res.results)
      setNotFound(res.results.length === 0 && clean.length >= 2)
      setSearching(false)
    }, 400)
  }

  function friendshipStatus(userId: string): 'accepted' | 'pending' | 'declined' | null {
    const f = existingFriendships.find(f =>
      f.requester_id === userId || f.addressee_id === userId
    )
    return f?.status ?? null
  }

  function handleSendRequest(userId: string, username: string) {
    startTransition(async () => {
      const res = await sendFriendRequest(userId)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Solicitud enviada a @${username}`)
      // optimistic: update results to show pending
      setResults(prev => prev.map(p => p.id === userId ? { ...p, _sent: true } as PublicProfile & { _sent: boolean } : p))
    })
  }

  function handleSendInvite() {
    if (!inviteEmail.includes('@')) { toast.error('Email inválido'); return }
    startTransition(async () => {
      const res = await sendAppInvite(inviteEmail)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Invitación enviada a ${inviteEmail}`)
      setShowInvite(false)
      setInviteEmail('')
    })
  }

  if (!mounted) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[28px] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)', ...sheetStyle }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" {...swipeHandleProps}>
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-[20px] font-black" style={{ color: 'var(--f-text)' }}>Agregar amigo</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[17px] font-black select-none" style={{ color: 'var(--f-blue)' }}>@</span>
            <input
              ref={inputRef}
              type="text"
              name="user_search_query"
              autoComplete="one-time-code"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder="Buscar por @username"
              className="w-full rounded-[14px] pl-8 pr-10 py-3 text-[17px] font-semibold outline-none"
              style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)' }}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {searching
                ? <i className="fa-solid fa-spinner fa-spin text-sm" style={{ color: 'var(--f-text-4)' }} />
                : <i className="fa-solid fa-magnifying-glass text-sm" style={{ color: 'var(--f-text-4)' }} />}
            </span>
          </div>
        </div>

        {/* Results */}
        <div className="px-5 space-y-2 min-h-[80px]">
          {results.map(user => {
            const status = friendshipStatus(user.id)
            const sent = (user as PublicProfile & { _sent?: boolean })._sent
            return (
              <div key={user.id} className="flex items-center gap-3 py-2.5 px-3 rounded-[14px]"
                style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-line)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                  style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}>
                  {(user.full_name || user.username)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{user.full_name || user.username}</p>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--f-blue)' }}>@{user.username}</p>
                </div>
                {status === 'accepted' ? (
                  <span className="text-[13px] font-black px-2 py-1 rounded-lg" style={{ background: 'var(--f-income-bg)', color: 'var(--f-income)' }}>Amigos</span>
                ) : status === 'pending' || sent ? (
                  <span className="text-[13px] font-black px-2 py-1 rounded-lg" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-4)' }}>Pendiente</span>
                ) : (
                  <button
                    onClick={() => handleSendRequest(user.id, user.username)}
                    disabled={isPending}
                    className="text-[14px] font-black px-3 py-1.5 rounded-[10px] text-white disabled:opacity-50 transition-all active:scale-95"
                    style={{ background: 'var(--f-blue)' }}
                  >
                    Agregar
                  </button>
                )}
              </div>
            )
          })}

          {/* Not found state */}
          {notFound && !showInvite && (
            <div className="text-center py-4 space-y-3">
              <p className="text-[15px] font-semibold" style={{ color: 'var(--f-text-4)' }}>
                No se encontró <span style={{ color: 'var(--f-text)' }}>@{query.replace(/^@/, '')}</span> en Flux
              </p>
              <button
                onClick={() => setShowInvite(true)}
                className="text-[15px] font-black px-4 py-2 rounded-[10px] text-white transition-all active:scale-95"
                style={{ background: 'var(--f-blue)' }}
              >
                <i className="fa-solid fa-envelope mr-1.5" />
                Invitar por email
              </button>
            </div>
          )}

          {/* Invite form */}
          {showInvite && (
            <div className="rounded-[14px] p-4 space-y-3 animate-fade-up" style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-line-strong)' }}>
              <p className="text-[15px] font-black" style={{ color: 'var(--f-text)' }}>Invitar a Flux</p>
              <input
                autoFocus
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendInvite() }}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-[10px] px-3 py-2.5 text-[16px] font-semibold outline-none"
                style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-accent-border)', color: 'var(--f-text)' }}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowInvite(false)} className="flex-1 py-2 rounded-[10px] text-[15px] font-black" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={isPending || !inviteEmail}
                  className="flex-[2] py-2 rounded-[10px] text-[15px] font-black text-white disabled:opacity-50 active:scale-95"
                  style={{ background: 'var(--f-blue)' }}
                >
                  {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Enviar invitación'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>,
    document.body
  )
}
