import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminAction } from '@/lib/admin'
import { sendApprovalRejectedEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const uid = searchParams.get('uid') ?? ''
  const sig = searchParams.get('sig') ?? ''

  if (!verifyAdminAction(uid, 'reject', sig)) {
    return new NextResponse('Enlace inválido o expirado', { status: 403 })
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('email, status')
    .eq('id', uid)
    .single() as { data: { email: string | null; status: string } | null }

  if (!profile) return new NextResponse('Usuario no encontrado', { status: 404 })

  await (admin.from('profiles') as any).update({ status: 'rejected' }).eq('id', uid)

  if (profile.email) {
    await sendApprovalRejectedEmail({ to: profile.email }).catch(() => {})
  }

  return NextResponse.redirect(`${origin}/api/admin/reject/done`)
}
