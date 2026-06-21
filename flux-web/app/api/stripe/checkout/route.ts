import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const VALID_PRICES = [
  process.env.STRIPE_PRICE_MONTHLY!,
  process.env.STRIPE_PRICE_YEARLY!,
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { priceId } = await req.json()
  if (!priceId || !VALID_PRICES.includes(priceId)) {
    return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id, subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      metadata: { supabase_uid: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  // Honor whatever's left of the app's own free trial — Stripe shouldn't
  // charge a user who converts mid-trial; it should wait until the native
  // trial would've ended anyway. Only 'trialing' counts (grace/expired users
  // already had their trial run out, so they pay immediately).
  let nativeDays = 0
  if (profile?.subscription_status === 'trialing' && profile.trial_ends_at) {
    const msLeft = new Date(profile.trial_ends_at).getTime() - Date.now()
    const daysLeft = Math.ceil(msLeft / 86_400_000)
    if (daysLeft >= 1) nativeDays = daysLeft
  }

  // Stack an eligible promo on top of the native trial days (e.g. 10 native
  // days left + 30-day promo = 40-day Stripe trial) instead of granting it
  // after the fact via a post-charge trial_end update, which creates
  // proration noise on an already-billed subscription.
  const admin = createAdminClient() as any
  let promoId: string | undefined
  let promoDays = 0
  const { data: promo } = await admin
    .from('promotions')
    .select('id, extra_days, used_count, max_uses')
    .eq('active', true)
    .eq('type', 'trial_extension')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (promo && promo.used_count < promo.max_uses) {
    const { data: existingUse } = await admin
      .from('promotion_uses')
      .select('id')
      .eq('promotion_id', promo.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!existingUse) {
      promoId = promo.id
      promoDays = promo.extra_days
    }
  }

  const totalTrialDays = nativeDays + promoDays

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    subscription_data: totalTrialDays >= 1 ? { trial_period_days: totalTrialDays } : undefined,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: {
      supabase_uid: user.id,
      ...(promoId ? { promo_id: promoId, promo_days: String(promoDays) } : {}),
    },
  })

  return NextResponse.json({ url: session.url })
}
