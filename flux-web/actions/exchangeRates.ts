'use server'

import { createClient } from '@/lib/supabase/server'

const FRANKFURTER_BASE = 'https://api.frankfurter.app'

// Currencies supported by Frankfurter (ECB data)
const FRANKFURTER_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'BRL', 'MXN']

export async function getExchangeRateForDate(
  fromCurrency: string,
  toCurrency: string,
  date: string, // 'YYYY-MM-DD'
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1

  const supabase = await createClient()

  // Try exact date first, then fall back to closest prior date within 7 days
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate, date')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .lte('date', date)
    .gte('date', new Date(new Date(date).getTime() - 7 * 86400000).toISOString().slice(0, 10))
    .order('date', { ascending: false })
    .limit(1)
    .single()

  return data?.rate ? Number(data.rate) : null
}

export async function fetchAndStoreDailyRates(targetDate?: string): Promise<{ inserted: number; error?: string }> {
  const date = targetDate ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10) // yesterday

  const supabase = await createClient()

  // Find which foreign currencies the users actually have accounts in
  const { data: foreignAccounts } = await supabase
    .from('accounts')
    .select('currency')
    .neq('currency', 'MXN')
    .eq('is_active', true)

  const foreignCurrencies = [...new Set((foreignAccounts ?? []).map(a => a.currency).filter(c => FRANKFURTER_CURRENCIES.includes(c)))]
  if (foreignCurrencies.length === 0) return { inserted: 0 }

  // Fetch all needed rates from Frankfurter in a single request per base currency
  const rows: { date: string; from_currency: string; to_currency: string; rate: number; source: string }[] = []

  for (const fromCurrency of foreignCurrencies) {
    const toCurrencies = ['MXN', ...foreignCurrencies.filter(c => c !== fromCurrency)].filter(c => FRANKFURTER_CURRENCIES.includes(c))
    const toParam = toCurrencies.join(',')

    try {
      const res = await fetch(`${FRANKFURTER_BASE}/${date}?from=${fromCurrency}&to=${toParam}`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 0 },
      })
      if (!res.ok) continue

      const json = await res.json() as { rates?: Record<string, number> }
      for (const [toCurrency, rate] of Object.entries(json.rates ?? {})) {
        rows.push({ date, from_currency: fromCurrency, to_currency: toCurrency, rate, source: 'frankfurter' })
      }
    } catch {
      // Skip failed currency on network error
    }
  }

  if (rows.length === 0) return { inserted: 0 }

  const { error } = await supabase.from('exchange_rates').upsert(rows, { onConflict: 'date,from_currency,to_currency', ignoreDuplicates: true })
  if (error) return { inserted: 0, error: error.message }

  return { inserted: rows.length }
}

export async function backfillExchangeRates(
  fromCurrency: string,
  toCurrency: string,
  startDate: string,
): Promise<{ inserted: number; error?: string }> {
  if (!FRANKFURTER_CURRENCIES.includes(fromCurrency) || !FRANKFURTER_CURRENCIES.includes(toCurrency)) {
    return { inserted: 0, error: `${fromCurrency} o ${toCurrency} no está soportado por Frankfurter` }
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    const res = await fetch(`${FRANKFURTER_BASE}/${startDate}..${today}?from=${fromCurrency}&to=${toCurrency}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return { inserted: 0, error: `Frankfurter error: ${res.status}` }

    const json = await res.json() as { rates?: Record<string, Record<string, number>> }
    const rows = Object.entries(json.rates ?? {}).map(([date, rates]) => ({
      date,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate: rates[toCurrency],
      source: 'frankfurter',
    })).filter(r => r.rate != null)

    if (rows.length === 0) return { inserted: 0 }

    const supabase = await createClient()
    const { error } = await supabase.from('exchange_rates').upsert(rows, { onConflict: 'date,from_currency,to_currency', ignoreDuplicates: true })
    if (error) return { inserted: 0, error: error.message }

    return { inserted: rows.length }
  } catch (e) {
    return { inserted: 0, error: String(e) }
  }
}
