'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const TABS = [
  { href: '/home',         icon: 'fa-solid fa-wallet',       label: 'Inicio' },
  { href: '/transactions', icon: 'fa-solid fa-list-ul',      label: 'Movimientos' },
  { href: '/insights',     icon: 'fa-solid fa-chart-pie',    label: 'Estadísticas' },
  { href: '/shared',       icon: 'fa-solid fa-users',        label: 'Compartidos' },
  { href: '/settings',     icon: 'fa-solid fa-gear',         label: 'Ajustes' },
]

export default function AppNav() {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // Clear optimistic state once real navigation completes
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-auto max-w-lg">
        <div
          className="mx-3 mb-3 flex items-center justify-around rounded-[26px] px-1 py-2"
          style={{
            background: 'var(--f-bg-nav)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--f-line)',
            boxShadow: 'var(--f-shadow-nav)',
          }}
        >
          {TABS.map(tab => {
            const isCurrentPath = pathname === tab.href || (tab.href !== '/home' && pathname.startsWith(tab.href))
            const active = isCurrentPath || pendingHref === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => { if (!isCurrentPath) setPendingHref(tab.href) }}
                className="flex items-center gap-2 rounded-2xl transition-all duration-150 select-none active:scale-95 px-4 py-3"
                style={active ? { background: 'var(--f-bg-input)' } : undefined}
              >
                <i className={`${tab.icon} transition-all duration-150${active ? ' nav-icon-active' : ''}`} style={{
                  color: active ? 'var(--f-text)' : 'var(--f-text-3)',
                  fontSize: active ? '17px' : '19px',
                }} />
                {active && (
                  <span className="text-[13px] font-black tracking-tight whitespace-nowrap" style={{ color: 'var(--f-text)' }}>
                    {tab.label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
