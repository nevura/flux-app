import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, periodEnd } from '@/lib/stripe'

const stripe = getStripe()

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Sin firma' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  // Cast to any to bypass generated Supabase types (new columns not in codegen yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const uid = session.metadata?.supabase_uid
      if (!uid || !session.subscription) break

      const sub = await stripe.subscriptions.retrieve(session.subscription as string, { expand: ['items'] })
      const patch: Record<string, unknown> = { stripe_subscription_id: sub.id, subscription_status: sub.status }
      const ends = periodEnd(sub)
      if (ends) patch.subscription_ends_at = ends
      await db.from('profiles').update(patch).eq('id', uid)

      // Apply active promotion (e.g. Fundadores: +30 days free)
      const { data: promo } = await db
        .from('promotions')
        .select('id, extra_days, used_count, max_uses')
        .eq('active', true)
        .eq('type', 'trial_extension')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (promo && promo.used_count < promo.max_uses) {
        const trialEnd = Math.floor(Date.now() / 1000) + promo.extra_days * 86400
        try {
          await stripe.subscriptions.update(sub.id, { trial_end: trialEnd })
          await db.from('promotion_uses').insert({
            promotion_id: promo.id,
            user_id: uid,
            stripe_subscription_id: sub.id,
            extra_days_granted: promo.extra_days,
          })
          // Atomic increment — only if still under limit
          await db.from('promotions')
            .update({ used_count: promo.used_count + 1 })
            .eq('id', promo.id)
            .lt('used_count', promo.max_uses)
        } catch {
          // Promo application is non-critical — don't fail the webhook
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const patch: Record<string, unknown> = { stripe_subscription_id: sub.id, subscription_status: sub.status }
      const ends = periodEnd(sub)
      if (ends) patch.subscription_ends_at = ends
      await db.from('profiles').update(patch).eq('stripe_customer_id', customerId)
      break
    }

    // Defense-in-depth for renewals: fires on every successful recurring
    // payment, independent of customer.subscription.updated, so a missed/late
    // event there doesn't leave subscription_ends_at stale (which previously
    // caused the daily cron to demote a paying subscriber to grace).
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = (invoice as unknown as { subscription?: string }).subscription
      if (!subId) break
      const sub = await stripe.subscriptions.retrieve(subId, { expand: ['items'] })
      const patch: Record<string, unknown> = { stripe_subscription_id: sub.id, subscription_status: sub.status }
      const ends = periodEnd(sub)
      if (ends) patch.subscription_ends_at = ends
      await db.from('profiles').update(patch).eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await db.from('profiles').update({
        subscription_status: 'canceled',
        stripe_subscription_id: null,
        subscription_ends_at: null,
      }).eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
