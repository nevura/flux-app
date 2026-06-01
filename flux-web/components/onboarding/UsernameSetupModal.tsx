'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { setUsername, checkUsernameAvailable } from '@/actions/friends'
import { toast } from 'sonner'

interface Props {
  suggestedUsername: string
  suggestedName: string
}

export default function UsernameSetupModal({ suggestedUsername, suggestedName }: Props) {
  const [username, setUsernameVal] = useState(suggestedUsername)
  const [displayName, setDisplayName] = useState(suggestedName)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Debounced availability check
  useEffect(() => {
    if (!username || username === suggestedUsername) { setAvailable(null); return }
    const clean = username.toLowerCase().replace(/[^a-z0-9_.\-]/g, '')
    if (!/^[a-z0-9_.\-]{3,20}$/.test(clean)) { setAvailable(null); return }

    setChecking(true)
    const t = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean)
      setAvailable(res.available)
      setChecking(false)
    }, 400)
    return () => clearTimeout(t)
  }, [username, suggestedUsername])

  function handleUsernameInput(v: string) {
    setUsernameVal(v.toLowerCase().replace(/[^a-z0-9_.\-]/g, '').slice(0, 20))
  }

  function handleSave() {
    const clean = username.toLowerCase().trim()
    startTransition(async () => {
      const res = await setUsername(clean, displayName)
      if (res.error) { toast.error(res.error); return }
      toast.success('¡Listo! Perfil configurado')
    })
  }

  const isValidUsername = /^[a-z0-9_.\-]{3,20}$/.test(username)
  const isValidName = displayName.trim().length >= 2
  const canSave = isValidUsername && isValidName && available !== false && !checking && !isPending

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="w-full max-w-lg rounded-t-[28px] p-6"
        style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-[22px] flex items-center justify-center"
            style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
            <i className="fa-solid fa-user-pen text-2xl" style={{ color: 'var(--f-blue)' }} />
          </div>
        </div>

        <h2 className="text-[22px] font-black text-center mb-1" style={{ color: 'var(--f-text)' }}>
          Configura tu perfil
        </h2>
        <p className="text-[15px] text-center mb-6 font-medium" style={{ color: 'var(--f-text-4)' }}>
          Así te verán tus amigos en Flux.
        </p>

        {/* Display name */}
        <p className="text-[13px] font-bold mb-1.5 ml-1" style={{ color: 'var(--f-text-3)' }}>Tu nombre</p>
        <input
          type="text"
          autoComplete="name"
          autoCorrect="off"
          value={displayName}
          onChange={e => setDisplayName(e.target.value.slice(0, 40))}
          placeholder="Ej: Bernardo"
          className="w-full rounded-[14px] px-4 py-3.5 text-[17px] font-semibold outline-none mb-4"
          style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)' }}
        />

        {/* Username */}
        <p className="text-[13px] font-bold mb-1.5 ml-1" style={{ color: 'var(--f-text-3)' }}>Tu @username</p>
        <div className="relative mb-2">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-black select-none"
            style={{ color: 'var(--f-blue)' }}
          >@</span>
          <input
            autoFocus
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={e => handleUsernameInput(e.target.value)}
            placeholder="tunombre"
            className="w-full rounded-[14px] pl-9 pr-10 py-3.5 text-[18px] font-bold outline-none"
            style={{
              background: 'var(--f-bg-input)',
              border: `1px solid ${available === false ? 'var(--f-expense)' : available === true ? 'var(--f-income)' : 'var(--f-line-strong)'}`,
              color: 'var(--f-text)',
            }}
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[16px]">
            {checking && <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--f-text-4)' }} />}
            {!checking && available === true && <i className="fa-solid fa-check" style={{ color: 'var(--f-income)' }} />}
            {!checking && available === false && <i className="fa-solid fa-xmark" style={{ color: 'var(--f-expense)' }} />}
          </span>
        </div>

        <p className="text-[13px] font-medium mb-6" style={{ color: available === false ? 'var(--f-expense)' : 'var(--f-text-4)' }}>
          {available === false
            ? 'Ese nombre ya está en uso, prueba otro'
            : available === true
            ? '¡Disponible!'
            : '3-20 caracteres · letras, números, _ . -'}
        </p>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-4 rounded-[16px] text-white text-[17px] font-black transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: 'var(--f-blue)' }}
        >
          {isPending
            ? <i className="fa-solid fa-spinner fa-spin" />
            : 'Listo, empezar →'}
        </button>
      </div>
    </div>,
    document.body
  )
}
