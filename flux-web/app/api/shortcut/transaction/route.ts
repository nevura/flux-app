import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adjustmentFor, parseAmount, getMexicoNow } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { ShortcutPayload } from '@/lib/types'

export const maxDuration = 30

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

  // Parse body in parallel with token lookup — body doesn't depend on userId
  const [{ data: tokenRow, error: tokenErr }, rawBody] = await Promise.all([
    supabaseAdmin.from('shortcut_tokens').select('user_id').eq('token', token).single(),
    req.json().catch(() => null),
  ])

  if (tokenErr || !tokenRow) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  if (!rawBody) return NextResponse.json({ error: 'JSON inválido', hint: 'Asegúrate de que el cuerpo de solicitud sea tipo JSON (no Formulario)' }, { status: 400 })

  const userId = tokenRow.user_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any = rawBody

  // Derive source + token update payload from body (no DB needed)
  const now = new Date().toISOString()
  const sourceUpdate: Record<string, string> = { last_used_at: now }
  const source = ((raw?.source ?? raw?.fuente ?? '') as string).toLowerCase()
  if (source === 'apple_pay' || source === 'applepay' || source === 'apple') {
    sourceUpdate.apple_pay_last_used_at = now
  } else if (source === 'quick_register' || source === 'rapido' || source === 'quick') {
    sourceUpdate.quick_register_last_used_at = now
  } else {
    const notesVal = ((raw?.notes ?? raw?.notas ?? '') as string).toLowerCase()
    if (notesVal.includes('apple pay')) {
      sourceUpdate.apple_pay_last_used_at = now
    } else {
      sourceUpdate.quick_register_last_used_at = now
    }
  }
  const txSource = sourceUpdate.apple_pay_last_used_at ? 'apple_pay' : 'quick_register'

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

  const typeMap: Record<string, string> = {
    'gasto': 'TR-GASTO', 'ingreso': 'TR-INGRESO', 'transferencia': 'TR-TRANSFER',
    'expense': 'TR-GASTO', 'income': 'TR-INGRESO', 'transfer': 'TR-TRANSFER',
  }
  const txType = typeMap[(body.type ?? 'gasto').toLowerCase()] ?? 'TR-GASTO'

  // Run all independent DB queries in parallel: subscription check + token update + accounts + user categories
  const catLower = body.category ? String(body.category).toLowerCase() : null
  const needsUserCats = catLower && !catLower.startsWith('cat-') && !DEFAULT_CATEGORIES.find(c => c.name.toLowerCase().includes(catLower))

  const [subResult, , accountsResult, userCatsResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('subscription_status').eq('id', userId).single(),
    supabaseAdmin.from('shortcut_tokens').update(sourceUpdate).eq('token', token),
    supabaseAdmin.from('accounts').select('id,name,payment_method_id').eq('user_id', userId).eq('is_active', true),
    needsUserCats
      ? supabaseAdmin.from('categories').select('id,name').eq('user_id', userId)
      : Promise.resolve({ data: null }),
  ])

  const blockedSub = ['expired', 'canceled']
  if (blockedSub.includes(subResult.data?.subscription_status ?? '')) {
    return NextResponse.json({
      error: 'Tu suscripción expiró. Renueva en FluxApp Finance → Configuración → Suscripción.',
    }, { status: 402 })
  }

  // Resolve category
  let categoryId: string | null = null
  if (catLower) {
    if (catLower.startsWith('cat-')) {
      // Verify ID exists to avoid FK error — this is a cheap indexed lookup
      const { data: catRow } = await supabaseAdmin.from('categories').select('id').eq('id', body.category).maybeSingle()
      categoryId = catRow ? String(body.category) : 'CAT-DEF-OTHER'
    } else {
      const found = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase().includes(catLower))
      if (found) {
        categoryId = found.id
      } else {
        const match = userCatsResult.data?.find((c: { id: string; name: string }) => c.name.toLowerCase().includes(catLower))
        categoryId = match?.id ?? 'CAT-DEF-OTHER'
      }
    }
  }

  // Resolve account
  const userAccounts = accountsResult.data ?? []
  let accountId: string | null = null
  if (body.account) {
    const lower = String(body.account).toLowerCase()
    accountId = userAccounts.find(a => a.id === body.account || a.name.toLowerCase().includes(lower))?.id ?? userAccounts[0]?.id ?? null
  } else {
    accountId = userAccounts[0]?.id ?? null
  }

  if (!accountId) return NextResponse.json({
    error: 'Sin cuenta disponible',
    account_sent: body.account ?? null,
    available_accounts: userAccounts.map(a => a.name),
  }, { status: 400 })

  const date = body.date ? String(body.date) : getMexicoNow()

  // Insert transaction
  if (txType === 'TR-TRANSFER') {
    let destId: string | null = null
    if (body.destination) {
      const lower = String(body.destination).toLowerCase()
      destId = userAccounts.find(a => a.name.toLowerCase().includes(lower))?.id ?? null
    }
    if (!destId) return NextResponse.json({ error: 'Cuenta destino requerida para transferencias' }, { status: 400 })

    const { error } = await supabaseAdmin.from('transactions').insert({
      user_id: userId, concept: body.concept,
      type: 'TR-TRANSFER', amount, adjustment: -amount,
      category_id: null, account_id: accountId,
      destination_account_id: destId,
      transaction_date: date, is_validated: false,
      source: txSource,
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
      is_validated: false,
      notes: body.notes ?? null,
      source: txSource,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok', amount, type: txType, account: accountId })
}
