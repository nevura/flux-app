import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute     = path.startsWith('/login') || path.startsWith('/signup')
  const isAuthCallback  = path.startsWith('/auth/')
  const isApiRoute      = path.startsWith('/api/')
  const isStatusRoute   = path.startsWith('/pending') || path.startsWith('/rejected')
  const isMarketingRoute = path === '/' || path.startsWith('/terminos') || path.startsWith('/privacidad') || path.startsWith('/guia')

  if (!user && !isAuthRoute && !isAuthCallback && !isApiRoute && !isMarketingRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute && !isAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  // Check approval + subscription status for authenticated users
  if (user && !isAuthRoute && !isAuthCallback && !isApiRoute && !isStatusRoute && !isMarketingRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'pending') {
      const url = request.nextUrl.clone()
      url.pathname = '/pending'
      return NextResponse.redirect(url)
    }
    if (profile?.status === 'rejected') {
      const url = request.nextUrl.clone()
      url.pathname = '/rejected'
      return NextResponse.redirect(url)
    }

    // Pass subscription info as headers so pages can read it without extra DB calls
    supabaseResponse.headers.set('x-subscription-status', profile?.subscription_status ?? 'trialing')
    if (profile?.trial_ends_at) supabaseResponse.headers.set('x-trial-ends-at', profile.trial_ends_at)
    if (profile?.subscription_ends_at) supabaseResponse.headers.set('x-subscription-ends-at', profile.subscription_ends_at)
  }

  return supabaseResponse
}
