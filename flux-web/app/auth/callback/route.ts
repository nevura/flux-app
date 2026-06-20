import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApprovalGrantedEmail, sendNewUserRegistrationEmail } from '@/lib/email'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

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

  // Password-recovery sessions skip the new-user/approval logic below entirely
  // — that logic doesn't apply (and could misfire) for an existing user
  // resetting their password.
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('status, email, created_at')
    .eq('id', user.id)
    .single() as { data: { status: string; email: string | null; created_at: string } | null }

  // Notify admin whenever a brand-new user registers (first login within 5 min of profile creation)
  const profileAgeMs = Date.now() - new Date(profile?.created_at ?? 0).getTime()
  const isNewUser = profile && profileAgeMs < 5 * 60 * 1000
  if (isNewUser) {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'bernardo.perezro06@gmail.com'
    const provider = user.app_metadata?.provider ?? 'email'
    try {
      await sendNewUserRegistrationEmail({
        adminEmail,
        userEmail: profile.email ?? user.email ?? '',
        userName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
        provider,
      })
    } catch {}
  }

  if (profile?.status === 'pending') {
    // Auto-approve on email confirmation — 20-day trial starts immediately
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 20)
    await (admin.from('profiles') as any).update({
      status: 'approved',
      subscription_status: 'trialing',
      trial_ends_at: trialEnd.toISOString(),
    }).eq('id', user.id)

    try {
      await sendApprovalGrantedEmail({
        to: profile.email ?? user.email ?? '',
        loginUrl: `${origin}/home`,
      })
    } catch {}

    return NextResponse.redirect(`${origin}/home`)
  }

  if (profile?.status === 'rejected') {
    return NextResponse.redirect(`${origin}/rejected`)
  }

  return NextResponse.redirect(`${origin}/home`)
}
