import { createClient } from '@/lib/supabase/server'
import NotificationBell from './NotificationBell'
import type { Notification } from '@/lib/types'

export default async function NotificationBellWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return <NotificationBell notifications={(data ?? []) as Notification[]} />
}
