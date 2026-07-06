import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import {
  ASAAS_PLANS,
  AsaasBillingType,
  AsaasPlanId,
  createCustomer,
  createSubscription,
  findCustomerByCpf,
  getFirstPendingPayment,
  getNextDueDate,
} from '@/lib/asaas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  console.log('[AsaasCheckout] ▶ Iniciando checkout')

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { planId, billingType, cpf, phone } = body as {
    planId: AsaasPlanId
    billingType: AsaasBillingType
    cpf: string
    phone?: string
  }

  if (!planId || !billingType || !cpf) {
    return NextResponse.json({ error: 'planId, billingType e cpf são obrigatórios' }, { status: 400 })
  }

  const plan = ASAAS_PLANS[planId]
  if (!plan) {
    return NextResponse.json({ error: `Plano inválido: ${planId}` }, { status: 400 })
  }

  const cpfClean = cpf.replace(/\D/g, '')
  if (cpfClean.length !== 11 && cpfClean.length !== 14) {
    return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 })
  }

  const userId = session.user.id
  const userEmail = session.user.email!
  const userName = session.user.name ?? userEmail

  // Busca dados do usuário no DB
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('asaas_customer_id, subscription_status, subscription_id')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('[AsaasCheckout] ❌ Erro ao buscar usuário:', userError.message)
    return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 })
  }

  // Resolve ou cria o customer Asaas
  let asaasCustomerId = user?.asaas_customer_id as string | undefined

  if (!asaasCustomerId) {
    console.log('[AsaasCheckout] Procurando customer por CPF:', cpfClean)
    const existing = await findCustomerByCpf(cpfClean).catch(() => null)

    if (existing) {
      asaasCustomerId = existing.id
      console.log('[AsaasCheckout] Customer existente encontrado:', asaasCustomerId)
    } else {
      console.log('[AsaasCheckout] Criando novo customer Asaas para:', userEmail)
      const customer = await createCustomer({
        name: userName,
        email: userEmail,
        cpfCnpj: cpfClean,
        phone,
      })
      asaasCustomerId = customer.id
      console.log('[AsaasCheckout] Customer criado:', asaasCustomerId)
    }

    await supabase.from('users').update({ asaas_customer_id: asaasCustomerId }).eq('id', userId)
  }

  // Cria a assinatura no Asaas
  let subscription
  try {
    subscription = await createSubscription({
      customer: asaasCustomerId,
      billingType,
      value: plan.value,
      nextDueDate: getNextDueDate(),
      cycle: plan.cycle,
      description: `WOA Talk — ${plan.label}`,
    })
    console.log('[AsaasCheckout] ✅ Assinatura criada:', subscription.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[AsaasCheckout] ❌ Erro ao criar assinatura:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Salva subscription_id e plano no DB (status ficará 'inactive' até webhook confirmar)
  await supabase
    .from('users')
    .update({
      subscription_id: subscription.id,
      subscription_plan: planId,
      subscription_status: 'inactive',
    })
    .eq('id', userId)

  // Busca a primeira cobrança gerada para obter a URL de pagamento
  const payment = await getFirstPendingPayment(subscription.id)
  console.log('[AsaasCheckout] Primeira cobrança:', payment?.id, '| invoiceUrl:', payment?.invoiceUrl)

  const redirectUrl =
    payment?.invoiceUrl ??
    subscription.paymentLink ??
    null

  if (!redirectUrl) {
    console.error('[AsaasCheckout] ❌ URL de pagamento não encontrada')
    return NextResponse.json({ error: 'Não foi possível obter a URL de pagamento. Tente novamente.' }, { status: 500 })
  }

  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3003').replace(/\/$/, '')
  return NextResponse.json({
    redirectUrl,
    subscriptionId: subscription.id,
    successUrl: `${baseUrl}/premium/success`,
  })
}
