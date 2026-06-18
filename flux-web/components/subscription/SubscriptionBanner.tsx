'use client'

import { useState } from 'react'
import { getStatusBanner, type SubscriptionStatus } from '@/lib/subscriptionStatus'

interface Props {
  status: SubscriptionStatus
  daysLeft: number | null
}

export default function SubscriptionBanner({ status, daysLeft }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const banner = getStatusBanner(status, daysLeft)
  if (!banner) return null

  const isAmber = banner.color === 'amber'
  const bg = isAmber ? 'rgba(255,149,0,0.12)' : 'var(--f-expense-bg)'
  const border = isAmber ? '1px solid rgba(255,149,0,0.2)' : '1px solid var(--f-expense-border)'
  const color = isAmber ? '#FF9500' : 'var(--f-expense)'
  const icon = isAmber ? 'fa-clock' : 'fa-triangle-exclamation'

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium"
      style={{ background: bg, borderBottom: border, color }}>
      <span>
        <i className={`fa-solid ${icon} mr-2`} />
        {banner.title}
      </span>
      <div className="flex items-center gap-3 shrink-0">
        <a href="/settings?tab=subscription"
          className={isAmber ? 'underline underline-offset-2 hover:opacity-80' : 'px-3 py-1 rounded-lg text-white text-xs font-semibold'}
          style={isAmber ? undefined : { background: 'var(--f-expense)' }}>
          Suscribirse
        </a>
        {isAmber && (
          <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100">
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>
    </div>
  )
}
