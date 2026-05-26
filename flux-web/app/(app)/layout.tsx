import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/layout/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-[calc(5rem+var(--safe-bottom))]">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      <AppNav />
    </div>
  )
}
