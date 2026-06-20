'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fluxappfinance.com'
const COOLDOWN_MS = 60_000

/**
 * Requests a password-reset email. Always returns a generic success result —
 * never reveals whether the email is registered, to avoid user enumeration.
 * Uses the admin API (not the throttled client-side resetPasswordForEmail)
 * so we can send our own branded email instead of Supabase's default one;
 * the password_reset_requests table compensates with our own cooldown.
 */
export async function requestPasswordReset(emailInput: string): Promise<{ error: null }> {
  const email = emailInput.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: null }
  }

  const admin = createAdminClient() as any

  const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString()
  const { data: recent } = await admin
    .from('password_reset_requests')
    .select('email')
    .eq('email', email)
    .gte('requested_at', cutoff)
    .limit(1)
    .maybeSingle()

  if (recent) return { error: null }

  await admin.from('password_reset_requests').insert({ email })

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${APP_URL}/auth/callback?next=/reset-password` },
    })
    if (!error && data?.properties?.action_link) {
      await sendPasswordResetEmail({ to: email, resetUrl: data.properties.action_link })
    }
  } catch {
    // Swallow — user doesn't exist or link generation failed; response stays generic
  }

  return { error: null }
}
