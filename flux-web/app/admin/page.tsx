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

  let profiles
  try {
    profiles = await getAdminProfiles()
  } catch (err) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui', background: '#fff', minHeight: '100vh' }}>
        <h2 style={{ color: '#FF3B30', marginBottom: 12 }}>Error al cargar admin</h2>
        <pre style={{ fontSize: 13, background: '#f5f5f7', padding: 16, borderRadius: 10, whiteSpace: 'pre-wrap' }}>
          {err instanceof Error ? err.stack ?? err.message : String(err)}
        </pre>
      </div>
    )
  }

  return <AdminClient profiles={profiles} />
}
