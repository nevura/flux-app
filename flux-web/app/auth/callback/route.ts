import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signAdminAction } from '@/lib/admin'
import { sendApprovalRequestEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const admin = createAdminClient()
        const { data: profile } = await admin
          .from('profiles')
          .select('status, email, created_at')
          .eq('id', user.id)
          .single() as { data: { status: string; email: string | null; created_at: string } | null }

        // Send approval request email only for brand-new pending users
        if (profile?.status === 'pending') {
          const ageMs = Date.now() - new Date(profile.created_at).getTime()
          if (ageMs < 10 * 60 * 1000) {
            const adminEmail = process.env.ADMIN_EMAIL!
            const approveUrl = `${origin}/api/admin/approve?uid=${user.id}&sig=${signAdminAction(user.id, 'approve')}`
            const rejectUrl  = `${origin}/api/admin/reject?uid=${user.id}&sig=${signAdminAction(user.id, 'reject')}`
            await sendApprovalRequestEmail({
              adminEmail,
              applicantEmail: profile.email ?? user.email ?? '',
              approveUrl,
              rejectUrl,
            }).catch(() => {/* non-blocking */})
          }
          return NextResponse.redirect(`${origin}/pending`)
        }

        if (profile?.status === 'rejected') {
          return NextResponse.redirect(`${origin}/rejected`)
        }
      }
      return NextResponse.redirect(`${origin}/home`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
