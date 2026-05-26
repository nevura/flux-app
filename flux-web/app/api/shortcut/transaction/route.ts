import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adjustmentFor, parseAmount } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { ShortcutPayload } from '@/lib/types'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getAdminClient()
  // Auth via Bearer token
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 })

  // Lookup token → user
  const { data: tokenRow, error: tokenErr } = await supabaseAdmin
    .from('shortcut_tokens')
    .select('user_id')
    .eq('token', token)
    .single()

  if (tokenErr || !tokenRow) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const userId = tokenRow.user_id

  // Update last_used_at
  await supabaseAdmin.from('shortcut_tokens').update({ last_used_at: new Date().toISOString() }).eq('token', token)

  // Parse body — accept both English and Spanish field names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido', hint: 'Asegúrate de que el cuerpo de solicitud sea tipo JSON (no Formulario)' }, { status: 400 })
  }

  // Accept many common Spanish variants for field names
  const body: ShortcutPayload = {
    amount:      raw.amount      ?? raw.cantidad   ?? raw.monto,
    concept:     raw.concept     ?? raw.concepto,
    type:        raw.type        ?? raw.tipo,
    category:    raw.category    ?? raw.categoria,
    account:     raw.account     ?? raw.cuenta,
    destination: raw.destination ?? raw.cuenta_destino ?? raw.destino,
    date:        raw.date        ?? raw.fecha,
    validated:   raw.validated   ?? raw.validado,
    notes:       raw.notes       ?? raw.notas,
  }

  const amount = parseAmount(body.amount)
  if (!amount) return NextResponse.json({
    error: 'Monto inválido o faltante',
    received_fields: Object.keys(raw),
    amount_value: raw.amount ?? raw.cantidad ?? raw.monto ?? null,
  }, { status: 400 })
  if (!body.concept) return NextResponse.json({
    error: 'Concepto requerido',
    received_fields: Object.keys(raw),
  }, { status: 400 })

  // Resolve type
  const typeMap: Record<string, string> = {
    'gasto': 'TR-GASTO', 'ingreso': 'TR-INGRESO', 'transferencia': 'TR-TRANSFER',
    'expense': 'TR-GASTO', 'income': 'TR-INGRESO', 'transfer': 'TR-TRANSFER',
  }
  const txType = typeMap[(body.type ?? 'gasto').toLowerCase()] ?? 'TR-GASTO'

  // Resolve category
  let categoryId: string | null = null
  if (body.category) {
    const lower = String(body.category).toLowerCase()
    // Try exact ID first — but verify it exists to avoid FK error
    if (lower.startsWith('cat-')) {
      const { data: catRow } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', body.category)
        .maybeSingle()
      categoryId = catRow ? body.category : 'CAT-DEF-OTHER'
    } else {
      // Match by name in defaults
      const found = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase().includes(lower))
      if (found) {
        categoryId = found.id
      } else {
        // Try user's custom categories
        const { data: userCats } = await supabaseAdmin
          .from('categories')
          .select('id,name')
          .eq('user_id', userId)
        const match = userCats?.find(c => c.name.toLowerCase().includes(lower))
        if (match) categoryId = match.id
        else categoryId = 'CAT-DEF-OTHER'
      }
    }
  }

  // Resolve account
  let accountId: string | null = null
  const { data: userAccounts } = await supabaseAdmin
    .from('accounts')
    .select('id,name,payment_method_id')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (body.account) {
    const lower = String(body.account).toLowerCase()
    const match = userAccounts?.find(a =>
      a.id === body.account || a.name.toLowerCase().includes(lower),
    )
    accountId = match?.id ?? userAccounts?.[0]?.id ?? null
  } else {
    accountId = userAccounts?.[0]?.id ?? null
  }

  if (!accountId) return NextResponse.json({
    error: 'Sin cuenta disponible',
    account_sent: body.account ?? null,
    available_accounts: userAccounts?.map(a => a.name) ?? [],
  }, { status: 400 })

  const date = body.date ? new Date(body.date).toISOString() : new Date().toISOString()

  // Insert transaction
  if (txType === 'TR-TRANSFER') {
    // Resolve destination account
    let destId: string | null = null
    if (body.destination) {
      const lower = String(body.destination).toLowerCase()
      destId = userAccounts?.find(a => a.name.toLowerCase().includes(lower))?.id ?? null
    }
    if (!destId) return NextResponse.json({ error: 'Cuenta destino requerida para transferencias' }, { status: 400 })

    const { error } = await supabaseAdmin.from('transactions').insert({
      user_id: userId, concept: body.concept,
      type: 'TR-TRANSFER', amount, adjustment: -amount,
      category_id: null, account_id: accountId,
      destination_account_id: destId,
      transaction_date: date, is_validated: body.validated === 1,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      concept: body.concept,
      type: txType,
      amount,
      adjustment: adjustmentFor(txType, amount),
      category_id: categoryId,
      account_id: accountId,
      transaction_date: date,
      is_validated: body.validated !== 0,
      notes: body.notes ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok', amount, type: txType, account: accountId })
}
