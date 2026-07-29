import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

// GET /api/admin/coupons — lista todos os cupons
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestedType = req.nextUrl.searchParams.get('type')
  const typeParam = requestedType === 'starter_access' ? 'starter_access' : 'discount'

  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, coupon_type, discount_percent, starter_months, max_uses, uses_count, active, created_at')
    .eq('coupon_type', typeParam)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupons: data ?? [] })
}

// POST /api/admin/coupons — cria um novo cupom
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const code = String(body.code ?? '').trim().toUpperCase()
  const coupon_type = body.coupon_type === 'starter_access' ? 'starter_access' : 'discount'
  const discount_percent = Number(body.discount_percent)
  const starter_months = Number(body.starter_months)
  const max_uses = Number(body.max_uses)

  if (!code || code.length < 3) {
    return NextResponse.json({ error: 'Código deve ter pelo menos 3 caracteres' }, { status: 400 })
  }
  if (coupon_type === 'discount') {
    if (!Number.isInteger(discount_percent) || discount_percent < 1 || discount_percent > 100) {
      return NextResponse.json({ error: 'Desconto deve ser entre 1 e 100' }, { status: 400 })
    }
  } else {
    if (!Number.isInteger(starter_months) || starter_months < 1 || starter_months > 12) {
      return NextResponse.json({ error: 'Meses devem ser entre 1 e 12' }, { status: 400 })
    }
    if (!Number.isInteger(max_uses) || max_uses < 1) {
      return NextResponse.json({ error: 'Número de utilizações deve ser maior que 0' }, { status: 400 })
    }
  }

  const payload = coupon_type === 'discount'
    ? { code, coupon_type, discount_percent, active: true }
    : { code, coupon_type, starter_months, max_uses, uses_count: 0, active: true }

  const { data, error } = await supabase
    .from('coupons')
    .insert(payload)
    .select('id, code, coupon_type, discount_percent, starter_months, max_uses, uses_count, active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Código já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupon: data }, { status: 201 })
}
