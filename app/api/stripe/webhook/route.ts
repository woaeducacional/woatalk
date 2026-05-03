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
  console.log('[Webhook] ▶ Recebendo requisição')
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  console.log('[Webhook] Stripe-Signature presente:', !!sig)
  console.log('[Webhook] STRIPE_WEBHOOK_SECRET configurado:', !!process.env.STRIPE_WEBHOOK_SECRET)
  console.log('[Webhook] Tamanho do body:', body.length)

  if (!sig) {
    console.error('[Webhook] ❌ Header stripe-signature ausente')
    return NextResponse.json({ error: 'Sem assinatura Stripe' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log('[Webhook] ✅ Evento verificado:', event.type, '| ID:', event.id)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[Webhook] ❌ Assinatura inválida:', message)
    return NextResponse.json({ error: `Webhook inválido: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[Webhook] checkout.session.completed | mode:', session.mode, '| sessionId:', session.id)
        console.log('[Webhook] metadata:', JSON.stringify(session.metadata))
        console.log('[Webhook] subscription:', session.subscription)

        if (session.mode !== 'subscription') {
          console.warn('[Webhook] ⚠ Ignorando — modo não é subscription:', session.mode)
          break
        }
        const userId = session.metadata?.userId
        if (!userId) {
          console.error('[Webhook] ❌ userId ausente no metadata da session')
          break
        }

        // Fetch subscription to get real status (may be 'trialing' or 'active')
        let subStatus = 'active'
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          subStatus = ['active', 'trialing'].includes(sub.status) ? 'active' : 'inactive'
          console.log('[Webhook] Subscription status real:', sub.status, '→ mapeado para:', subStatus)
        }

        console.log('[Webhook] Atualizando usuário:', userId, '→ subscription_status=', subStatus, ', subscription_id=', session.subscription)
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: subStatus,
            subscription_id: session.subscription as string,
          })
          .eq('id', userId)
          .select()

        if (updateError) {
          console.error('[Webhook] ❌ Erro ao atualizar users (checkout.session.completed):', updateError)
        } else {
          console.log('[Webhook] ✅ Users atualizado com sucesso. Linhas afetadas:', updateData?.length, JSON.stringify(updateData))
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as unknown as { subscription?: string }).subscription
        console.log('[Webhook] invoice.payment_succeeded | invoiceId:', invoice.id, '| subId:', subId)

        if (!subId) {
          console.warn('[Webhook] ⚠ invoice sem subscription ID')
          break
        }

        const sub = await stripe.subscriptions.retrieve(subId)
        console.log('[Webhook] Subscription recuperada | status:', sub.status, '| metadata:', JSON.stringify(sub.metadata))

        const dbLookup = await supabase.from('users').select('id').eq('subscription_id', subId).single()
        console.log('[Webhook] Lookup por subscription_id no DB:', JSON.stringify(dbLookup.data), '| erro:', dbLookup.error?.message)

        const userId = sub.metadata?.userId ?? dbLookup.data?.id
        if (!userId) {
          console.error('[Webhook] ❌ userId não encontrado para invoice.payment_succeeded | subId:', subId)
          break
        }

        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
        console.log('[Webhook] Atualizando usuário:', userId, '| periodEnd:', periodEnd)

        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq('id', userId)
          .select()

        if (updateError) {
          console.error('[Webhook] ❌ Erro ao atualizar users (invoice.payment_succeeded):', updateError)
        } else {
          console.log('[Webhook] ✅ Users atualizado (invoice). Linhas:', updateData?.length, JSON.stringify(updateData))
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        console.log('[Webhook] customer.subscription.deleted | subId:', sub.id, '| metadata:', JSON.stringify(sub.metadata))

        const dbLookup = await supabase.from('users').select('id').eq('subscription_id', sub.id).single()
        const userId = sub.metadata?.userId ?? dbLookup.data?.id

        console.log('[Webhook] userId para deletar subscription:', userId)

        if (userId) {
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({
              subscription_status: 'inactive',
              subscription_id: null,
              subscription_current_period_end: null,
            })
            .eq('id', userId)
            .select()

          if (updateError) {
            console.error('[Webhook] ❌ Erro ao atualizar users (subscription.deleted):', updateError)
          } else {
            console.log('[Webhook] ✅ Subscription cancelada no DB. Linhas:', updateData?.length)
          }
        } else {
          console.error('[Webhook] ❌ userId não encontrado para subscription.deleted | subId:', sub.id)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        console.log('[Webhook] customer.subscription.updated | subId:', sub.id, '| status:', sub.status, '| metadata:', JSON.stringify(sub.metadata))

        const dbLookup = await supabase.from('users').select('id').eq('subscription_id', sub.id).single()
        const userId = sub.metadata?.userId ?? dbLookup.data?.id
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end

        console.log('[Webhook] userId:', userId, '| periodEnd:', periodEnd)

        if (userId) {
          const newStatus = ['active', 'trialing'].includes(sub.status) ? 'active' : 'inactive'
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({
              subscription_status: newStatus,
              subscription_current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            })
            .eq('id', userId)
            .select()

          if (updateError) {
            console.error('[Webhook] ❌ Erro ao atualizar users (subscription.updated):', updateError)
          } else {
            console.log('[Webhook] ✅ Subscription atualizada. Linhas:', updateData?.length, '| novo status:', newStatus)
          }
        } else {
          console.error('[Webhook] ❌ userId não encontrado para subscription.updated | subId:', sub.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as unknown as { subscription?: string }).subscription
        console.log('[Webhook] invoice.payment_failed | invoiceId:', invoice.id, '| subId:', subId)

        if (!subId) break

        const dbLookup = await supabase.from('users').select('id').eq('subscription_id', subId).single()
        const sub = await stripe.subscriptions.retrieve(subId)
        const userId = sub.metadata?.userId ?? dbLookup.data?.id

        if (userId) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ subscription_status: 'past_due' })
            .eq('id', userId)

          if (updateError) {
            console.error('[Webhook] ❌ Erro ao atualizar users (invoice.payment_failed):', updateError)
          } else {
            console.log('[Webhook] ✅ Usuário marcado como past_due:', userId)
          }
        } else {
          console.error('[Webhook] ❌ userId não encontrado para invoice.payment_failed | subId:', subId)
        }
        break
      }

      default:
        console.log('[Webhook] Evento ignorado:', event.type)
        break
    }
  } catch (err) {
    console.error('[Webhook] ❌ Erro inesperado ao processar evento:', err)
    // Retorna 200 de qualquer forma para Stripe não retentar desnecessariamente
  }

  return NextResponse.json({ received: true })
}
