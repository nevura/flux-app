import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function periodEnd(sub: any): string | null {
  const ts = sub.current_period_end ?? sub.billing_cycle_anchor ?? null
  return ts ? new Date(Number(ts) * 1000).toISOString() : null
}

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

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      await db.from('profiles').update({
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
        subscription_ends_at: periodEnd(sub),
      }).eq('id', uid)

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
      await db.from('profiles').update({
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
        subscription_ends_at: periodEnd(sub),
      }).eq('stripe_customer_id', customerId)
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
