import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { data, error } = await supabase
    .from('affiliates')
    .select(`
      id, code, discount_percent, starter_sales, premium_sales, created_at,
      users ( id, name, email, avatar_url, role )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliates: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { user_id, code, discount_percent } = await req.json()
  if (!user_id || !code) return NextResponse.json({ error: 'user_id e code são obrigatórios' }, { status: 400 })

  const slug = String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!slug) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })

  const { data, error } = await supabase
    .from('affiliates')
    .insert({ user_id, code: slug, discount_percent: Number(discount_percent) || 10 })
    .select()
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'Código ou usuário já existe como afiliado' : error.message
    return NextResponse.json({ error: msg }, { status: 409 })
  }
  return NextResponse.json({ affiliate: data })
}
