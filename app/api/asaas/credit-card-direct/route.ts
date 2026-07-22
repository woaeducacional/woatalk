import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import {
  ASAAS_PLANS,
  AsaasPlanId,
  createCustomer,
  createCreditCardSubscription,
  findCustomerByCpf,
  getTrialDueDate,
} from '@/lib/asaas'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  console.log('[CreditCardDirect] ▶ Iniciando assinatura direta com cartão')

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const {
    planId,
    cpf,
    phone,
    ref_code,
    coupon_code,
    cardNumber,
    cardHolder,
    expiryMonth,
    expiryYear,
    ccv,
    postalCode,
    address,
    addressNumber,
    addressComplement,
    city,
    province,
  } = body as {
    planId: AsaasPlanId
    cpf: string
    phone: string
    ref_code?: string
    coupon_code?: string
    cardNumber: string
    cardHolder: string
    expiryMonth: string
    expiryYear: string
    ccv: string
    postalCode: string
    address: string
    addressNumber: string
    addressComplement?: string
    city: string
    province: string
  }

  // Validate required fields
  const missing: string[] = []
  if (!planId) missing.push('planId')
  if (!cpf) missing.push('cpf')
  if (!phone) missing.push('phone')
  if (!cardNumber) missing.push('cardNumber')
  if (!cardHolder) missing.push('cardHolder')
  if (!expiryMonth) missing.push('expiryMonth')
  if (!expiryYear) missing.push('expiryYear')
  if (!ccv) missing.push('ccv')
  if (!postalCode) missing.push('postalCode')
  if (!address) missing.push('address')
  if (!addressNumber) missing.push('addressNumber')
  if (!city) missing.push('city')
  if (!province) missing.push('province')

  if (missing.length > 0) {
    return NextResponse.json({ error: `Campos obrigatórios faltando: ${missing.join(', ')}` }, { status: 400 })
  }

  const plan = ASAAS_PLANS[planId]
  if (!plan) {
    return NextResponse.json({ error: `Plano inválido: ${planId}` }, { status: 400 })
  }

  const cpfClean = cpf.replace(/\D/g, '')
  if (cpfClean.length !== 11 && cpfClean.length !== 14) {
    return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 })
  }

  // Resolve coupon discount
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
      console.log(`[CreditCardDirect] Cupom ${couponClean} aplicado — desconto ${couponData.discount_percent}% — valor: R$${planValue}`)
    }
  }

  // Resolve affiliate discount (only if no coupon)
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
      console.log(`[CreditCardDirect] Afiliado ${aff.code} aplicado — desconto ${aff.discount_percent}% — valor: R$${planValue}`)
    }
  }

  const userId = session.user.id
  const userEmail = session.user.email!
  const userName = session.user.name ?? userEmail

  // Fetch user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('asaas_customer_id, subscription_status, subscription_id')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('[CreditCardDirect] ❌ Erro ao buscar usuário:', userError.message)
    return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 })
  }

  // Resolve or create Asaas customer
  let asaasCustomerId = user?.asaas_customer_id as string | undefined

  if (!asaasCustomerId) {
    console.log('[CreditCardDirect] Procurando customer por CPF:', cpfClean)
    const existing = await findCustomerByCpf(cpfClean).catch(() => null)

    if (existing) {
      asaasCustomerId = existing.id
      console.log('[CreditCardDirect] Customer existente encontrado:', asaasCustomerId)
    } else {
      console.log('[CreditCardDirect] Criando novo customer Asaas para:', userEmail)
      const customer = await createCustomer({
        name: userName,
        email: userEmail,
        cpfCnpj: cpfClean,
        phone: phone.replace(/\D/g, ''),
      })
      asaasCustomerId = customer.id
      console.log('[CreditCardDirect] Customer criado:', asaasCustomerId)
    }

    await supabase.from('users').update({ asaas_customer_id: asaasCustomerId }).eq('id', userId)
  }

  const trialEndDate = getTrialDueDate()
  const phoneClean = phone.replace(/\D/g, '')
  const postalCodeClean = postalCode.replace(/\D/g, '')
  const cardNumberClean = cardNumber.replace(/\D/g, '')

  // Get client IP for Asaas remoteIp requirement
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const remoteIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

  console.log('[CreditCardDirect] ▶ Criando assinatura com cartão direto', {
    userId,
    planId,
    planValue,
    trialEndDate,
    asaasCustomerId,
  })

  let subscription: Awaited<ReturnType<typeof createCreditCardSubscription>>
  try {
    subscription = await createCreditCardSubscription({
      customer: asaasCustomerId,
      value: planValue,
      nextDueDate: trialEndDate,
      cycle: plan.cycle,
      description: `WOA Talk — ${plan.label}`,
      externalReference: userId,
      creditCard: {
        holderName: cardHolder.toUpperCase(),
        number: cardNumberClean,
        expiryMonth: expiryMonth.padStart(2, '0'),
        expiryYear: expiryYear.length === 2 ? `20${expiryYear}` : expiryYear,
        ccv,
      },
      creditCardHolderInfo: {
        name: userName,
        email: userEmail,
        cpfCnpj: cpfClean,
        postalCode: postalCodeClean,
        addressNumber,
        addressComplement: addressComplement ?? '',
        phone: phoneClean,
        mobilePhone: phoneClean,
      },
      remoteIp,
    })
    console.log('[CreditCardDirect] ✅ Assinatura criada:', subscription.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[CreditCardDirect] ❌ Erro ao criar assinatura com cartão:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Persist to DB — mark as trial immediately (first charge in 30 days)
  await supabase
    .from('users')
    .update({
      subscription_id: subscription.id,
      subscription_plan: planId,
      subscription_status: 'trial',
      subscription_current_period_end: trialEndDate,
      ...(resolvedAffiliateCode ? { affiliate_code: resolvedAffiliateCode } : {}),
    })
    .eq('id', userId)

  return NextResponse.json({
    success: true,
    subscriptionId: subscription.id,
    trialEndDate,
  })
}
