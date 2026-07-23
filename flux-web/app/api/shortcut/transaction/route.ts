import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adjustmentFor, parseAmount, getMexicoNow } from '@/lib/utils'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { ShortcutPayload } from '@/lib/types'

export const maxDuration = 30

function extractSearchTokens(concept: string): string[] {
  const tokens = concept
    .replace(/[*#\-_.]/g, ' ')
    .replace(/\b\d{3,}\b/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
  return tokens.length ? tokens : [concept]
}

async function findBestCategoryFromHistory(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  concept: string,
): Promise<string | null> {
  for (const token of [concept, ...extractSearchTokens(concept)]) {
    const { data } = await admin
      .from('transactions')
      .select('category_id')
      .eq('user_id', userId)
      .ilike('concept', `%${token}%`)
      .not('category_id', 'is', null)
      .neq('category_id', 'CAT-APPLE')
      .order('created_at', { ascending: false })
      .limit(30)
    if (!data?.length) continue
    const counts = data.reduce((acc, t: { category_id: string | null }) => {
      if (t.category_id) acc[t.category_id] = (acc[t.category_id] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const best = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null
    if (best) return best
  }
  return null
}

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
    supabaseAdmin.from('accounts').select('id,name,payment_method_id,currency,display_exchange_rate').eq('user_id', userId).eq('is_active', true),
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
  // CAT-APPLE is a generic "I don't know" fallback, not a real category choice —
  // treat it like no category so history-based auto-categorization still runs.
  if (categoryId === 'CAT-APPLE') categoryId = null

  // Resolve account
  const userAccounts = accountsResult.data ?? []
  let resolvedAccount: (typeof userAccounts)[number] | null = null
  if (body.account) {
    const lower = String(body.account).toLowerCase()
    resolvedAccount = userAccounts.find(a => a.id === body.account || a.name.toLowerCase().includes(lower)) ?? userAccounts[0] ?? null
  } else {
    resolvedAccount = userAccounts[0] ?? null
  }
  const accountId = resolvedAccount?.id ?? null
  const accountCurrency: string = (resolvedAccount as { currency?: string } | null)?.currency ?? 'MXN'
  const displayExchangeRate: number = (resolvedAccount as { display_exchange_rate?: number } | null)?.display_exchange_rate ?? 1

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
      currency: accountCurrency, exchange_rate: displayExchangeRate,
      category_id: null, account_id: accountId,
      destination_account_id: destId,
      transaction_date: date, is_validated: false,
      source: txSource,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { data: inserted, error } = await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      concept: body.concept,
      type: txType,
      amount,
      adjustment: adjustmentFor(txType, amount),
      currency: accountCurrency,
      exchange_rate: displayExchangeRate,
      category_id: categoryId,
      account_id: accountId,
      transaction_date: date,
      is_validated: false,
      notes: body.notes ?? null,
      source: txSource,
      original_currency: body.original_currency ? String(body.original_currency) : null,
      original_amount: body.original_currency ? amount : null,
    }).select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If no category was resolved from the payload, look up history in the background
    // so the shortcut response is not delayed
    if (!categoryId && body.concept && inserted?.[0]?.id) {
      const txId = inserted[0].id
      const concept = body.concept
      after(async () => {
        const best = await findBestCategoryFromHistory(supabaseAdmin, userId, concept)
        await supabaseAdmin
          .from('transactions')
          .update({ category_id: best ?? 'CAT-APPLE' })
          .eq('id', txId)
          .is('category_id', null)
      })
    }
  }

  return NextResponse.json({ status: 'ok', amount, type: txType, account: accountId, currency: accountCurrency })
}
