import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { stripe } from '@/src/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  if (!process.env.STRIPE_PREMIUM_PRICE_ID || process.env.STRIPE_PREMIUM_PRICE_ID === 'price_PLACEHOLDER') {
    return NextResponse.json({ error: 'Stripe não configurado ainda' }, { status: 503 })
  }

  const userId = session.user.id
  const userEmail = session.user.email!
  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3003').replace(/\/$/, '')

  // Buscar ou criar Stripe customer
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_status')
    .eq('id', userId)
    .single()

  let customerId = user?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    })
    customerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/premium/cancel`,
    locale: 'pt-BR',
    metadata: { userId },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
