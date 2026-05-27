import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { signAdminAction } from '@/lib/admin'
import { sendApprovalRequestEmail } from '@/lib/email'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=oauth&msg=${encodeURIComponent(error.message)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('status, email, created_at')
    .eq('id', user.id)
    .single() as { data: { status: string; email: string | null; created_at: string } | null }

  if (profile?.status === 'pending') {
    const ageMs = Date.now() - new Date(profile.created_at ?? 0).getTime()
    if (ageMs < 10 * 60 * 1000) {
      const adminEmail = process.env.ADMIN_EMAIL!
      const approveUrl = `${origin}/api/admin/approve?uid=${user.id}&sig=${signAdminAction(user.id, 'approve')}`
      const rejectUrl  = `${origin}/api/admin/reject?uid=${user.id}&sig=${signAdminAction(user.id, 'reject')}`
      await sendApprovalRequestEmail({
        adminEmail,
        applicantEmail: profile.email ?? user.email ?? '',
        approveUrl,
        rejectUrl,
      }).catch(() => {})
    }
    return NextResponse.redirect(`${origin}/pending`)
  }

  if (profile?.status === 'rejected') {
    return NextResponse.redirect(`${origin}/rejected`)
  }

  return NextResponse.redirect(`${origin}/home`)
}
