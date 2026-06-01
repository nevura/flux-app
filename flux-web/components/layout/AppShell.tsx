'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import AppNav from './AppNav'
import PullToRefresh from './PullToRefresh'
import DashboardTab from '@/components/tabs/DashboardTab'
import TransactionsTab from '@/components/tabs/TransactionsTab'
import SharedTab from '@/components/tabs/SharedTab'
import InsightsTab from '@/components/tabs/InsightsTab'

type TabKey = 'home' | 'transactions' | 'shared' | 'insights'

function pathToTab(pathname: string): TabKey | null {
  if (pathname.startsWith('/transactions')) return 'transactions'
  if (pathname.startsWith('/shared'))       return 'shared'
  if (pathname.startsWith('/insights'))     return 'insights'
  if (pathname.startsWith('/home'))         return 'home'
  return null  // settings, coach-mark pages, etc. — render children normally
}

interface Props {
  userId: string
  fullName: string | null
  email: string
  isReadOnly: boolean
  children: React.ReactNode
}

export default function AppShell({ userId, fullName, email, isReadOnly, children }: Props) {
  const pathname = usePathname()
  const activeTab = pathToTab(pathname)

  const [refreshSignal, setRefreshSignal] = useState(0)

  useEffect(() => {
    const handler = () => setRefreshSignal(s => s + 1)
    window.addEventListener('flux:refresh', handler)
    return () => window.removeEventListener('flux:refresh', handler)
  }, [])

  const tabProps = { userId, active: false as boolean, refreshSignal }

  // ── Non-tab routes (settings, etc.) ─────────────────────────────────────────
  if (activeTab === null) {
    return (
      <>
        <main className="flex-1 pb-[calc(5rem+var(--safe-bottom))]">
          <div className="animate-fade-in">{children}</div>
        </main>
        <AppNav isReadOnly={isReadOnly} />
      </>
    )
  }

  // ── Tab routes ────────────────────────────────────────────────────────────────
  return (
    <>
      <PullToRefresh>
        <main className="flex-1 pb-[calc(5rem+var(--safe-bottom))]">
          {/* All tabs mounted simultaneously — only active one is visible */}
          <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
            <DashboardTab
              userId={userId}
              fullName={fullName}
              email={email}
              active={activeTab === 'home'}
              refreshSignal={refreshSignal}
            />
          </div>

          <div style={{ display: activeTab === 'transactions' ? 'block' : 'none' }}>
            <Suspense>
              <TransactionsTab {...tabProps} active={activeTab === 'transactions'} />
            </Suspense>
          </div>

          <div style={{ display: activeTab === 'shared' ? 'block' : 'none' }}>
            <SharedTab {...tabProps} active={activeTab === 'shared'} />
          </div>

          <div style={{ display: activeTab === 'insights' ? 'block' : 'none' }}>
            <Suspense>
              <InsightsTab {...tabProps} active={activeTab === 'insights'} />
            </Suspense>
          </div>
        </main>
      </PullToRefresh>

      <AppNav isReadOnly={isReadOnly} />
    </>
  )
}
