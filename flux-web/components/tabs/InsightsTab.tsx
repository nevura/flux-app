'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { monthRange } from '@/lib/utils'
import InsightsClient from '@/components/insights/InsightsClient'
import type { Transaction, Category } from '@/lib/types'

interface MonthlyRow { year: number; month: number; income: number; expenses: number }

interface TabData {
  transactions: Transaction[]
  categories: Category[]
  monthlySummary: MonthlyRow[]
  year: number
  month: number
}

function Skeleton() {
  return (
    <div className="px-5 pt-6 space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-full" style={{ background: 'var(--f-bg-card)' }} />
      <div className="h-52 rounded-[20px]" style={{ background: 'var(--f-bg-card)' }} />
      <div className="h-36 rounded-[20px]" style={{ background: 'var(--f-bg-card)' }} />
    </div>
  )
}

interface Props {
  userId: string
  active: boolean
  refreshSignal: number
}

export default function InsightsTab({ userId, active, refreshSignal }: Props) {
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
    const [{ data: txs }, { data: cats }, { data: allTx }] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId)
        .gte('transaction_date', from.slice(0, 10)).lte('transaction_date', to.slice(0, 10))
        .order('transaction_date', { ascending: false }),
      supabase.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('sort_order'),
      supabase.from('transactions')
        .select('type, amount, transaction_date, exclude_mode, split_data')
        .eq('user_id', userId)
        .neq('type', 'TR-TRANSFER'),
    ])

    function effectiveAmt(t: { type: string; amount: number; exclude_mode?: string | null; split_data?: { data: { value: number }[] } | null }): number {
      if (t.exclude_mode === 'all') return 0
      if (t.exclude_mode === 'shared_only' && t.split_data?.data) {
        const othersTotal = t.split_data.data.reduce((s, d) => s + d.value, 0)
        return Math.max(0, Number(t.amount) - othersTotal)
      }
      return Number(t.amount)
    }

    const monthMap: Record<string, MonthlyRow> = {}
    for (const t of allTx ?? []) {
      const d = new Date(t.transaction_date)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`
      if (!monthMap[key]) monthMap[key] = { year: d.getFullYear(), month: d.getMonth() + 1, income: 0, expenses: 0 }
      const eff = effectiveAmt(t)
      if (t.type === 'TR-INGRESO') monthMap[key].income   += eff
      else                         monthMap[key].expenses += eff
    }
    const monthlySummary = Object.values(monthMap).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month,
    )

    setData({
      transactions: (txs ?? []) as Transaction[],
      categories: (cats ?? []) as Category[],
      monthlySummary,
      year: y,
      month: m,
    })
    loadedRef.current = true
  }, [userId, supabase])

  useEffect(() => {
    if (active && !loadedRef.current) load(year, month)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loadedRef.current) {
      setData(null)
      load(year, month)
    }
  }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (refreshSignal > 0 && active) load(year, month)
  }, [refreshSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const channel = supabase
      .channel(`insights:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => {
        load(year, month)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, year, month, supabase, load])

  if (!data) return active ? <Skeleton /> : null
  return <InsightsClient {...data} />
}
