import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

type StarterCoupon = {
  id: number
  code: string
  starter_months: number
  max_uses: number | null
  uses_count: number
  active: boolean
}

function addMonths(base: Date, months: number): Date {
  const next = new Date(base)
  next.setMonth(next.getMonth() + months)
  return next
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const code = String(body.code ?? '').trim().toUpperCase()

  if (!code || code.length < 3) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, subscription_plan, subscription_current_period_end')
    .eq('id', session.user.id)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  let redeemed: StarterCoupon | null = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id, code, starter_months, max_uses, uses_count, active')
      .eq('code', code)
      .eq('coupon_type', 'starter_access')
      .maybeSingle<StarterCoupon>()

    if (couponError) {
      return NextResponse.json({ error: couponError.message }, { status: 500 })
    }

    if (!coupon || !coupon.active || !coupon.starter_months) {
      return NextResponse.json({ error: 'Cupom inválido ou inativo' }, { status: 400 })
    }

    const maxUses = coupon.max_uses ?? null
    if (maxUses !== null && coupon.uses_count >= maxUses) {
      await supabase.from('coupons').update({ active: false }).eq('id', coupon.id)
      return NextResponse.json({ error: 'Cupom já atingiu o limite de utilizações' }, { status: 400 })
    }

    const nextUses = coupon.uses_count + 1
    const nextActive = maxUses === null ? true : nextUses < maxUses

    const { data: updatedCoupon, error: updateCouponError } = await supabase
      .from('coupons')
      .update({ uses_count: nextUses, active: nextActive })
      .eq('id', coupon.id)
      .eq('uses_count', coupon.uses_count)
      .eq('active', true)
      .select('id, code, starter_months, max_uses, uses_count, active')
      .maybeSingle<StarterCoupon>()

    if (updateCouponError) {
      return NextResponse.json({ error: updateCouponError.message }, { status: 500 })
    }

    if (updatedCoupon) {
      redeemed = updatedCoupon
      break
    }
  }

  if (!redeemed) {
    return NextResponse.json({ error: 'Não foi possível aplicar o cupom agora. Tente novamente.' }, { status: 409 })
  }

  const now = new Date()
  const currentEnd = user.subscription_current_period_end ? new Date(user.subscription_current_period_end) : null
  const baseDate = currentEnd && currentEnd > now ? currentEnd : now
  const newEnd = addMonths(baseDate, redeemed.starter_months)

  const currentPlan = String(user.subscription_plan ?? '')
  const targetPlan = currentPlan.includes('premium') ? currentPlan : 'starter_monthly'

  const { error: subUpdateError } = await supabase
    .from('users')
    .update({
      subscription_plan: targetPlan,
      subscription_status: 'active',
      subscription_current_period_end: newEnd.toISOString(),
    })
    .eq('id', user.id)

  if (subUpdateError) {
    return NextResponse.json({ error: subUpdateError.message }, { status: 500 })
  }

  // Best-effort log; avoids blocking redemption if table is absent during rollout.
  await supabase
    .from('coupon_redemptions')
    .insert({ coupon_id: redeemed.id, user_id: user.id, months_granted: redeemed.starter_months })

  return NextResponse.json({
    success: true,
    code: redeemed.code,
    monthsGranted: redeemed.starter_months,
    usesCount: redeemed.uses_count,
    maxUses: redeemed.max_uses,
    expiresAt: newEnd.toISOString(),
  })
}
