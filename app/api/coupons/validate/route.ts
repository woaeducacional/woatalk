import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// GET /api/coupons/validate?code=XXX — valida um cupom (público)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false }, { status: 400 })

  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, coupon_type, discount_percent, access_plan, access_months, active')
    .eq('code', code)
    .in('coupon_type', ['discount', 'plan_access'])
    .eq('active', true)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ valid: false })

  if (data.coupon_type === 'discount') {
    return NextResponse.json({
      valid: true,
      code: data.code,
      type: 'discount',
      discount_percent: data.discount_percent,
    })
  }

  return NextResponse.json({
    valid: true,
    code: data.code,
    type: 'plan_access',
    access_plan: data.access_plan,
    access_months: data.access_months,
  })
}
