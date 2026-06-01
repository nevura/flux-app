import { createClient } from '@/lib/supabase/server'
import { monthRange, currentYearMonth } from '@/lib/utils'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { year, month } = currentYearMonth()
  const { to } = monthRange(year, month)
  // Include previous month so daily/weekly navigation doesn't go blank near month boundaries
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  const { from } = monthRange(prevYear, prevMonth)

  const [
    { data: profile },
    { data: accounts },
    { data: transactions },
    { data: categories },
    { data: scheduled },
    { data: budgets },
    { data: creditPayments },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, default_monthly_budget').eq('id', user.id).single(),
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true).order('sort_order'),
    supabase.from('transactions').select('*').eq('user_id', user.id)
      .gte('transaction_date', from).lte('transaction_date', to)
      .order('transaction_date', { ascending: false }),
    supabase.from('categories').select('*').or(`user_id.eq.${user.id},user_id.is.null`).order('sort_order'),
    supabase.from('scheduled_transactions').select('*').eq('user_id', user.id).eq('status', 'ACTIVO'),
    supabase.from('budgets').select('*').eq('user_id', user.id).eq('year', year).eq('month', month),
    supabase.from('credit_payments').select('*').eq('user_id', user.id).eq('year', year).eq('month', month),
  ])

  // Compute account balances from all-time transactions
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('account_id,adjustment,type,amount,destination_account_id')
    .eq('user_id', user.id)

  const balanceMap: Record<string, number> = {}
  for (const t of allTransactions ?? []) {
    balanceMap[t.account_id] = (balanceMap[t.account_id] ?? 0) + Number(t.adjustment)
    if (t.type === 'TR-TRANSFER' && t.destination_account_id) {
      balanceMap[t.destination_account_id] = (balanceMap[t.destination_account_id] ?? 0) + Number(t.amount)
    }
  }

  const accountsWithBalance = (accounts ?? []).map(a => ({
    ...a,
    balance: balanceMap[a.id] ?? 0,
  }))

  const monthlyBudget = budgets?.[0] ?? (
    profile?.default_monthly_budget
      ? { id: 'default', user_id: user.id, year, month, amount: profile.default_monthly_budget, created_at: '', updated_at: '' }
      : null
  )

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? '', full_name: profile?.full_name ?? null }}
      accounts={accountsWithBalance}
      transactions={transactions ?? []}
      categories={categories ?? []}
      scheduled={scheduled ?? []}
      budget={monthlyBudget}
      creditPayments={creditPayments ?? []}
      year={year}
      month={month}
    />
  )
}
