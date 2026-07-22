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
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, discount_percent, active, created_at')
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
  const discount_percent = Number(body.discount_percent)

  if (!code || code.length < 3) {
    return NextResponse.json({ error: 'Código deve ter pelo menos 3 caracteres' }, { status: 400 })
  }
  if (!Number.isInteger(discount_percent) || discount_percent < 1 || discount_percent > 100) {
    return NextResponse.json({ error: 'Desconto deve ser entre 1 e 100' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('coupons')
    .insert({ code, discount_percent, active: true })
    .select('id, code, discount_percent, active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Código já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupon: data }, { status: 201 })
}
