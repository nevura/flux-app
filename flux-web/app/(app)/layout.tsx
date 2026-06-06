import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubscriptionBanner from '@/components/subscription/SubscriptionBanner'
import ReadOnlyOverlay from '@/components/subscription/ReadOnlyOverlay'
import WelcomeBanner from '@/components/subscription/WelcomeBanner'
import ThemeSync from '@/components/layout/ThemeSync'
import WakeOnFocus from '@/components/layout/WakeOnFocus'
import UsernameSetupModal from '@/components/onboarding/UsernameSetupModal'
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper'
import CoachMarkSeeder from '@/components/onboarding/CoachMarkSeeder'
import AppShell from '@/components/layout/AppShell'
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
    supabase.from('profiles').select('theme_preference, username, full_name, email, onboarding_completed, coach_marks_seen').eq('id', user.id).single(),
  ])

  const needsSetup = !profile?.username || !profile?.full_name
  const needsOnboarding = !needsSetup && !profile?.onboarding_completed

  return (
    <div className="flex flex-col min-h-screen">
      <ThemeSync theme={(profile?.theme_preference as 'dark' | 'light') ?? 'dark'} />
      <WakeOnFocus />
      <SubscriptionBanner status={sub.status} daysLeft={sub.daysLeft} />
      {sub.status === 'trialing' && <WelcomeBanner daysLeft={sub.daysLeft} />}
      {sub.isReadOnly && <ReadOnlyOverlay />}
      {needsSetup && (
        <UsernameSetupModal
          suggestedUsername={suggestUsername(profile?.full_name ?? null, profile?.email ?? null)}
          suggestedName={profile?.full_name ?? ''}
        />
      )}
      {needsOnboarding && <OnboardingWrapper />}
      <CoachMarkSeeder seen={(profile as any)?.coach_marks_seen ?? []} />

      {/* AppShell persists across tab navigations — all tabs stay mounted */}
      <AppShell
        userId={user.id}
        fullName={profile?.full_name ?? null}
        email={user.email ?? ''}
        isReadOnly={sub.isReadOnly}
      >
        {children}
      </AppShell>
    </div>
  )
}
