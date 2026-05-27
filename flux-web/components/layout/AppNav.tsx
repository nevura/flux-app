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
            background: 'rgba(28,28,30,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
                style={active ? { background: 'rgba(255,255,255,0.12)' } : undefined}
              >
                <i className={`${tab.icon} transition-all duration-150 ${
                  active ? 'text-white text-[17px]' : 'text-[rgba(255,255,255,0.4)] text-[19px]'
                }`} />
                {active && (
                  <span className="text-[13px] font-black text-white tracking-tight whitespace-nowrap">
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
