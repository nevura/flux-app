// One-time script: populate exchange_rates table from Frankfurter (ECB) data
// Schema: one row per day, rates stored as JSONB { "EUR_MXN": 21.5, "USD_MXN": 17.2, ... }
// Usage: npx tsx --env-file=.env.local scripts/backfill-fx.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const PAIRS: [string, string][] = [
  ['EUR', 'MXN'],
  ['USD', 'MXN'],
  ['GBP', 'MXN'],
  ['CAD', 'MXN'],
  ['JPY', 'MXN'],
  ['BRL', 'MXN'],
]

const START = '2025-01-01'
const TODAY = new Date().toISOString().slice(0, 10)

async function main() {
  const allRates: Record<string, Record<string, number>> = {}

  for (const [from, to] of PAIRS) {
    const url = `https://api.frankfurter.app/${START}..${TODAY}?from=${from}&to=${to}`
    console.log(`Fetching ${from} → ${to}…`)
    const res = await fetch(url)
    if (!res.ok) { console.error(`  HTTP ${res.status}`); continue }
    const json = await res.json() as { rates?: Record<string, Record<string, number>> }
    for (const [date, rateMap] of Object.entries(json.rates ?? {})) {
      if (!allRates[date]) allRates[date] = {}
      allRates[date][`${from}_${to}`] = rateMap[to]
    }
  }

  const rows = Object.entries(allRates).map(([date, rates]) => ({
    date,
    rates,
    source: 'frankfurter',
    updated_at: new Date().toISOString(),
  }))

  console.log(`\nUpserting ${rows.length} rows…`)
  const { error } = await (supabase as any)
    .from('exchange_rates')
    .upsert(rows, { onConflict: 'date' })

  if (error) { console.error('DB error:', error.message); return }
  console.log(`✓ Done — ${rows.length} days inserted`)
}

main()
