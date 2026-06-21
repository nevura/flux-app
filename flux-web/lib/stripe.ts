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
