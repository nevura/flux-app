'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import AppNav from './AppNav'
import DashboardTab from '@/components/tabs/DashboardTab'
import TransactionsTab from '@/components/tabs/TransactionsTab'
import SharedTab from '@/components/tabs/SharedTab'
import InsightsTab from '@/components/tabs/InsightsTab'

function pathToTab(pathname: string): string {
  if (pathname.startsWith('/transactions')) return 'transactions'
  if (pathname.startsWith('/shared'))       return 'shared'
  if (pathname.startsWith('/insights'))     return 'insights'
  return 'home'
}

interface Props {
  userId: string
  fullName: string | null
  email: string
  isReadOnly: boolean
  onRefresh?: () => void
}

export default function AppShell({ userId, fullName, email, isReadOnly }: Props) {
  const pathname = usePathname()
  const activeTab = pathToTab(pathname)

  // refreshSignal increments on pull-to-refresh
  const [refreshSignal, setRefreshSignal] = useState(0)

  // Pull-to-refresh via PullToRefresh component still works through router.refresh()
  // but we also handle it here for tab-specific refetches via a scroll listener approach
  useEffect(() => {
    const handler = () => setRefreshSignal(s => s + 1)
    window.addEventListener('flux:refresh', handler)
    return () => window.removeEventListener('flux:refresh', handler)
  }, [])

  const tabProps = { userId, active: false, refreshSignal }

  return (
    <>
      <main className="flex-1 pb-[calc(5rem+var(--safe-bottom))]">
        {/* All tabs mounted — only the active one is visible via display */}
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

      <AppNav isReadOnly={isReadOnly} />
    </>
  )
}
