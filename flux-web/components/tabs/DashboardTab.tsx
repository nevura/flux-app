'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { currentYearMonth, monthRange } from '@/lib/utils'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { AccountWithBalance, Transaction, Category, ScheduledTransaction, Budget, CreditPayment } from '@/lib/types'

interface DashboardData {
  accounts: AccountWithBalance[]
  transactions: Transaction[]
  loadedFrom: string
  categories: Category[]
  scheduled: ScheduledTransaction[]
  budget: Budget | null
  creditPayments: CreditPayment[]
  year: number
  month: number
}

function Skeleton() {
  return (
    <div className="px-5 pt-6 space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded-full" style={{ background: 'var(--f-bg-card)' }} />
      <div className="h-8 w-48 rounded-full" style={{ background: 'var(--f-bg-card)' }} />
      <div className="h-36 rounded-[20px]" style={{ background: 'var(--f-bg-card)' }} />
      <div className="h-28 rounded-[20px]" style={{ background: 'var(--f-bg-card)' }} />
      <div className="h-28 rounded-[20px]" style={{ background: 'var(--f-bg-card)' }} />
    </div>
  )
}

interface Props {
  userId: string
  fullName: string | null
  email: string
  active: boolean
  refreshSignal: number
}

export default function DashboardTab({ userId, fullName, email, active, refreshSignal }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const loadedRef = useRef(false)
  const supabase = useRef(createClient()).current

  const load = useCallback(async () => {
    const { year, month } = currentYearMonth()
    const { to } = monthRange(year, month)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear  = month === 1 ? year - 1 : year
    const { from } = monthRange(prevYear, prevMonth)

    const [
      { data: accounts },
      { data: transactions },
      { data: categories },
      { data: scheduled },
      { data: budgets },
      { data: creditPayments },
      { data: allTx },
    ] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId).eq('is_active', true).order('sort_order'),
      supabase.from('transactions').select('*').eq('user_id', userId)
        .gte('transaction_date', from.slice(0, 10)).lte('transaction_date', to.slice(0, 10))
        .order('transaction_date', { ascending: false }),
      supabase.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('sort_order'),
      supabase.from('scheduled_transactions').select('*').eq('user_id', userId).eq('status', 'ACTIVO'),
      supabase.from('budgets').select('*').eq('user_id', userId).eq('year', year).eq('month', month),
      supabase.from('credit_payments').select('*').eq('user_id', userId).eq('year', year).eq('month', month),
      supabase.from('transactions').select('account_id,adjustment,type,amount,destination_account_id').eq('user_id', userId),
    ])

    const balanceMap: Record<string, number> = {}
    for (const t of allTx ?? []) {
      balanceMap[t.account_id] = (balanceMap[t.account_id] ?? 0) + Number(t.adjustment)
      if (t.type === 'TR-TRANSFER' && t.destination_account_id) {
        balanceMap[t.destination_account_id] = (balanceMap[t.destination_account_id] ?? 0) + Number(t.amount)
      }
    }

    const accountsWithBalance: AccountWithBalance[] = (accounts ?? []).map(a => ({
      ...a,
      balance: balanceMap[a.id] ?? 0,
    })) as AccountWithBalance[]

    const budget = budgets?.[0] ?? null

    setData({
      accounts: accountsWithBalance,
      transactions: (transactions ?? []) as Transaction[],
      loadedFrom: from.slice(0, 10),
      categories: (categories ?? []) as Category[],
      scheduled: (scheduled ?? []) as ScheduledTransaction[],
      budget: budget as Budget | null,
      creditPayments: (creditPayments ?? []) as CreditPayment[],
      year,
      month,
    })
    loadedRef.current = true
  }, [userId, supabase])

  // Load on first activation
  useEffect(() => {
    if (active && !loadedRef.current) load()
  }, [active, load])

  // Refresh when signal changes (pull-to-refresh or after mutation)
  useEffect(() => {
    if (refreshSignal > 0 && active) load()
  }, [refreshSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: refetch when transactions change
  useEffect(() => {
    const channel = supabase
      .channel(`dash:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, load])

  if (!data) return active ? <Skeleton /> : null

  return (
    <DashboardClient
      user={{ id: userId, email, full_name: fullName }}
      {...data}
    />
  )
}
