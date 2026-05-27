import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type SubscriptionStatus = 'trialing' | 'active' | 'grace' | 'expired' | 'canceled'

export interface SubscriptionInfo {
  status: SubscriptionStatus
  isReadOnly: boolean
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  daysLeft: number | null
}

export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  const hdrs = await headers()
  const status = (hdrs.get('x-subscription-status') ?? 'trialing') as SubscriptionStatus
  const trialEndsAt = hdrs.get('x-trial-ends-at')
  const subscriptionEndsAt = hdrs.get('x-subscription-ends-at')

  const isReadOnly = status === 'expired' || status === 'canceled'

  let daysLeft: number | null = null
  const endDate = subscriptionEndsAt ?? trialEndsAt
  if (endDate && (status === 'trialing' || status === 'grace')) {
    const diff = new Date(endDate).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return { status, isReadOnly, trialEndsAt, subscriptionEndsAt, daysLeft }
}

export async function requireWriteAccess(): Promise<boolean> {
  const { isReadOnly } = await getSubscriptionInfo()
  return !isReadOnly
}
