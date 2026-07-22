import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import {
  ASAAS_PLANS,
  AsaasPlanId,
  createCustomer,
  createPixPayment,
  findCustomerByCpf,
  getPixQrCode,
} from '@/lib/asaas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  console.log('[PixDirect] ▶ Iniciando cobrança Pix única')

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { planId, cpf, phone, ref_code, coupon_code } = body as {
    planId: AsaasPlanId
    cpf: string
    phone?: string
    ref_code?: string
    coupon_code?: string
  }

  if (!planId || !cpf) {
    return NextResponse.json({ error: 'planId e cpf são obrigatórios' }, { status: 400 })
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
      console.log(`[PixDirect] Cupom ${couponClean} aplicado — valor: R$${planValue}`)
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
      console.log(`[PixDirect] Afiliado ${aff.code} aplicado — valor: R$${planValue}`)
    }
  }

  const userId = session.user.id
  const userEmail = session.user.email!
  const userName = session.user.name ?? userEmail

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('asaas_customer_id')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('[PixDirect] ❌ Erro ao buscar usuário:', userError.message)
    return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 })
  }

  // Resolve or create Asaas customer
  let asaasCustomerId = user?.asaas_customer_id as string | undefined

  if (!asaasCustomerId) {
    const existing = await findCustomerByCpf(cpfClean).catch(() => null)
    if (existing) {
      asaasCustomerId = existing.id
      console.log('[PixDirect] Customer existente encontrado:', asaasCustomerId)
    } else {
      const customer = await createCustomer({
        name: userName,
        email: userEmail,
        cpfCnpj: cpfClean,
        phone: phone?.replace(/\D/g, ''),
      })
      asaasCustomerId = customer.id
      console.log('[PixDirect] Customer criado:', asaasCustomerId)
    }
    await supabase.from('users').update({ asaas_customer_id: asaasCustomerId }).eq('id', userId)
  }

  const dueDate = new Date().toISOString().split('T')[0]

  console.log('[PixDirect] ▶ Criando cobrança Pix única', { userId, planId, planValue, dueDate })

  let payment: Awaited<ReturnType<typeof createPixPayment>>
  try {
    payment = await createPixPayment({
      customer: asaasCustomerId,
      value: planValue,
      dueDate,
      description: `WOA Talk — ${plan.label}`,
      externalReference: userId,
    })
    console.log('[PixDirect] ✅ Cobrança PIX criada:', payment.id)
    console.log('[PixDirect] Resposta completa:', JSON.stringify(payment, null, 2))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PixDirect] ❌ Erro ao criar cobrança PIX:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  let encodedImage = payment.qrCode?.encodedImage ?? payment.pixTransaction?.qrCode?.encodedImage ?? null
  let payload = payment.qrCode?.payload ?? payment.pixTransaction?.qrCode?.payload ?? null

  if (!encodedImage || !payload) {
    try {
      const qrData = await getPixQrCode(payment.id)
      encodedImage = encodedImage ?? qrData.encodedImage
      payload = payload ?? qrData.payload
      console.log('[PixDirect] QR consultado via /payments/:id/pixQrCode')
    } catch (err) {
      console.warn('[PixDirect] Não foi possível consultar QR Code do PIX:', err)
    }
  }

  const invoiceUrl = payment.invoiceUrl ?? null

  if (!encodedImage && !payload && !invoiceUrl) {
    console.error('[PixDirect] ❌ Nenhum dado de pagamento PIX encontrado', { paymentId: payment.id })
    return NextResponse.json(
      { error: 'Não foi possível obter o QR Code do Pix. Tente novamente.' },
      { status: 500 }
    )
  }

  // Access is confirmed only after PAYMENT_CONFIRMED/PAYMENT_RECEIVED webhook.
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
    success: true,
    paymentId: payment.id,
    encodedImage,
    payload,
    invoiceUrl,
    dueDate,
  })
}
