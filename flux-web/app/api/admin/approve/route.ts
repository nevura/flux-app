import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAction } from '@/lib/admin'
import { sendApprovalGrantedEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const uid = searchParams.get('uid') ?? ''
  const sig = searchParams.get('sig') ?? ''

  if (!verifyAdminAction(uid, 'approve', sig)) {
    return new NextResponse('Enlace inválido o expirado', { status: 403 })
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('email, status')
    .eq('id', uid)
    .single() as { data: { email: string | null; status: string } | null }

  if (!profile) return new NextResponse('Usuario no encontrado', { status: 404 })
  if (profile.status === 'approved') {
    return NextResponse.redirect(`${origin}/api/admin/approve/done?already=1`)
  }

  await (admin.from('profiles') as any).update({ status: 'approved' }).eq('id', uid)

  if (profile.email) {
    await sendApprovalGrantedEmail({
      to: profile.email,
      loginUrl: `${origin}/login`,
    }).catch((err) => {
      console.error('[approve] sendApprovalGrantedEmail failed:', err)
    })
  }

  return NextResponse.redirect(`${origin}/api/admin/approve/done`)
}
