import { createAdminClient } from '@/lib/supabase/admin'
import { sendApprovalGrantedEmail } from '@/lib/email'
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
  if (profile.status !== 'approved') {
    return new NextResponse(`El usuario tiene status "${profile.status}", no está aprobado aún.`, { status: 400 })
  }

  await sendApprovalGrantedEmail({
    to: profile.email!,
    loginUrl: `${origin}/login`,
  })

  return new NextResponse(
    `✅ Email de acceso reenviado a ${profile.email}`,
    { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
