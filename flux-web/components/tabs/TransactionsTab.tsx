'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { monthRange } from '@/lib/utils'
import TransactionsClient from '@/components/transactions/TransactionsClient'
import type { Transaction, Category, AccountWithBalance, Person } from '@/lib/types'

interface TabData {
  transactions: Transaction[]
  categories: Category[]
  accounts: AccountWithBalance[]
  people: Person[]
  year: number
  month: number
}

function Skeleton() {
  return (
    <div className="px-5 pt-6 space-y-3 animate-pulse">
      <div className="h-10 rounded-[14px]" style={{ background: 'var(--f-bg-card)' }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 rounded-[16px]" style={{ background: 'var(--f-bg-card)' }} />
      ))}
    </div>
  )
}

interface Props {
  userId: string
  active: boolean
  refreshSignal: number
}

export default function TransactionsTab({ userId, active, refreshSignal }: Props) {
  const [data, setData] = useState<TabData | null>(null)
  const loadedRef = useRef(false)
  const supabase = useRef(createClient()).current
  const searchParams = useSearchParams()

  const yearParam  = searchParams.get('year')
  const monthParam = searchParams.get('month')
  const now = new Date()
  const year  = yearParam  ? parseInt(yearParam)  : now.getFullYear()
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

  const load = useCallback(async (y: number, m: number) => {
    const { from, to } = monthRange(y, m)
    const [{ data: txs }, { data: pendingAll }, { data: cats }, { data: accs }, { data: people }] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId)
        .gte('transaction_date', from.slice(0, 10)).lte('transaction_date', to.slice(0, 10))
        .order('transaction_date', { ascending: false }),
      // Always fetch ALL unvalidated transactions regardless of month
      supabase.from('transactions').select('*').eq('user_id', userId)
        .eq('is_validated', false)
        .order('transaction_date', { ascending: false }),
      supabase.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('sort_order'),
      supabase.from('accounts').select('*').eq('user_id', userId).eq('is_active', true).order('sort_order'),
      supabase.from('people').select('*').eq('user_id', userId),
    ])
    // Merge pending from other months (dedup by id)
    const monthlyTxs = (txs ?? []) as Transaction[]
    const ids = new Set(monthlyTxs.map(t => t.id))
    const extraPending = ((pendingAll ?? []) as Transaction[]).filter(t => !ids.has(t.id))
    setData({
      transactions: [...monthlyTxs, ...extraPending],
      categories: (cats ?? []) as Category[],
      accounts: (accs ?? []) as AccountWithBalance[],
      people: (people ?? []) as Person[],
      year: y,
      month: m,
    })
    loadedRef.current = true
  }, [userId, supabase])

  // Load on first activation
  useEffect(() => {
    if (active && !loadedRef.current) load(year, month)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when month/year URL params change (from month nav inside TransactionsClient)
  useEffect(() => {
    if (loadedRef.current) load(year, month)
  }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh signal (pull-to-refresh)
  useEffect(() => {
    if (refreshSignal > 0 && active) load(year, month)
  }, [refreshSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: refetch when transactions change
  useEffect(() => {
    const channel = supabase
      .channel(`txlist:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => {
        load(year, month)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, year, month, supabase, load])

  if (!data) return active ? <Skeleton /> : null

  return (
    <TransactionsClient
      initialTransactions={data.transactions}
      categories={data.categories}
      accounts={data.accounts}
      people={data.people}
      year={data.year}
      month={data.month}
    />
  )
}
