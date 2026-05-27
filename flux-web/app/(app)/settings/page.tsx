import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/settings/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: token },
    { data: categories },
    { data: accounts },
    { data: scheduled },
    { data: people },
  ] = await Promise.all([
    supabase.from('profiles').select('id,email,full_name,avatar_url,timezone,currency,default_monthly_budget,subscription_status,stripe_customer_id,stripe_subscription_id,trial_ends_at,subscription_ends_at,theme_preference,created_at,updated_at').eq('id', user.id).single(),
    supabase.from('shortcut_tokens').select('*').eq('user_id', user.id).single(),
    supabase.from('categories').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('sort_order'),
    supabase.from('accounts').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('scheduled_transactions').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('people').select('*').eq('user_id', user.id).order('created_at'),
  ])

  return (
    <SettingsClient
      profile={profile}
      shortcutToken={token?.token ?? ''}
      categories={categories ?? []}
      accounts={accounts ?? []}
      scheduled={scheduled ?? []}
      people={people ?? []}
    />
  )
}
