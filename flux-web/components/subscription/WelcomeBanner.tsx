'use client'

import { useState, useEffect } from 'react'

const LS_KEY = 'flux_welcome_v1'

export default function WelcomeBanner({ daysLeft }: { daysLeft: number | null }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (daysLeft !== null && daysLeft > 5 && !localStorage.getItem(LS_KEY)) {
      setShow(true)
    }
  }, [daysLeft])

  function dismiss() {
    localStorage.setItem(LS_KEY, '1')
    setShow(false)
  }

  if (!show || daysLeft === null) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
    >
      <div
        className="w-full max-w-sm rounded-[28px] p-7 flex flex-col gap-5 animate-fade-up"
        style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-line-strong)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto"
          style={{ background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.25)' }}>
          <i className="fa-solid fa-bolt text-2xl" style={{ color: 'var(--f-blue)' }} />
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <p className="text-[20px] font-black" style={{ color: 'var(--f-text)' }}>¡Bienvenido a FluxApp Finance!</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--f-blue)' }}>
            Tienes {daysLeft} días de prueba gratis
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--f-text-3)' }}>
            Explora todo sin límites. Cuando termine tu prueba, seguirás viendo tu historial completo — solo no podrás agregar nuevos movimientos manuales, por Atajos ni recurrentes.
          </p>
        </div>

        {/* Hint */}
        <div className="rounded-[12px] px-4 py-2.5 flex items-center gap-2"
          style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
          <i className="fa-solid fa-gear text-sm flex-shrink-0" style={{ color: 'var(--f-text-4)' }} />
          <p className="text-[12px]" style={{ color: 'var(--f-text-4)' }}>
            Para suscribirte cuando quieras: <strong style={{ color: 'var(--f-text-3)' }}>Configuración → Suscripción</strong>
          </p>
        </div>

        <button
          onClick={dismiss}
          className="w-full py-3.5 rounded-[14px] text-white font-black text-[16px] transition-all active:scale-[0.98]"
          style={{ background: 'var(--f-blue)', boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}
        >
          ¡Empecemos!
        </button>
      </div>
    </div>
  )
}
