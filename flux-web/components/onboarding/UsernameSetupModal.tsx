'use client'

import { useState, useEffect, useTransition } from 'react'
import { setUsername, checkUsernameAvailable } from '@/actions/friends'
import { toast } from 'sonner'

interface Props {
  suggestedUsername: string
}

export default function UsernameSetupModal({ suggestedUsername }: Props) {
  const [value, setValue] = useState(suggestedUsername)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Debounced availability check
  useEffect(() => {
    if (!value || value === suggestedUsername) { setAvailable(null); return }
    const clean = value.toLowerCase().replace(/[^a-z0-9_.\-]/g, '')
    if (!/^[a-z0-9_.\-]{3,20}$/.test(clean)) { setAvailable(null); return }

    setChecking(true)
    const t = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean)
      setAvailable(res.available)
      setChecking(false)
    }, 400)
    return () => clearTimeout(t)
  }, [value, suggestedUsername])

  function handleInput(v: string) {
    setValue(v.toLowerCase().replace(/[^a-z0-9_.\-]/g, '').slice(0, 20))
  }

  function handleSave() {
    const clean = value.toLowerCase().trim()
    startTransition(async () => {
      const res = await setUsername(clean)
      if (res.error) { toast.error(res.error); return }
      toast.success('¡Listo! Tu @' + clean + ' quedó guardado')
      // The page will re-render via server revalidation, hiding this modal
    })
  }

  const isValid = /^[a-z0-9_.\-]{3,20}$/.test(value)
  const canSave = isValid && available !== false && !checking && !isPending

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg rounded-t-[28px] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-[22px] flex items-center justify-center"
            style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
            <i className="fa-solid fa-at text-2xl" style={{ color: 'var(--f-blue)' }} />
          </div>
        </div>

        <h2 className="text-[22px] font-black text-center mb-1" style={{ color: 'var(--f-text)' }}>
          Elige tu @username
        </h2>
        <p className="text-[14px] text-center mb-6 font-medium" style={{ color: 'var(--f-text-4)' }}>
          Así te encontrarán tus amigos en Flux. Solo letras, números y guion bajo.
        </p>

        {/* Input */}
        <div className="relative mb-3">
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-black select-none"
            style={{ color: 'var(--f-blue)' }}
          >@</span>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={e => handleInput(e.target.value)}
            placeholder="tunombre"
            className="w-full rounded-[14px] pl-9 pr-10 py-3.5 text-[16px] font-bold outline-none"
            style={{ background: 'var(--f-bg-input)', border: `1px solid ${available === false ? 'var(--f-expense)' : available === true ? 'var(--f-income)' : 'var(--f-line-strong)'}`, color: 'var(--f-text)' }}
          />
          {/* Status icon */}
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px]">
            {checking && <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--f-text-4)' }} />}
            {!checking && available === true && <i className="fa-solid fa-check" style={{ color: 'var(--f-income)' }} />}
            {!checking && available === false && <i className="fa-solid fa-xmark" style={{ color: 'var(--f-expense)' }} />}
          </span>
        </div>

        {/* Hint */}
        <p className="text-[12px] font-medium mb-6" style={{ color: available === false ? 'var(--f-expense)' : 'var(--f-text-4)' }}>
          {available === false
            ? 'Ese nombre ya está en uso, prueba otro'
            : available === true
            ? '¡Disponible!'
            : '3-20 caracteres · letras, números, _ . -'}
        </p>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-4 rounded-[16px] text-white text-[15px] font-black transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: 'var(--f-blue)' }}
        >
          {isPending
            ? <i className="fa-solid fa-spinner fa-spin" />
            : `Guardar @${value || 'username'}`}
        </button>
      </div>
    </div>
  )
}
