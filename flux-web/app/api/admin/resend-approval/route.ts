import { createAdminClient } from '@/lib/supabase/admin'
import { signAdminAction } from '@/lib/admin'
import { sendApprovalRequestEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const secret = searchParams.get('secret') ?? ''
  const uid = searchParams.get('uid') ?? ''

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  if (!uid) {
    return new NextResponse('Falta uid', { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('email, status')
    .eq('id', uid)
    .single() as { data: { email: string | null; status: string } | null }

  if (!profile) return new NextResponse('Usuario no encontrado', { status: 404 })

  const approveUrl = `${origin}/api/admin/approve?uid=${uid}&sig=${signAdminAction(uid, 'approve')}`
  const rejectUrl  = `${origin}/api/admin/reject?uid=${uid}&sig=${signAdminAction(uid, 'reject')}`

  await sendApprovalRequestEmail({
    adminEmail: process.env.ADMIN_EMAIL!,
    applicantEmail: profile.email ?? uid,
    approveUrl,
    rejectUrl,
  })

  return new NextResponse(
    `✅ Email reenviado a ${process.env.ADMIN_EMAIL} — solicitante: ${profile.email} (status: ${profile.status})`,
    { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
