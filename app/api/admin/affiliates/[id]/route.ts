import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.code !== undefined) {
    const slug = String(body.code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!slug) return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('code', slug)
      .neq('id', id)
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'Código já está em uso' }, { status: 409 })
    updates.code = slug
  }

  if (body.discount_percent !== undefined) {
    const pct = Number(body.discount_percent)
    if (isNaN(pct) || pct < 0 || pct > 100) return NextResponse.json({ error: 'Desconto inválido (0–100)' }, { status: 400 })
    updates.discount_percent = pct
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  const { data, error } = await supabase
    .from('affiliates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliate: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { error } = await supabase.from('affiliates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
