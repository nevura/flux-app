'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import SharedClient from '@/components/shared/SharedClient'
import type { Transaction, Person, Account, Category, Friendship } from '@/lib/types'

interface TabData {
  transactions: Transaction[]
  people: Person[]
  accounts: Account[]
  categories: Category[]
  friendships: Friendship[]
  baseCurrency: string
}

function Skeleton() {
  return (
    <div className="px-5 pt-6 space-y-3 animate-pulse">
      <div className="h-8 w-40 rounded-full" style={{ background: 'var(--f-bg-card)' }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-[20px]" style={{ background: 'var(--f-bg-card)' }} />
      ))}
    </div>
  )
}

interface Props {
  userId: string
  active: boolean
  refreshSignal: number
}

export default function SharedTab({ userId, active, refreshSignal }: Props) {
  const [data, setData] = useState<TabData | null>(null)
  const loadedRef = useRef(false)
  const supabase = useRef(createClient()).current

  const load = useCallback(async () => {
    const [{ data: txs }, { data: people }, { data: accs }, { data: cats }, { data: friends }, { data: profile }] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId).not('split_data', 'is', null),
      supabase.from('people').select('*, linked_profile:profiles!linked_user_id(id, username, full_name)').eq('user_id', userId),
      supabase.from('accounts').select('*').eq('user_id', userId).eq('is_active', true).order('sort_order'),
      supabase.from('categories').select('*').or(`user_id.eq.${userId},user_id.is.null`).order('sort_order'),
      supabase.from('friendships').select('*').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      supabase.from('profiles').select('currency').eq('id', userId).single(),
    ])
    setData({
      transactions: (txs ?? []) as Transaction[],
      people: (people ?? []) as Person[],
      accounts: (accs ?? []) as Account[],
      categories: (cats ?? []) as Category[],
      friendships: (friends ?? []) as Friendship[],
      baseCurrency: profile?.currency ?? 'MXN',
    })
    loadedRef.current = true
  }, [userId, supabase])

  useEffect(() => {
    if (active && !loadedRef.current) load()
  }, [active, load])

  useEffect(() => {
    if (refreshSignal > 0 && active) load()
  }, [refreshSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const channel = supabase
      .channel(`shared:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, load])

  if (!data) return active ? <Skeleton /> : null
  return <SharedClient {...data} myUserId={userId} baseCurrency={data.baseCurrency} />
}
