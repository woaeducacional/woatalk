import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ASAAS_PLANS } from '@/lib/asaas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Asaas envia o token configurado no painel em dois possíveis headers
function isValidWebhook(req: NextRequest): boolean {
  const token = process.env.ASAAS_WEBHOOK_TOKEN
  if (!token) return true // se não configurado, aceita (dev)
  const header =
    req.headers.get('asaas-access-token') ??
    req.headers.get('access_token') ??
    req.headers.get('authorization')?.replace('Bearer ', '')
  return header === token
}

// Resolve userId a partir do subscription_id do Asaas
async function findUserBySubscription(subscriptionId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .single()
  return data?.id ?? null
}

// Fallback: resolve userId a partir do externalReference (= userId salvo na criação)
async function findUserByExternalReference(externalReference: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', externalReference)
    .single()
  return data?.id ?? null
}

function resolveAuthorizationId(payload: any): string | null {
  return (
    payload?.payment?.pixAutomaticAuthorizationId ??
    payload?.payment?.authorizationId ??
    payload?.subscription?.id ??
    payload?.payment?.subscription ??
    null
  )
}

// Infere o planId a partir do valor do pagamento
function inferPlanFromValue(value?: number): string | null {
  if (!value) return null
  for (const [planId, plan] of Object.entries(ASAAS_PLANS)) {
    if (Math.abs(plan.value - value) < 0.01) return planId
  }
  return null
}

// Calcula subscription_current_period_end com base no ciclo da assinatura
function computePeriodEnd(dueDate: string, cycle: string): string {
  const d = new Date(dueDate)
  if (cycle === 'YEARLY') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString()
}

