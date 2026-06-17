'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Frankfurter v2 — 165 currencies including all LATAM (ARS, COP, CLP, PEN, UYU…)
// v2 docs: https://frankfurter.dev
const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2'

// Schema: exchange_rates(date PK, rates JSONB { "USD_MXN": 17.22, "ARS_MXN": 0.012, … })
// All pairs stored as X_MXN (how many MXN buys 1 unit of X).
// Inverse lookup (e.g. MXN→USD) is handled in getExchangeRateForDate.

type RateEntry = { date: string; base: string; quote: string; rate: number }

/** Convert v2 /rates?base=MXN response into the X_MXN JSONB map we store. */
function buildRateMap(entries: RateEntry[]): Record<string, number> {
  const rates: Record<string, number> = {}
  for (const e of entries) {
    // e.rate = "1 MXN buys N quote", so quote_MXN = 1 / e.rate
    if (e.rate > 0) rates[`${e.quote}_MXN`] = Math.round((1 / e.rate) * 1e6) / 1e6
  }
  return rates
}

export async function getExchangeRateForDate(
  fromCurrency: string,
  toCurrency: string,
  date: string, // 'YYYY-MM-DD'
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1

  const db = createAdminClient() as any
  const { data } = await db
    .from('exchange_rates')
    .select('rates')
    .lte('date', date)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (!data?.rates) return null
  const direct = data.rates[`${fromCurrency}_${toCurrency}`]
  if (direct != null) return direct
  // DB only stores X→MXN pairs; invert for MXN→X lookups
  const inverse = data.rates[`${toCurrency}_${fromCurrency}`]
  if (inverse != null) return Math.round((1 / inverse) * 1e6) / 1e6
  return null
}

/**
 * Fetch all 164+ currency pairs vs MXN for a single date and upsert into exchange_rates.
 * v2 returns everything in one request (vs. 29+ separate calls with v1).
 */
export async function fetchAndStoreDailyRates(targetDate?: string): Promise<{ inserted: number; error?: string }> {
  const dateStr = targetDate ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let json: RateEntry[]
  try {
    const res = await fetch(`${FRANKFURTER_BASE}/rates?base=MXN&date=${dateStr}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return { inserted: 0 }
    json = await res.json()
  } catch {
    return { inserted: 0, error: 'Network error' }
  }

  if (!Array.isArray(json) || json.length === 0) return { inserted: 0 }

  const rates = buildRateMap(json)
  if (Object.keys(rates).length === 0) return { inserted: 0 }

  // Use the date actually returned by the API (may differ from requested on holidays)
  const actualDate = json[0]?.date ?? dateStr

  const db = createAdminClient() as any
  const { error } = await db
    .from('exchange_rates')
    .upsert({ date: actualDate, rates, source: 'frankfurter', updated_at: new Date().toISOString() })
  if (error) return { inserted: 0, error: error.message }
  return { inserted: 1 }
}

/**
 * Admin-only: backfill from startDate to today using v2.
 * One API call per date (returns all 164 currencies), then bulk upsert.
 */
export async function backfillExchangeRates(
  startDate: string,
): Promise<{ inserted: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== (process.env.ADMIN_AUTH_EMAIL ?? process.env.ADMIN_EMAIL ?? 'bernardo.perezro06@gmail.com')) {
    return { inserted: 0, error: 'No autorizado' }
  }

  const today = new Date().toISOString().slice(0, 10)

  // Build list of calendar dates from startDate to today
  const dates: string[] = []
  const cur = new Date(startDate + 'T12:00:00Z')
  const end = new Date(today + 'T12:00:00Z')
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }

  // Fetch each date (API returns the nearest available trading day)
  const seen = new Set<string>()
  const rows: Array<{ date: string; rates: Record<string, number>; source: string; updated_at: string }> = []

  for (const dateStr of dates) {
    try {
      const res = await fetch(`${FRANKFURTER_BASE}/rates?base=MXN&date=${dateStr}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      })
      if (!res.ok) continue
      const json: RateEntry[] = await res.json()
      if (!Array.isArray(json) || json.length === 0) continue
      const actualDate = json[0]?.date ?? dateStr
      if (seen.has(actualDate)) continue // skip duplicate trading-day responses
      seen.add(actualDate)
      const rates = buildRateMap(json)
      if (Object.keys(rates).length > 0) {
        rows.push({ date: actualDate, rates, source: 'frankfurter', updated_at: new Date().toISOString() })
      }
    } catch {
      // skip on network error
    }
  }

  if (rows.length === 0) return { inserted: 0 }

  const db = createAdminClient() as any
  const { error } = await db.from('exchange_rates').upsert(rows, { onConflict: 'date' })
  if (error) return { inserted: 0, error: error.message }
  return { inserted: rows.length }
}
