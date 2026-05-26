import { createClient } from '@/lib/supabase/server'
import { monthRange } from '@/lib/utils'
import InsightsClient from '@/components/insights/InsightsClient'

export const dynamic = 'force-dynamic'

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { year: yearStr, month: monthStr } = await searchParams
  const now = new Date()
  const year  = yearStr  ? parseInt(yearStr)  : now.getFullYear()
  const month = monthStr ? parseInt(monthStr) : now.getMonth() + 1
  const { from, to } = monthRange(year, month)

  const [{ data: transactions }, { data: categories }, { data: allTx }] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id)
      .gte('transaction_date', from).lte('transaction_date', to)
      .order('transaction_date', { ascending: false }),
    supabase.from('categories').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('sort_order'),
    supabase.from('transactions')
      .select('type, amount, transaction_date')
      .eq('user_id', user.id)
      .neq('type', 'TR-TRANSFER'),
  ])

  // Build monthly summary from all transactions
  const monthMap: Record<string, { year: number; month: number; income: number; expenses: number }> = {}
  for (const t of allTx ?? []) {
    const d = new Date(t.transaction_date)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    if (!monthMap[key]) monthMap[key] = { year: d.getFullYear(), month: d.getMonth() + 1, income: 0, expenses: 0 }
    if (t.type === 'TR-INGRESO') monthMap[key].income   += Number(t.amount)
    else                         monthMap[key].expenses += Number(t.amount)
  }
  const monthlySummary = Object.values(monthMap).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  )

  return (
    <InsightsClient
      transactions={transactions ?? []}
      categories={categories ?? []}
      monthlySummary={monthlySummary}
      year={year}
      month={month}
    />
  )
}
