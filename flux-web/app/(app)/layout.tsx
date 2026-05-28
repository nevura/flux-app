import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/layout/AppNav'
import PullToRefresh from '@/components/layout/PullToRefresh'
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner'
import ReadOnlyOverlay from '@/components/subscription/ReadOnlyOverlay'
import ThemeSync from '@/components/layout/ThemeSync'
import WakeOnFocus from '@/components/layout/WakeOnFocus'
import { getSubscriptionInfo } from '@/lib/subscription'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [sub, { data: profile }] = await Promise.all([
    getSubscriptionInfo(),
    supabase.from('profiles').select('theme_preference').eq('id', user.id).single(),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <ThemeSync theme={(profile?.theme_preference as 'dark' | 'light') ?? 'dark'} />
      <WakeOnFocus />
      <SubscriptionBanner status={sub.status} daysLeft={sub.daysLeft} />
      {sub.isReadOnly && <ReadOnlyOverlay />}
      <PullToRefresh>
        <main className="flex-1 pb-[calc(5rem+var(--safe-bottom))]">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </PullToRefresh>
      <AppNav />
    </div>
  )
}
