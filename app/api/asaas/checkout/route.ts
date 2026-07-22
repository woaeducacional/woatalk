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
  createPixAutomaticAuthorization,
  findCustomerByCpf,
  getFirstPendingPayment,
  getNextDueDate,
  getTrialDueDate,
  updatePayment,
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
  const { planId, billingType, cpf, phone, ref_code, coupon_code } = body as {
    planId: AsaasPlanId
    billingType: AsaasBillingType
    cpf: string
    phone?: string
    ref_code?: string
    coupon_code?: string
  }

  if (!planId || !billingType || !cpf) {
    return NextResponse.json({ error: 'planId, billingType e cpf são obrigatórios' }, { status: 400 })
  }

  const plan = ASAAS_PLANS[planId]
  if (!plan) {
    return NextResponse.json({ error: `Plano inválido: ${planId}` }, { status: 400 })
  }

  // Resolve coupon discount first (takes priority over affiliate if both present)
  let planValue = plan.value
  if (coupon_code) {
    const couponClean = String(coupon_code).trim().toUpperCase()
    const { data: couponData } = await supabase
      .from('coupons')
      .select('discount_percent')
      .eq('code', couponClean)
      .eq('active', true)
      .maybeSingle()
    if (couponData) {
      planValue = Math.round(plan.value * (1 - couponData.discount_percent / 100) * 100) / 100
      console.log(`[AsaasCheckout] Cupom ${couponClean} aplicado — desconto ${couponData.discount_percent}% — valor: R$${planValue}`)
    }
  }

  // Resolve affiliate discount if ref_code provided (only if no coupon was applied)
  let resolvedAffiliateCode: string | null = null
  if (ref_code && planValue === plan.value) {
    const refClean = String(ref_code).trim().toUpperCase()
    const { data: aff } = await supabase
      .from('affiliates')
      .select('code, discount_percent')
      .eq('code', refClean)
      .maybeSingle()
    if (aff) {
      planValue = Math.round(plan.value * (1 - aff.discount_percent / 100) * 100) / 100
      resolvedAffiliateCode = aff.code
      console.log(`[AsaasCheckout] Afiliado ${aff.code} aplicado — desconto ${aff.discount_percent}% — valor: R$${planValue}`)
    }
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

  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3003').replace(/\/$/, '')
  const successUrl = `${baseUrl}/premium/success`

  const hasTrial = billingType === 'CREDIT_CARD' || billingType === 'PIX'
  const nextDueDate = hasTrial ? getTrialDueDate() : getNextDueDate()
  const trialEndDate = getTrialDueDate()

  if (billingType === 'PIX') {
    let authorization
    try {
      authorization = await createPixAutomaticAuthorization({
        customerId: asaasCustomerId,
        frequency: plan.cycle === 'YEARLY' ? 'ANNUALLY' : 'MONTHLY',
        contractId: `WOA-${planId.split('_')[0]}-${userId.slice(0, 8)}-${Date.now().toString().slice(-4)}`,
        startDate: new Date().toISOString().split('T')[0],
        value: planValue,
        description: `WOA Talk — ${plan.label}`,
        immediateQrCode: {
          value: planValue,
          originalValue: planValue,
          dueDate: trialEndDate,
          description: `Primeira cobrança em 30 dias — ${plan.label}`,
          expirationSeconds: 86400,
        },
      })
      console.log('[AsaasCheckout] ✅ Autorização Pix Automático criada:', authorization.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[AsaasCheckout] ❌ Erro ao criar autorização Pix Automático:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    await supabase
      .from('users')
      .update({
        subscription_id: authorization.id,
        subscription_plan: planId,
        subscription_status: 'trial',
        subscription_current_period_end: trialEndDate,
        ...(resolvedAffiliateCode ? { affiliate_code: resolvedAffiliateCode } : {}),
      })
      .eq('id', userId)

    const immediateQr = authorization.immediateQrCode
    const redirectUrl =
      immediateQr?.authorizationUrl ??
      immediateQr?.pixTransaction?.authorizationUrl ??
      null

    if (!redirectUrl) {
      console.error('[AsaasCheckout] ❌ URL de pagamento Pix Automático não encontrada')
      return NextResponse.json({ error: 'Não foi possível obter a URL de pagamento Pix Automático. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({
      redirectUrl,
      authorizationId: authorization.id,
      trialEndDate,
      successUrl,
    })
  }

  // Cria a assinatura no Asaas
  let subscription
  try {
    subscription = await createSubscription({
      customer: asaasCustomerId,
      billingType,
      value: planValue,
      nextDueDate,
      cycle: plan.cycle,
      description: `WOA Talk — ${plan.label}`,
      redirectUrl: successUrl,
      externalReference: userId,
    })
    console.log('[AsaasCheckout] ✅ Assinatura criada:', subscription.id, '| trial:', hasTrial)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[AsaasCheckout] ❌ Erro ao criar assinatura:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  await supabase
    .from('users')
    .update({
      subscription_id: subscription.id,
      subscription_plan: planId,
      subscription_status: hasTrial ? 'trial' : 'inactive',
      ...(resolvedAffiliateCode ? { affiliate_code: resolvedAffiliateCode } : {}),
    })
    .eq('id', userId)

  // Busca a primeira cobrança gerada para obter a URL de pagamento
  const payment = await getFirstPendingPayment(subscription.id)
  console.log('[AsaasCheckout] Primeira cobrança:', payment?.id, '| invoiceUrl:', payment?.invoiceUrl)

  // Seta redirectUrl diretamente na fatura (não herda da assinatura em faturas via invoiceUrl)
  if (payment?.id) {
    try {
      await updatePayment(payment.id, { redirectUrl: successUrl })
      console.log('[AsaasCheckout] ✅ redirectUrl setado na fatura:', payment.id)
    } catch (err) {
      console.warn('[AsaasCheckout] ⚠ Não foi possível setar redirectUrl na fatura:', err)
    }
  }

  const redirectUrl =
    payment?.invoiceUrl ??
    subscription.paymentLink ??
    null

  if (!redirectUrl) {
    console.error('[AsaasCheckout] ❌ URL de pagamento não encontrada')
    return NextResponse.json({ error: 'Não foi possível obter a URL de pagamento. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({
    redirectUrl,
    subscriptionId: subscription.id,
    successUrl,
  })
}

