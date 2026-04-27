import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/src/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Next.js app router reads body as stream — raw body required for Stripe signature verification
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Sem assinatura Stripe' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[Webhook] Assinatura inválida:', message)
    return NextResponse.json({ error: `Webhook inválido: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const userId = session.metadata?.userId
        if (!userId) break
        await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_id: session.subscription as string,
          })
          .eq('id', userId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // In Stripe v22+, invoice.subscription is accessed via lines or parent
        const subId = (invoice as unknown as { subscription?: string }).subscription
        if (!subId) break

        const sub = await stripe.subscriptions.retrieve(subId)
        const userId = sub.metadata?.userId
          ?? (await supabase.from('users').select('id').eq('subscription_id', subId).single()).data?.id
        if (!userId) break

        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
        await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
          ?? (await supabase.from('users').select('id').eq('subscription_id', sub.id).single()).data?.id
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_status: 'inactive',
              subscription_id: null,
              subscription_current_period_end: null,
            })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
          ?? (await supabase.from('users').select('id').eq('subscription_id', sub.id).single()).data?.id
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
        if (userId) {
          await supabase
            .from('users')
            .update({
              subscription_status: sub.status === 'active' ? 'active' : 'inactive',
              subscription_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            })
            .eq('id', userId)
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[Webhook] Erro ao processar evento:', err)
    // Retorna 200 de qualquer forma para Stripe não retentar desnecessariamente
  }

  return NextResponse.json({ received: true })
}
