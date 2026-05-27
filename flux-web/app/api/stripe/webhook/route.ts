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
