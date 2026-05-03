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
  console.log('[Checkout] ▶ Iniciando criação de sessão de checkout')

  const session = await getServerSession(authOptions)
  console.log('[Checkout] Sessão do usuário:', session?.user?.id ?? 'NÃO AUTENTICADO', '| email:', session?.user?.email)

  if (!session?.user?.id) {
    console.error('[Checkout] ❌ Usuário não autenticado')
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  console.log('[Checkout] STRIPE_PREMIUM_PRICE_ID:', process.env.STRIPE_PREMIUM_PRICE_ID)
  if (!process.env.STRIPE_PREMIUM_PRICE_ID || process.env.STRIPE_PREMIUM_PRICE_ID === 'price_PLACEHOLDER') {
    console.error('[Checkout] ❌ STRIPE_PREMIUM_PRICE_ID não configurado')
    return NextResponse.json({ error: 'Stripe não configurado ainda' }, { status: 503 })
  }

  const userId = session.user.id
  const userEmail = session.user.email!
  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3003').replace(/\/$/, '')
  console.log('[Checkout] userId:', userId, '| baseUrl:', baseUrl)

  // Buscar ou criar Stripe customer
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_status')
    .eq('id', userId)
    .single()

  console.log('[Checkout] Dados do usuário no DB:', JSON.stringify(user), '| erro:', userError?.message)

  let customerId = user?.stripe_customer_id

  if (!customerId) {
    console.log('[Checkout] Criando novo Stripe customer para:', userEmail)
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    })
    customerId = customer.id
    console.log('[Checkout] Stripe customer criado:', customerId)

    const { error: saveError } = await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)

    if (saveError) {
      console.error('[Checkout] ❌ Erro ao salvar stripe_customer_id:', saveError)
    } else {
      console.log('[Checkout] ✅ stripe_customer_id salvo no DB')
    }
  } else {
    console.log('[Checkout] Customer existente:', customerId)
  }

  let checkoutSession
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
      },
      success_url: `${baseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/premium/cancel`,
      locale: 'pt-BR',
      metadata: { userId },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Checkout] ❌ Erro ao criar sessão Stripe:', message)

    // Customer do ambiente de teste — criar novo no live e tentar de novo
    if (message.includes('No such customer')) {
      console.log('[Checkout] Customer inválido (ambiente antigo). Criando novo customer live...')
      const newCustomer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      })
      customerId = newCustomer.id
      console.log('[Checkout] Novo customer criado:', customerId)

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      try {
        checkoutSession = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
          subscription_data: {
            trial_period_days: 30,
          },
          success_url: `${baseUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/premium/cancel`,
          locale: 'pt-BR',
          metadata: { userId },
        })
      } catch (retryErr: unknown) {
        const retryMessage = retryErr instanceof Error ? retryErr.message : String(retryErr)
        console.error('[Checkout] ❌ Erro na segunda tentativa:', retryMessage)
        return NextResponse.json({ error: retryMessage }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  console.log('[Checkout] ✅ Sessão criada:', checkoutSession.id, '| url:', checkoutSession.url)
  return NextResponse.json({ url: checkoutSession.url })
}
