import { createClient } from '@/lib/supabase/server'
import { monthRange } from '@/lib/utils'
import TransactionsClient from '@/components/transactions/TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { year: yearStr, month: monthStr } = await searchParams
  const now = new Date()
  const year  = yearStr  ? parseInt(yearStr)  : now.getFullYear()
  const month = monthStr ? parseInt(monthStr) : now.getMonth() + 1
  const { from, to } = monthRange(year, month)

  const [{ data: transactions }, { data: categories }, { data: accounts }, { data: people }] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id)
      .gte('transaction_date', from).lte('transaction_date', to)
      .order('transaction_date', { ascending: false }),
    supabase.from('categories').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('sort_order'),
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true).order('sort_order'),
    supabase.from('people').select('*').eq('user_id', user.id),
  ])

  return (
    <TransactionsClient
      initialTransactions={transactions ?? []}
      categories={categories ?? []}
      accounts={accounts ?? []}
      people={people ?? []}
      year={year}
      month={month}
    />
  )
}
