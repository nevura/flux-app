'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { searchUsers, linkPersonToUser } from '@/actions/friends'
import type { PublicProfile } from '@/lib/types'

interface Props {
  personId: string
  personName: string
  onClose: () => void
}

export default function LinkPersonModal({ personId, personName, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      setNotFound(res.results.length === 0)
      setSearching(false)
    }, 400)
  }

  function handleLink(user: PublicProfile) {
    startTransition(async () => {
      const res = await linkPersonToUser(personId, user.id)
      if (res.error) { toast.error(res.error); return }
      toast.success(`${personName} vinculado con @${user.username}`)
      onClose()
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
        style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <h2 className="text-[18px] font-black" style={{ color: 'var(--f-text)' }}>Vincular contacto</h2>
            <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--f-text-4)' }}>
              Busca el usuario de Flux para <span style={{ color: 'var(--f-text)' }}>{personName}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-black select-none" style={{ color: 'var(--f-blue)' }}>@</span>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder="Buscar por @username"
              className="w-full rounded-[14px] pl-8 pr-10 py-3 text-[15px] font-semibold outline-none"
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
          {results.map(user => (
            <div key={user.id} className="flex items-center gap-3 py-2.5 px-3 rounded-[14px]"
              style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-line)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}>
                {(user.full_name || user.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{user.full_name || user.username}</p>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--f-blue)' }}>@{user.username}</p>
              </div>
              <button
                onClick={() => handleLink(user)}
                disabled={isPending}
                className="text-[12px] font-black px-3 py-1.5 rounded-[10px] text-white disabled:opacity-50 transition-all active:scale-95"
                style={{ background: 'var(--f-blue)' }}
              >
                {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Vincular'}
              </button>
            </div>
          ))}

          {notFound && (
            <p className="text-[13px] font-semibold text-center py-4" style={{ color: 'var(--f-text-4)' }}>
              No se encontró <span style={{ color: 'var(--f-text)' }}>@{query.replace(/^@/, '')}</span> en Flux
            </p>
          )}
        </div>
        <div className="h-4" />
      </div>
    </div>,
    document.body
  )
}
