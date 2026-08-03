// Server-only. Centralizes notification delivery so every notification type
// gets all 3 channels for free: bell + toast (via the existing Supabase
// Realtime INSERT subscription in NotificationBell.tsx — no extra code
// needed here) and an instant email (dedicated template if provided, else a
// generic fallback built from the same copy the bell/toast show).
import { createAdminClient } from '@/lib/supabase/admin'
import { notifLabel } from '@/lib/notificationCopy'
import { sendGenericNotificationEmail } from '@/lib/email'
import type { NotificationType } from '@/lib/types'

export async function notify(opts: {
  userId: string
  type: NotificationType
  data: Record<string, unknown>
  to?: string | null            // recipient email; omit/null to skip email entirely
  email?: () => Promise<void>   // dedicated branded template, if one exists for this type
}) {
  const admin = createAdminClient() as any
  await admin.from('notifications').insert({ user_id: opts.userId, type: opts.type, data: opts.data })

  if (!opts.to) return
  if (opts.email) {
    opts.email().catch(() => {})
    return
  }
  const { text } = notifLabel(opts.type, opts.data)
  sendGenericNotificationEmail({ to: opts.to, subject: text, text }).catch(() => {})
}

// Shared "already notified today" check, keyed by user_id:type:source_id so it
// works both for a single authenticated user (actions/notifications.ts) and
// across all users at once (the cron route) without double-inserting a bell
// notification for the same event from both paths.
export async function fetchExistingSourceKeys(
  client: any,
  types: NotificationType[],
  sinceISO: string,
  userId?: string,
): Promise<Set<string>> {
  let q = client.from('notifications').select('user_id, type, data').in('type', types).gte('created_at', sinceISO)
  if (userId) q = q.eq('user_id', userId)
  const { data } = await q
  return new Set((data ?? []).map((n: any) => `${n.user_id}:${n.type}:${(n.data as any)?.source_id}`))
}
