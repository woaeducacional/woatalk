import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false }, { status: 400 })
  if (!supabase) return NextResponse.json({ valid: false }, { status: 503 })

  const { data, error } = await supabase
    .from('affiliates')
    .select('id, code, discount_percent')
    .eq('code', code)
    .single()

  if (error || !data) return NextResponse.json({ valid: false })
  return NextResponse.json({ valid: true, code: data.code, discount_percent: data.discount_percent })
}
