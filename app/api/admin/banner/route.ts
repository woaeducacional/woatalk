import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

// GET /api/admin/banner — retorna o banner ativo (público)
export async function GET() {
  const { data } = await supabase
    .from('app_banner')
    .select('id, image_url, link_url, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ banner: data ?? null })
}

// DELETE /api/admin/banner — remove o banner ativo
export async function DELETE() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Busca o banner atual para deletar do storage também
  const { data: banner } = await supabase
    .from('app_banner')
    .select('id, image_url')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!banner) {
    return NextResponse.json({ error: 'Nenhum banner ativo' }, { status: 404 })
  }

  // Remove do banco
  await supabase.from('app_banner').delete().eq('id', banner.id)

  // Tenta remover do storage (best-effort)
  try {
    const url = new URL(banner.image_url)
    const pathParts = url.pathname.split('/object/public/journey-assets/')
    if (pathParts[1]) {
      await supabase.storage.from('journey-assets').remove([pathParts[1]])
    }
  } catch { /* ignora erros de storage */ }

  return NextResponse.json({ success: true })
}
