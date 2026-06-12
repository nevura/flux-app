'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getTransactionModalData } from '@/actions/transactions'
import TransactionModal from '@/components/transactions/TransactionModal'
import type { AccountWithBalance, Category, Person } from '@/lib/types'

interface NavProps { isReadOnly?: boolean }

const TABS = [
  { href: '/home',         icon: 'fa-solid fa-wallet',    label: 'Inicio' },
  { href: '/transactions', icon: 'fa-solid fa-list-ul',   label: 'Movimientos' },
  { href: '/insights',     icon: 'fa-solid fa-chart-pie', label: 'Estadísticas' },
  { href: '/shared',       icon: 'fa-solid fa-users',     label: 'Compartidos' },
]

interface ModalData { accounts: AccountWithBalance[]; categories: Category[]; people: Person[] }

const TAB_PATHS = ['/home', '/transactions', '/insights', '/shared']

export default function AppNav({ isReadOnly }: NavProps) {
  const pathname = usePathname()
  const isTabRoute = TAB_PATHS.some(p => pathname === p || (p !== '/home' && pathname.startsWith(p)))
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [fabOpen, setFabOpen] = useState(false)
  const [fabData, setFabData] = useState<ModalData | null>(null)
  const [fabLoading, setFabLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setPendingHref(null) }, [pathname])
  useEffect(() => {
    const handler = () => setFabData(null)
    window.addEventListener('flux:refresh', handler)
    return () => window.removeEventListener('flux:refresh', handler)
  }, [])

  async function handleFabClick() {
    if (!fabData) {
      setFabLoading(true)
      const result = await getTransactionModalData()
      setFabData(result)
      setFabLoading(false)
    }
    setFabOpen(true)
  }

  // Split tabs: 2 left, 2 right (FAB goes in center)
  const leftTabs = TABS.slice(0, 2)
  const rightTabs = TABS.slice(2)

  function TabItem({ tab }: { tab: typeof TABS[0] }) {
    const isCurrentPath = pathname === tab.href || (tab.href !== '/home' && pathname.startsWith(tab.href))
    const active = isCurrentPath || pendingHref === tab.href
    return (
      <Link
        href={tab.href}
        onClick={() => { if (!isCurrentPath) setPendingHref(tab.href) }}
        className="flex flex-1 items-center justify-center rounded-[18px] transition-all duration-150 select-none active:scale-90 py-4"
        style={active ? { background: 'var(--f-bg-input)' } : undefined}
      >
        <i
          className={`${tab.icon} transition-all duration-150`}
          style={{ color: active ? 'var(--f-text)' : 'var(--f-text-3)', fontSize: '20px' }}
        />
      </Link>
    )
  }

  if (!isTabRoute) return null

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="mx-auto max-w-lg">
          <div
            data-coach="app-nav"
            className="mx-3 mb-3 flex items-center rounded-[26px] px-1.5 py-1.5"
            style={{
              background: 'var(--f-bg-nav)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--f-line)',
              boxShadow: 'var(--f-shadow-nav)',
            }}
          >
            {leftTabs.map(tab => <TabItem key={tab.href} tab={tab} />)}

            {/* Center FAB */}
            <div className="flex flex-1 items-center justify-center">
              {!isReadOnly && (
                <button
                  onClick={handleFabClick}
                  data-coach="global-fab"
                  className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'var(--f-blue)', boxShadow: 'var(--f-shadow-accent)' }}
                >
                  {fabLoading
                    ? <i className="fa-solid fa-spinner fa-spin text-white" style={{ fontSize: 18 }} />
                    : <i className="fa-solid fa-plus text-white" style={{ fontSize: 18 }} />}
                </button>
              )}
            </div>

            {rightTabs.map(tab => <TabItem key={tab.href} tab={tab} />)}
          </div>
        </div>
      </nav>

      {mounted && fabOpen && fabData && createPortal(
        <TransactionModal
          transaction={null}
          accounts={fabData.accounts}
          categories={fabData.categories}
          people={fabData.people}
          onClose={() => setFabOpen(false)}
        />,
        document.body
      )}
    </>
  )
}
