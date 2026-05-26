import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// Returns categories and accounts for the shortcut quick-entry form
export async function GET(req: NextRequest) {
  const supabaseAdmin = getAdminClient()
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 })

  const { data: tokenRow } = await supabaseAdmin
    .from('shortcut_tokens').select('user_id').eq('token', token).single()

  if (!tokenRow) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const userId = tokenRow.user_id

  const [{ data: userCats }, { data: accounts }] = await Promise.all([
    supabaseAdmin.from('categories').select('id,name').eq('user_id', userId),
    supabaseAdmin.from('accounts').select('id,name').eq('user_id', userId).eq('is_active', true),
  ])

  const allCategories = [
    ...DEFAULT_CATEGORIES.map(c => ({ id: c.id, name: c.name })),
    ...(userCats ?? []),
  ]

  return NextResponse.json({
    categories: allCategories.map(c => c.name),
    categories_ids: allCategories,
    accounts: (accounts ?? []).map(a => a.name),
    accounts_ids: accounts ?? [],
    types: ['Gasto', 'Ingreso', 'Transferencia'],
  })
}
