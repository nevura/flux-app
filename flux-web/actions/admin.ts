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
  stripe_customer_id: string | null
  trial_ends_at: string | null
  subscription_ends_at: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
  tx_count: number
  acc_count: number
}

export interface SupportTicket {
  id: string
  user_id: string
  message: string
  admin_reply: string | null
  is_read: boolean
  created_at: string
  replied_at: string | null
  user_email?: string | null
  user_name?: string | null
}

export async function getAdminProfiles(): Promise<AdminProfile[]> {
  await verifyAdmin()
  const admin = createAdminClient()

  const [{ data: profiles }, { data: txData }, { data: accData }] = await Promise.all([
    (admin.from('profiles') as any).select('id, email, full_name, username, phone, status, subscription_status, stripe_customer_id, trial_ends_at, subscription_ends_at, onboarding_completed, created_at, updated_at').order('created_at', { ascending: false }),
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

// ── Support tickets ───────────────────────────────────────────────────────────

export async function sendSupportMessage(message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }
  const { error } = await supabase.from('support_tickets' as any).insert({ user_id: user.id, message })
  if (error) return { error: error.message }
  return { error: null }
}

export async function getMyTickets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await (supabase.from('support_tickets' as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20))
  return (data ?? []) as SupportTicket[]
}

export async function getAdminTickets(): Promise<SupportTicket[]> {
  await verifyAdmin()
  const admin = createAdminClient()
  const { data: tickets } = await (admin.from('support_tickets') as any)
    .select('*, profiles(email, full_name)')
    .order('is_read', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(100)

  return (tickets ?? []).map((t: any) => ({
    ...t,
    user_email: t.profiles?.email ?? null,
    user_name: t.profiles?.full_name ?? null,
    profiles: undefined,
  })) as SupportTicket[]
}

export async function replyToTicket(ticketId: string, reply: string) {
  await verifyAdmin()
  const admin = createAdminClient()
  const { error } = await (admin.from('support_tickets') as any)
    .update({ admin_reply: reply, is_read: true, replied_at: new Date().toISOString() })
    .eq('id', ticketId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function markTicketRead(ticketId: string) {
  await verifyAdmin()
  const admin = createAdminClient()
  await (admin.from('support_tickets') as any).update({ is_read: true }).eq('id', ticketId)
  revalidatePath('/admin')
}
