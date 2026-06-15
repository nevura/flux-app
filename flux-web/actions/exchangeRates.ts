'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1'

// All ECB/Frankfurter currencies → MXN (29 pairs, one row per day in JSONB)
const PAIRS: [string, string][] = [
  ['AUD', 'MXN'], ['BRL', 'MXN'], ['CAD', 'MXN'], ['CHF', 'MXN'],
  ['CNY', 'MXN'], ['CZK', 'MXN'], ['DKK', 'MXN'], ['EUR', 'MXN'],
  ['GBP', 'MXN'], ['HKD', 'MXN'], ['HUF', 'MXN'], ['IDR', 'MXN'],
  ['ILS', 'MXN'], ['INR', 'MXN'], ['ISK', 'MXN'], ['JPY', 'MXN'],
  ['KRW', 'MXN'], ['MYR', 'MXN'], ['NOK', 'MXN'], ['NZD', 'MXN'],
  ['PHP', 'MXN'], ['PLN', 'MXN'], ['RON', 'MXN'], ['SEK', 'MXN'],
  ['SGD', 'MXN'], ['THB', 'MXN'], ['TRY', 'MXN'], ['USD', 'MXN'],
  ['ZAR', 'MXN'],
]

// Schema: exchange_rates(date PK, rates JSONB { "EUR_MXN": 21.5, "USD_MXN": 17.2, ... })

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

export async function fetchAndStoreDailyRates(targetDate?: string): Promise<{ inserted: number; error?: string }> {
  const dateStr = targetDate ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const rates: Record<string, number> = {}

  for (const [from, to] of PAIRS) {
    try {
      const res = await fetch(`${FRANKFURTER_BASE}/${dateStr}?from=${from}&to=${to}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      })
      if (!res.ok) continue
      const json = await res.json() as { rates?: Record<string, number> }
      const rate = json.rates?.[to]
      if (rate != null) rates[`${from}_${to}`] = rate
    } catch {
      // skip on network error
    }
  }

  if (Object.keys(rates).length === 0) return { inserted: 0 }

  const db = createAdminClient() as any
  const { error } = await db
    .from('exchange_rates')
    .upsert({ date: dateStr, rates, source: 'frankfurter', updated_at: new Date().toISOString() })
  if (error) return { inserted: 0, error: error.message }
  return { inserted: 1 }
}

export async function backfillExchangeRates(
  startDate: string,
): Promise<{ inserted: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== (process.env.ADMIN_AUTH_EMAIL ?? process.env.ADMIN_EMAIL ?? 'bernardo.perezro06@gmail.com')) {
    return { inserted: 0, error: 'No autorizado' }
  }

  const today = new Date().toISOString().slice(0, 10)
  const allRates: Record<string, Record<string, number>> = {}

  for (const [from, to] of PAIRS) {
    try {
      const res = await fetch(`${FRANKFURTER_BASE}/${startDate}..${today}?from=${from}&to=${to}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      })
      if (!res.ok) continue
      const json = await res.json() as { rates?: Record<string, Record<string, number>> }
      for (const [date, rateMap] of Object.entries(json.rates ?? {})) {
        if (!allRates[date]) allRates[date] = {}
        allRates[date][`${from}_${to}`] = rateMap[to]
      }
    } catch {
      // skip on network error
    }
  }

  const rows = Object.entries(allRates).map(([date, rates]) => ({
    date,
    rates,
    source: 'frankfurter',
    updated_at: new Date().toISOString(),
  }))
  if (rows.length === 0) return { inserted: 0 }

  const db = createAdminClient() as any
  const { error } = await db.from('exchange_rates').upsert(rows, { onConflict: 'date' })
  if (error) return { inserted: 0, error: error.message }
  return { inserted: rows.length }
}
