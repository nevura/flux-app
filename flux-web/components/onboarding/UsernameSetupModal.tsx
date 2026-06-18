'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { createPortal } from 'react-dom'
import { setUsername, checkUsernameAvailable } from '@/actions/friends'
import { updateBaseCurrency } from '@/actions/config'
import { getAlphabeticalCurrencies } from '@/lib/constants'
import { toast } from 'sonner'

interface Props {
  suggestedUsername: string
  suggestedName: string
}

const CURRENCIES = getAlphabeticalCurrencies()

export default function UsernameSetupModal({ suggestedUsername, suggestedName }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [username, setUsernameVal] = useState(suggestedUsername)
  const [displayName, setDisplayName] = useState(suggestedName)
  const [currency, setCurrency] = useState('MXN')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

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

  // Scroll selected currency into view when step 2 opens
  useEffect(() => {
    if (step === 2 && listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
      if (selected) selected.scrollIntoView({ block: 'center' })
    }
  }, [step])

  function handleUsernameInput(v: string) {
    setUsernameVal(v.toLowerCase().replace(/[^a-z0-9_.\-]/g, '').slice(0, 20))
  }

  function handleStep1() {
    // Advance to step 2 — no server call yet
    setStep(2)
  }

  function handleFinish() {
    const clean = username.toLowerCase().trim()
    startTransition(async () => {
      const [res1, res2] = await Promise.all([
        setUsername(clean, displayName),
        updateBaseCurrency(currency),
      ])
      if (res1.error) { toast.error(res1.error); return }
      if (res2.error) { toast.error(res2.error); return }
      toast.success('¡Listo! Perfil configurado')
    })
  }

  const isValidUsername = /^[a-z0-9_.\-]{3,20}$/.test(username)
  const isValidName = displayName.trim().length >= 2
  const canAdvance = isValidUsername && isValidName && available !== false && !checking && !isPending

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
        {step === 1 ? (
          <>
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
              onClick={handleStep1}
              disabled={!canAdvance}
              className="w-full py-4 rounded-[16px] text-white text-[17px] font-black transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'var(--f-blue)' }}
            >
              Siguiente →
            </button>
          </>
        ) : (
          <>
            {/* Back link */}
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-[14px] font-semibold mb-4"
              style={{ color: 'var(--f-text-4)' }}
            >
              <i className="fa-solid fa-chevron-left text-[12px]" />
              Atrás
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-[22px] flex items-center justify-center"
                style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
                <i className="fa-solid fa-coins text-2xl" style={{ color: 'var(--f-blue)' }} />
              </div>
            </div>

            <h2 className="text-[22px] font-black text-center mb-1" style={{ color: 'var(--f-text)' }}>
              Tu moneda principal
            </h2>
            <p className="text-[15px] text-center mb-4 font-medium" style={{ color: 'var(--f-text-4)' }}>
              Podrás cambiarla después en Configuración.
            </p>

            {/* Currency list */}
            <div
              ref={listRef}
              className="rounded-[16px] overflow-y-auto mb-5"
              style={{
                maxHeight: '40vh',
                background: 'var(--f-bg-input)',
                border: '1px solid var(--f-line-strong)',
              }}
            >
              {CURRENCIES.map((c, i) => {
                const isSelected = c.code === currency
                return (
                  <button
                    key={c.code}
                    data-selected={isSelected}
                    onClick={() => setCurrency(c.code)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:opacity-70"
                    style={{
                      color: isSelected ? 'var(--f-blue)' : 'var(--f-text)',
                      borderTop: i > 0 ? '1px solid var(--f-line)' : 'none',
                      background: isSelected ? 'var(--f-accent-bg)' : 'transparent',
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[15px] font-black w-8 text-center" style={{ color: isSelected ? 'var(--f-blue)' : 'var(--f-text-3)' }}>
                        {c.symbol}
                      </span>
                      <span>
                        <span className="text-[15px] font-bold">{c.code}</span>
                        <span className="text-[13px] font-medium ml-2" style={{ color: isSelected ? 'var(--f-blue)' : 'var(--f-text-4)' }}>
                          {c.name}
                        </span>
                      </span>
                    </span>
                    {isSelected && <i className="fa-solid fa-check text-[14px]" style={{ color: 'var(--f-blue)' }} />}
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleFinish}
              disabled={isPending}
              className="w-full py-4 rounded-[16px] text-white text-[17px] font-black transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'var(--f-blue)' }}
            >
              {isPending
                ? <i className="fa-solid fa-spinner fa-spin" />
                : 'Listo, empezar →'}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