export async function POST(req: NextRequest) {
  console.log('[AsaasWebhook] ▶ Recebendo evento')

  if (!isValidWebhook(req)) {
    console.error('[AsaasWebhook] ❌ Token inválido')
    return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })
  }

  let payload: {
    event: string
    payment?: {
      id: string
      subscription?: string
      externalReference?: string
      status: string
      value?: number
      dueDate?: string
      billingType?: string
    }
    subscription?: {
      id: string
      status: string
      cycle?: string
      nextDueDate?: string
      externalReference?: string
    }
  }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { event, payment, subscription } = payload
  console.log('[AsaasWebhook] Evento:', event)

  try {
    switch (event) {
      // ── Pagamento confirmado → ativar/renovar acesso ──────────
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        const subscriptionOrPaymentId = payment?.subscription ?? payment?.id
        if (!subscriptionOrPaymentId && !payment?.externalReference) {
          console.warn('[AsaasWebhook] ⚠ Pagamento sem referência de usuário — ignorando')
          break
        }

        let userId: string | null = null
        if (subscriptionOrPaymentId) {
          userId = await findUserBySubscription(subscriptionOrPaymentId)
        }
        if (!userId && payment?.externalReference) {
          console.warn('[AsaasWebhook] ⚠ Fallback: buscando por externalReference')
          userId = await findUserByExternalReference(payment.externalReference)
        }
        if (!userId) {
          console.error('[AsaasWebhook] ❌ Usuário não encontrado para pagamento:', payment?.id ?? 'sem-id')
          break
        }

        // Busca o plano salvo no checkout para calcular o cycle correto
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_plan')
          .eq('id', userId)
          .single()

        const savedPlan = userData?.subscription_plan ?? inferPlanFromValue(payment?.value)
        const isYearly = savedPlan?.includes('yearly') ?? false
        const cycle = isYearly ? 'YEARLY' : 'MONTHLY'
        const periodEnd = computePeriodEnd(payment?.dueDate ?? new Date().toISOString().split('T')[0], cycle)

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_current_period_end: periodEnd,
            ...(payment?.subscription ? {} : { subscription_id: null }),
          })
          .eq('id', userId)

        if (error) {
          console.error('[AsaasWebhook] ❌ Erro ao ativar:', error.message)
        } else {
          console.log('[AsaasWebhook] ✅ Acesso ativado:', userId, '| plano:', savedPlan, '| até:', periodEnd)
        }

        // Credit affiliate sale if this is a first-time activation (status was inactive)
        if (!error && userData?.subscription_plan) {
          const { data: fullUser } = await supabase
            .from('users')
            .select('affiliate_code')
            .eq('id', userId)
            .single()
          if (fullUser?.affiliate_code) {
            const col = savedPlan?.includes('premium') ? 'premium_sales' : 'starter_sales'
            const { data: affRow } = await supabase
              .from('affiliates')
              .select('id, starter_sales, premium_sales')
              .eq('code', fullUser.affiliate_code)
              .maybeSingle()
            if (affRow) {
              await supabase
                .from('affiliates')
                .update({ [col]: (affRow[col as 'starter_sales' | 'premium_sales'] ?? 0) + 1 })
                .eq('id', affRow.id)
              // Clear affiliate_code so renewals don't double-count
              await supabase.from('users').update({ affiliate_code: null }).eq('id', userId)
              console.log(`[AsaasWebhook] ✅ Venda creditada ao afiliado ${fullUser.affiliate_code} (${col})`)
            }
          }
        }
        break
      }

      case 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CREATED': {
        const authId = resolveAuthorizationId(payload)
        if (!authId) break

        let userId = await findUserBySubscription(authId)
        if (!userId && payload?.payment?.externalReference) {
          console.warn('[AsaasWebhook] ⚠ Fallback: buscando por externalReference')
          userId = await findUserByExternalReference(payload.payment.externalReference)
          if (userId) {
            console.log('[AsaasWebhook] ✅ Usuário encontrado por externalReference para autorização automática:', userId)
          }
        }

        console.log('[AsaasWebhook] ✅ Autorização Pix Automático criada:', authId)
        break
      }

      case 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED': {
        const authId = resolveAuthorizationId(payload)
        if (!authId) break

        let userId = await findUserBySubscription(authId)
        if (!userId && payload?.payment?.externalReference) {
          console.warn('[AsaasWebhook] ⚠ Fallback: buscando por externalReference')
          userId = await findUserByExternalReference(payload.payment.externalReference)
        }
        if (!userId) {
          console.error('[AsaasWebhook] ❌ Usuário não encontrado para autorização Pix Automático:', authId)
          break
        }

        const { data: userData } = await supabase
          .from('users')
          .select('subscription_plan')
          .eq('id', userId)
          .single()

        const savedPlan = userData?.subscription_plan ?? inferPlanFromValue(payload?.payment?.value)
        const isYearly = savedPlan?.includes('yearly') ?? false
        const cycle = isYearly ? 'YEARLY' : 'MONTHLY'
        const periodEnd = computePeriodEnd(payload?.payment?.dueDate ?? new Date().toISOString().split('T')[0], cycle)

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_current_period_end: periodEnd,
          })
          .eq('id', userId)

        if (error) {
          console.error('[AsaasWebhook] ❌ Erro ao ativar Pix Automático:', error.message)
        } else {
          console.log('[AsaasWebhook] ✅ Pix Automático ativado:', userId, '| plano:', savedPlan, '| até:', periodEnd)
        }
        break
      }

      case 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REVOKED': {
        const authId = resolveAuthorizationId(payload)
        if (!authId) break

        const userId = await findUserBySubscription(authId)
        if (!userId) break

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'inactive',
            subscription_id: null,
            subscription_plan: null,
            subscription_current_period_end: null,
          })
          .eq('id', userId)

        if (error) {
          console.error('[AsaasWebhook] ❌ Erro ao revogar Pix Automático:', error.message)
        } else {
          console.log('[AsaasWebhook] ✅ Autorização Pix Automático revogada no DB:', userId)
        }
        break
      }

      // ── Pagamento em atraso ────────────────────────────────────
      case 'PAYMENT_OVERDUE': {
        const subId = payment?.subscription
        if (!subId) break

        const userId = await findUserBySubscription(subId)
        if (!userId) break

        const { error } = await supabase
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId)

        if (error) {
          console.error('[AsaasWebhook] ❌ Erro ao marcar past_due:', error.message)
        } else {
          console.log('[AsaasWebhook] ⚠ Usuário marcado como past_due:', userId)
        }
        break
      }

      // ── Assinatura deletada/inativada → suspender acesso ──────
      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED': {
        const subId = subscription?.id ?? payment?.subscription
        if (!subId) break

        const userId = await findUserBySubscription(subId)
        if (!userId) break

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'inactive',
            subscription_id: null,
            subscription_plan: null,
            subscription_current_period_end: null,
          })
          .eq('id', userId)

        if (error) {
          console.error('[AsaasWebhook] ❌ Erro ao cancelar:', error.message)
        } else {
          console.log('[AsaasWebhook] ✅ Assinatura cancelada no DB:', userId)
        }
        break
      }

      // ── Pix Automático: autorização aprovada → ativar ─────────
      case 'PIX_TRANSACTION_APPROVED': {
        const subId = payment?.subscription
        if (!subId) break

        const userId = await findUserBySubscription(subId)
        if (!userId) break

        const { data: pixUserData } = await supabase
          .from('users')
          .select('subscription_plan, subscription_status')
          .eq('id', userId)
          .single()

        // Se o usuário está em trial, a autorização do PIX foi para a assinatura futura.
        // O acesso já está liberado via status 'trial'; PAYMENT_CONFIRMED ativará 'active' em 30 dias.
        if (pixUserData?.subscription_status === 'trial') {
          console.log('[AsaasWebhook] PIX autorizado para assinatura em trial — mantendo status trial:', userId)
          break
        }

        const savedPlan = pixUserData?.subscription_plan ?? inferPlanFromValue(payment?.value)
        const isYearly = savedPlan?.includes('yearly') ?? false
        const cycle = isYearly ? 'YEARLY' : 'MONTHLY'
        const periodEnd = computePeriodEnd(payment?.dueDate ?? new Date().toISOString().split('T')[0], cycle)

        await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_current_period_end: periodEnd,
          })
          .eq('id', userId)

        console.log('[AsaasWebhook] ✅ Pix Automático autorizado:', userId, '| plano:', savedPlan)
        break
      }

      // ── Pagamento deletado ─────────────────────────────────────
      case 'PAYMENT_DELETED': {
        const subId = payment?.subscription
        if (!subId) break
        // Só suspende se não houver outra cobrança ativa — tratado via SUBSCRIPTION_DELETED
        console.log('[AsaasWebhook] Pagamento deletado (subscription:', subId, ') — aguardando SUBSCRIPTION_DELETED se necessário')
        break
      }

      default:
        console.log('[AsaasWebhook] Evento ignorado:', event)
    }
  } catch (err) {
    console.error('[AsaasWebhook] ❌ Erro inesperado:', err)
  }

  return NextResponse.json({ received: true })
}
