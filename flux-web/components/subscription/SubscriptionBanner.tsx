'use client'

import { useState } from 'react'

interface Props {
  status: string
  daysLeft: number | null
}

export default function SubscriptionBanner({ status, daysLeft }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  if (status === 'active') return null

  if (status === 'trialing') {
    if (daysLeft === null || daysLeft > 5) return null
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium"
        style={{ background: 'rgba(255,149,0,0.12)', borderBottom: '1px solid rgba(255,149,0,0.2)', color: '#FF9500' }}>
        <span>
          <i className="fa-solid fa-clock mr-2" />
          {daysLeft === 0
            ? 'Tu período de prueba termina hoy'
            : `Tu período de prueba termina en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <a href="/settings?tab=subscription" className="underline underline-offset-2 hover:opacity-80">Suscribirse</a>
          <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>
    )
  }

  if (status === 'grace') {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium"
        style={{ background: 'var(--f-expense-bg)', borderBottom: '1px solid var(--f-expense-border)', color: 'var(--f-expense)' }}>
        <span>
          <i className="fa-solid fa-triangle-exclamation mr-2" />
          {daysLeft !== null && daysLeft > 0
            ? `Período de gracia: ${daysLeft} día${daysLeft !== 1 ? 's' : ''} para suscribirte`
            : 'Tu acceso expira pronto — suscríbete para continuar'}
        </span>
        <a href="/settings?tab=subscription"
          className="shrink-0 px-3 py-1 rounded-lg text-white text-xs font-semibold"
          style={{ background: 'var(--f-expense)' }}>
          Suscribirse
        </a>
      </div>
    )
  }

  return null
}
