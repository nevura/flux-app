// One-time script: populate exchange_rates table from Frankfurter (ECB) data
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

async function backfill(from: string, to: string) {
  const url = `https://api.frankfurter.app/${START}..${TODAY}?from=${from}&to=${to}`
  console.log(`Fetching ${from} → ${to}…`)
  const res = await fetch(url)
  if (!res.ok) { console.error(`  HTTP ${res.status}`); return 0 }
  const json = await res.json() as { rates: Record<string, Record<string, number>> }
  if (!json.rates) { console.error('  No rates in response'); return 0 }

  const rows = Object.entries(json.rates).map(([date, rateMap]) => ({
    date,
    from_currency: from,
    to_currency: to,
    rate: rateMap[to],
    source: 'frankfurter',
  })).filter(r => r.rate != null)

  if (rows.length === 0) { console.log('  0 rows'); return 0 }

  const { error } = await (supabase as any)
    .from('exchange_rates')
    .upsert(rows, { onConflict: 'date,from_currency,to_currency' })

  if (error) { console.error('  DB error:', error.message); return 0 }
  console.log(`  ✓ ${rows.length} rows`)
  return rows.length
}

async function main() {
  let total = 0
  for (const [from, to] of PAIRS) {
    total += await backfill(from, to)
  }
  console.log(`\nDone — ${total} rows total`)
}
main()
