import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/layout/AppNav'
import GlobalFAB from '@/components/layout/GlobalFAB'
import PullToRefresh from '@/components/layout/PullToRefresh'
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner'
import ReadOnlyOverlay from '@/components/subscription/ReadOnlyOverlay'
import ThemeSync from '@/components/layout/ThemeSync'
import WakeOnFocus from '@/components/layout/WakeOnFocus'
import UsernameSetupModal from '@/components/onboarding/UsernameSetupModal'
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper'
import { getSubscriptionInfo } from '@/lib/subscription'

function suggestUsername(fullName: string | null, email: string | null): string {
  const base = fullName
    ? fullName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : (email ?? '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
  return base.slice(0, 20) || 'usuario'
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [sub, { data: profile }] = await Promise.all([
    getSubscriptionInfo(),
    supabase.from('profiles').select('theme_preference, username, full_name, email, onboarding_completed').eq('id', user.id).single(),
  ])

  const needsUsername = !profile?.username
  const needsOnboarding = !needsUsername && !profile?.onboarding_completed

  return (
    <div className="flex flex-col min-h-screen">
      <ThemeSync theme={(profile?.theme_preference as 'dark' | 'light') ?? 'dark'} />
      <WakeOnFocus />
      <SubscriptionBanner status={sub.status} daysLeft={sub.daysLeft} />
      {sub.isReadOnly && <ReadOnlyOverlay />}
      {needsUsername && (
        <UsernameSetupModal
          suggestedUsername={suggestUsername(profile?.full_name ?? null, profile?.email ?? null)}
        />
      )}
      {needsOnboarding && <OnboardingWrapper />}
      <PullToRefresh>
        <main className="flex-1 pb-[calc(5rem+var(--safe-bottom))]">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </PullToRefresh>
      <AppNav />
      {!sub.isReadOnly && <GlobalFAB />}
    </div>
  )
}
