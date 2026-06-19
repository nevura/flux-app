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
