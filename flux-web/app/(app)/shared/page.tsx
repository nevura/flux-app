import { createClient } from '@/lib/supabase/server'
import SharedClient from '@/components/shared/SharedClient'

export const dynamic = 'force-dynamic'

export default async function SharedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: transactions }, { data: people }, { data: accounts }, { data: categories }, { data: friendships }] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id).not('split_data', 'is', null),
    supabase.from('people').select('*').eq('user_id', user.id),
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true).order('sort_order'),
    supabase.from('categories').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('sort_order'),
    supabase.from('friendships').select('*').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
  ])

  return (
    <SharedClient
      transactions={transactions ?? []}
      people={people ?? []}
      accounts={accounts ?? []}
      categories={categories ?? []}
      friendships={friendships ?? []}
      myUserId={user.id}
    />
  )
}
