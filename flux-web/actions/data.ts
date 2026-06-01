'use server'

import { createClient } from '@/lib/supabase/server'
import { getMexicoNow } from '@/lib/utils'

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportTransactionsCSV(): Promise<{ csv: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { csv: null, error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles').select('subscription_status, trial_ends_at').eq('id', user.id).single()
  const isExpired = profile?.subscription_status === 'expired' || profile?.subscription_status === 'canceled'
  if (isExpired) return { csv: null, error: 'Función disponible solo para cuentas activas' }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, categories(name), accounts!transactions_account_id_fkey(name)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  if (error) return { csv: null, error: error.message }

  const TYPE_MAP: Record<string, string> = {
    'TR-GASTO': 'Gasto',
    'TR-INGRESO': 'Ingreso',
    'TR-TRANSFER': 'Transferencia',
  }

  const header = ['Fecha', 'Concepto', 'Tipo', 'Monto', 'Categoría', 'Cuenta', 'Notas'].join(',')
  const rows = (transactions ?? []).map(t => {
    const cat = (t as any).categories?.name ?? ''
    const acc = (t as any).accounts?.name ?? ''
    const type = TYPE_MAP[t.type] ?? t.type
    const esc = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`
    return [
      esc(t.transaction_date ?? ''),
      esc(t.concept ?? ''),
      esc(type),
      String(Math.abs(Number(t.amount))),
      esc(cat),
      esc(acc),
      esc(t.notes ?? ''),
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  return { csv, error: null }
}

// ── Import ────────────────────────────────────────────────────────────────────

export interface ImportRow {
  fecha: string        // YYYY-MM-DD
  concepto: string
  tipo: string         // Gasto | Ingreso | Transferencia
  monto: string        // positive number
  categoria?: string   // category name (optional)
  cuenta?: string      // account name (optional)
  notas?: string
}

export async function importTransactions(rows: ImportRow[]): Promise<{ imported: number; errors: string[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, errors: [], error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles').select('subscription_status, trial_ends_at').eq('id', user.id).single()
  const isExpired = profile?.subscription_status === 'expired' || profile?.subscription_status === 'canceled'
  if (isExpired) return { imported: 0, errors: [], error: 'Función disponible solo para cuentas activas' }

  if (!rows.length) return { imported: 0, errors: [], error: 'El archivo no contiene filas' }
  if (rows.length > 500) return { imported: 0, errors: [], error: 'Máximo 500 filas por importación' }

  // Fetch user's accounts and categories for name matching
  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from('accounts').select('id, name').eq('user_id', user.id),
    supabase.from('categories').select('id, name').or(`user_id.eq.${user.id},user_id.is.null`),
  ])

  const accByName = Object.fromEntries((accounts ?? []).map(a => [a.name.toLowerCase().trim(), a.id]))
  const catByName = Object.fromEntries((categories ?? []).map(c => [c.name.toLowerCase().trim(), c.id]))

  const TYPE_MAP: Record<string, string> = {
    'gasto': 'TR-GASTO', 'expense': 'TR-GASTO',
    'ingreso': 'TR-INGRESO', 'income': 'TR-INGRESO',
    'transferencia': 'TR-TRANSFER', 'transfer': 'TR-TRANSFER',
  }

  const errors: string[] = []
  const inserts: any[] = []
  const today = getMexicoNow().slice(0, 10)

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2  // +2 because row 1 is header

    const amount = parseFloat(String(r.monto).replace(/[,$\s]/g, ''))
    if (isNaN(amount) || amount <= 0) { errors.push(`Fila ${rowNum}: monto inválido "${r.monto}"`); continue }

    const typeKey = String(r.tipo ?? '').toLowerCase().trim()
    const type = TYPE_MAP[typeKey]
    if (!type) { errors.push(`Fila ${rowNum}: tipo "${r.tipo}" desconocido (usa Gasto, Ingreso o Transferencia)`); continue }

    const fecha = String(r.fecha ?? '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { errors.push(`Fila ${rowNum}: fecha "${fecha}" inválida (usa YYYY-MM-DD)`); continue }

    const accId = r.cuenta ? accByName[r.cuenta.toLowerCase().trim()] : null
    const catId = r.categoria ? catByName[r.categoria.toLowerCase().trim()] : null

    const adjustment = type === 'TR-INGRESO' ? amount : -amount

    inserts.push({
      user_id: user.id,
      concept: String(r.concepto ?? '').trim() || 'Importado',
      type,
      amount,
      adjustment,
      category_id: catId ?? null,
      account_id: accId ?? null,
      transaction_date: fecha,
      notes: r.notas ? String(r.notas).trim() : null,
      is_validated: false,
    })
  }

  if (!inserts.length) return { imported: 0, errors, error: errors.length ? null : 'Sin filas válidas' }

  const { error: insertErr } = await supabase.from('transactions').insert(inserts)
  if (insertErr) return { imported: 0, errors, error: insertErr.message }

  return { imported: inserts.length, errors, error: null }
}
