import Stripe from 'stripe'

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  return _stripe
}

/**
 * Newer Stripe API versions moved current_period_end off the subscription
 * object onto its first item — sub.current_period_end is null there, so
 * reading it directly silently falls through to billing_cycle_anchor (the
 * subscription's original start date, not its period end) and produces a
 * stale/wrong date. Read the item-level field first.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function periodEnd(sub: any): string | null {
  const ts = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null
  return ts ? new Date(Number(ts) * 1000).toISOString() : null
}

/**
 * Maps Stripe's own subscription status onto our app's profiles.subscription_status
 * values. Crucial: Stripe's 'trialing' (e.g. a promo-extended trial_end on an
 * already-converted, paying customer's subscription) must NOT be written
 * through as our app's 'trialing' — that value means "never paid, in the
 * app's own free trial" and is swept up by the daily cron's trial-expiry
 * logic, which would incorrectly expire a real paying customer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapStripeStatus(stripeStatus: string): string {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active'
  if (stripeStatus === 'incomplete_expired') return 'canceled'
  return stripeStatus // past_due | unpaid | incomplete | canceled | paused — pass through
}
