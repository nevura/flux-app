import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminProfiles } from '@/actions/admin'
import AdminClient from '@/components/admin/AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'bernardo.perezro06@gmail.com') {
    redirect('/home')
  }

  const profiles = await getAdminProfiles()
  return <AdminClient profiles={profiles} />
}
