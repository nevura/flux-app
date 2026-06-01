'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'bernardo.perezro06@gmail.com'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('No autorizado')
  return user
}

export interface AdminProfile {
  id: string
  email: string | null
  full_name: string | null
  username: string | null
  phone: string | null
  status: 'pending' | 'approved' | 'rejected'
  subscription_status: string
  trial_ends_at: string | null
  subscription_ends_at: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
  tx_count: number
  acc_count: number
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  await verifyAdmin()
  const admin = createAdminClient()

  const [{ data: profiles }, { data: txData }, { data: accData }] = await Promise.all([
    (admin.from('profiles') as any).select('id, email, full_name, username, phone, status, subscription_status, trial_ends_at, subscription_ends_at, onboarding_completed, created_at, updated_at').order('created_at', { ascending: false }),
    (admin.from('transactions') as any).select('user_id'),
    (admin.from('accounts') as any).select('user_id, is_active'),
  ])

  const txMap: Record<string, number> = {}
  for (const t of txData ?? []) txMap[t.user_id] = (txMap[t.user_id] ?? 0) + 1

  const accMap: Record<string, number> = {}
  for (const a of accData ?? []) {
    if (a.is_active) accMap[a.user_id] = (accMap[a.user_id] ?? 0) + 1
  }

  return (profiles ?? []).map((p: any) => ({
    ...p,
    tx_count: txMap[p.id] ?? 0,
    acc_count: accMap[p.id] ?? 0,
  })) as AdminProfile[]
}

export async function setUserAccountStatus(userId: string, status: 'approved' | 'rejected') {
  await verifyAdmin()
  const admin = createAdminClient()
  const { error } = await (admin.from('profiles') as any).update({ status }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function extendUserTrial(userId: string, days: number) {
  await verifyAdmin()
  const admin = createAdminClient()

  const { data: profile } = await (admin.from('profiles') as any)
    .select('trial_ends_at').eq('id', userId).single()

  const base = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()
    ? new Date(profile.trial_ends_at)
    : new Date()
  base.setDate(base.getDate() + days)

  const { error } = await (admin.from('profiles') as any)
    .update({ trial_ends_at: base.toISOString(), subscription_status: 'trialing' })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function setUserSubscriptionStatus(userId: string, status: string) {
  await verifyAdmin()
  const admin = createAdminClient()
  const { error } = await (admin.from('profiles') as any)
    .update({ subscription_status: status })
    .eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}
