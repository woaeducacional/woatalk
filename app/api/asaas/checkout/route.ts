import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import {
  ASAAS_PLANS,
  AsaasBillingType,
  AsaasPlanId,
  createCustomer,
  createPixPayment,
  createSubscription,
  createCheckoutWithSubscription,
  cancelSubscription,
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
  const { planId, billingType, cpf, phone, ref_code, coupon_code, address, addressNumber, postalCode, province, city } = body as {
    planId: AsaasPlanId
    billingType: AsaasBillingType
    cpf: string
    phone?: string
    ref_code?: string
    coupon_code?: string
    address?: string
    addressNumber?: string
    postalCode?: string
    province?: string
    city?: string
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
    .select('asaas_customer_id, subscription_status, subscription_id, phone')
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

  const hasTrial = billingType === 'CREDIT_CARD'
  const nextDueDate = hasTrial ? getTrialDueDate() : getNextDueDate()
  const pixDueDate = new Date().toISOString().split('T')[0]

  if (billingType === 'PIX') {
    let payment
    const paymentPayload = {
      customer: asaasCustomerId,
      value: planValue,
      dueDate: pixDueDate,
      description: `WOA Talk — ${plan.label}`,
      externalReference: userId,
    }

    console.log('[AsaasCheckout] ▶ Criando cobrança Pix única', {
      userId,
      planId,
      planValue,
      cpf: cpfClean,
      billingType,
      payload: paymentPayload,
    })

    try {
      payment = await createPixPayment(paymentPayload)
      console.log('[AsaasCheckout] ✅ Cobrança PIX criada:', payment.id)
      console.log('[AsaasCheckout] ▶ Resposta do Asaas PIX:', JSON.stringify(payment, null, 2))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[AsaasCheckout] ❌ Erro ao criar cobrança PIX:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const redirectUrl = payment.invoiceUrl ?? null

    if (!redirectUrl) {
      console.error('[AsaasCheckout] ❌ URL de pagamento PIX não encontrada', { paymentId: payment.id })
      return NextResponse.json({ error: 'Não foi possível obter a URL de pagamento PIX. Tente novamente.' }, { status: 500 })
    }

    await supabase
      .from('users')
      .update({
        subscription_id: payment.id,
        subscription_plan: planId,
        subscription_status: 'pending',
        subscription_current_period_end: null,
        ...(resolvedAffiliateCode ? { affiliate_code: resolvedAffiliateCode } : {}),
      })
      .eq('id', userId)

    return NextResponse.json({
      redirectUrl,
      paymentId: payment.id,
      dueDate: pixDueDate,
      successUrl,
    })
  }

  // Para cartão de crédito: use o Checkout configurado para assinaturas (recorrente)
  let subscription: any = null
  let redirectUrl: string | null = null

  if (billingType === 'CREDIT_CARD') {
    // For credit card recurring checkouts Asaas requires full customer data (phone + address fields).
    const missingFields: string[] = []
    if (!phone) missingFields.push('phone')
    if (!address) missingFields.push('address')
    if (!addressNumber) missingFields.push('addressNumber')
    if (!postalCode) missingFields.push('postalCode')
    if (!province) missingFields.push('province')
    if (!city) missingFields.push('city')

    if (missingFields.length > 0) {
      console.warn('[AsaasCheckout] Campos de cartão não enviados pelo frontend, usando valores fallback:', missingFields)
    }

    const fallbackPhone = phone?.replace(/\D/g, '') || String(user?.phone || '').replace(/\D/g, '') || '11999999999'
    const fallbackAddress = address || 'Avenida Paulista'
    const fallbackAddressNumber = addressNumber || '1000'
    const fallbackPostalCode = postalCode?.replace(/\D/g, '') || '01311000'
    const fallbackProvince = province || 'SP'
    const fallbackCity = city || 'São Paulo'

    const checkoutPayload = {
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 100,
      callback: {
        successUrl,
        cancelUrl: `${baseUrl}/premium/cancel`,
        expiredUrl: `${baseUrl}/premium/expired`,
      },
      items: [
        {
          description: `WOA Talk — ${plan.label}`,
          name: plan.label,
          quantity: 1,
          value: planValue,
        },
      ],
      customerData: {
        name: userName,
        email: userEmail,
        cpfCnpj: cpfClean,
        phone: fallbackPhone,
        address: fallbackAddress,
        addressNumber: fallbackAddressNumber,
        postalCode: fallbackPostalCode,
        province: fallbackProvince,
        city: fallbackCity,
      },
      subscription: {
        cycle: plan.cycle,
        nextDueDate,
      },
      externalReference: userId,
    }

    console.log('[AsaasCheckout] ▶ Criando Checkout (assinatura) no Asaas', { payload: checkoutPayload })

    try {
      const checkout = await createCheckoutWithSubscription(checkoutPayload)
      console.log('[AsaasCheckout] ✅ Checkout criado:', JSON.stringify(checkout, null, 2))
      subscription = checkout.subscription ?? null
      redirectUrl = checkout.paymentLink ?? checkout.url ?? checkout.link ?? checkout.subscription?.paymentLink ?? null

      if (!redirectUrl) {
        console.error('[AsaasCheckout] ❌ URL de pagamento do checkout não encontrada', { checkout })
        return NextResponse.json({ error: 'Não foi possível obter a URL de pagamento para cartão de crédito. Tente novamente.' }, { status: 500 })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[AsaasCheckout] ❌ Erro ao criar Checkout para assinatura:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  } else {
    // Cria a assinatura no Asaas (PIX/Boleto flows)
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

    redirectUrl = subscription.paymentLink ?? payment?.invoiceUrl ?? null

    if (!redirectUrl) {
      console.error('[AsaasCheckout] ❌ URL de pagamento não encontrada')
      try {
        await cancelSubscription(subscription.id)
        console.log('[AsaasCheckout] ✅ Limpeza: assinatura cancelada após falta de URL')
      } catch (cleanupError) {
        console.warn('[AsaasCheckout] ⚠ Não foi possível cancelar assinatura de limpeza:', cleanupError)
      }
      return NextResponse.json({ error: 'Não foi possível obter a URL de pagamento. Tente novamente.' }, { status: 500 })
    }
  }

  // Persistência no DB — só depois de termos uma redirectUrl
  await supabase
    .from('users')
    .update({
      subscription_id: subscription?.id ?? null,
      subscription_plan: planId,
      // For credit card checkouts we mark subscription as 'pending' until Asaas confirms payment via webhook.
      subscription_status: billingType === 'CREDIT_CARD' ? 'pending' : hasTrial ? 'trial' : 'inactive',
      ...(resolvedAffiliateCode ? { affiliate_code: resolvedAffiliateCode } : {}),
    })
    .eq('id', userId)

  return NextResponse.json({
    redirectUrl,
    subscriptionId: subscription?.id ?? null,
    successUrl,
  })
}

