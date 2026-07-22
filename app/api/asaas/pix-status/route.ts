import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import { getPixAutomaticAuthorization } from '@/lib/asaas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  }

  // Security: ensure this authorization belongs to the current user
  const { data: user } = await supabase
    .from('users')
    .select('subscription_id')
    .eq('id', session.user.id)
    .single()

  if (user?.subscription_id !== id) {
    return NextResponse.json({ error: 'Autorização não encontrada' }, { status: 403 })
  }

  try {
    const authorization = await getPixAutomaticAuthorization(id)
    console.log('[PixStatus] status:', authorization.status, '| id:', id)
    return NextResponse.json({ status: authorization.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[PixStatus] ❌ Erro ao consultar autorização:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
