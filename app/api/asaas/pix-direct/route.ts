import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import {
  ASAAS_PLANS,
  AsaasPlanId,
  AsaasPixAutomaticAuthorizationFrequency,
  cancelPixAutomaticAuthorization,
  createCustomer,
  createPixAutomaticAuthorization,
  findCustomerByCpf,
  getPixAutomaticAuthorization,
  getTrialDueDate,
} from '@/lib/asaas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  console.log('[PixDirect] ▶ Iniciando autorização Pix Automático direta')

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

  const trialEndDate = getTrialDueDate()
  const frequency: AsaasPixAutomaticAuthorizationFrequency = plan.cycle === 'YEARLY' ? 'ANNUALLY' : 'MONTHLY'

  console.log('[PixDirect] ▶ Criando autorização Pix Automático', { userId, planId, planValue, trialEndDate })

  let authorization: Awaited<ReturnType<typeof createPixAutomaticAuthorization>>
  try {
    authorization = await createPixAutomaticAuthorization({
      customerId: asaasCustomerId,
      frequency,
      contractId: `WOA-${planId.split('_')[0]}-${userId.slice(0, 8)}-${Date.now().toString().slice(-4)}`,
      startDate: new Date().toISOString().split('T')[0],
      value: planValue,
      description: `WOA Talk — ${plan.label}`,
      // O Asaas cria automaticamente as cobranças recorrentes após a autorização ficar ACTIVE.
      paymentCreationMode: 'SUBSCRIPTION',
      retryPolicy: 'NOT_ALLOWED',
      immediateQrCode: {
        value: planValue,
        originalValue: planValue,
        dueDate: trialEndDate,
        description: `WOA Talk — ${plan.label}`,
        expirationSeconds: 86400,
      },
    })
    console.log('[PixDirect] ✅ Autorização criada:', authorization.id)
    console.log('[PixDirect] Resposta completa:', JSON.stringify(authorization, null, 2))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PixDirect] ❌ Erro ao criar autorização:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // O POST pode retornar apenas o id. O QR fica disponível no GET da autorização.
  let authorizationDetails = authorization
  let imm = authorizationDetails.immediateQrCode
  if (!imm?.qrCode && !imm?.pixTransaction?.qrCode && !imm?.authorizationUrl && !imm?.pixTransaction?.authorizationUrl) {
    try {
      authorizationDetails = await getPixAutomaticAuthorization(authorization.id)
      imm = authorizationDetails.immediateQrCode
      console.log('[PixDirect] QR consultado via GET da autorização:', JSON.stringify(authorizationDetails, null, 2))
    } catch (err) {
      console.warn('[PixDirect] Não foi possível consultar detalhes da autorização:', err)
    }
  }

  // Extract QR code data — check multiple paths Asaas may use
  const encodedImage =
    imm?.qrCode?.encodedImage ??
    imm?.pixTransaction?.qrCode?.encodedImage ??
    null
  const payload =
    imm?.qrCode?.payload ??
    imm?.pixTransaction?.qrCode?.payload ??
    null
  const authorizationUrl =
    imm?.authorizationUrl ??
    imm?.pixTransaction?.authorizationUrl ??
    null

  if (!encodedImage && !payload && !authorizationUrl) {
    console.error('[PixDirect] ❌ Nenhum dado de QR Code encontrado na resposta', { imm })
    try { await cancelPixAutomaticAuthorization(authorization.id) } catch {}
    return NextResponse.json(
      { error: 'Não foi possível obter o QR Code do Pix. Tente novamente.' },
      { status: 500 }
    )
  }

  // Persist to DB — mark as trial immediately (QR generated, pending bank authorization)
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

  return NextResponse.json({
    success: true,
    authorizationId: authorization.id,
    encodedImage,
    payload,
    authorizationUrl,
    trialEndDate,
  })
}
