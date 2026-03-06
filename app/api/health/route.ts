import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const useSupabase = !!(supabaseUrl && supabaseKey)

  return NextResponse.json({
    status: 'ok',
    database: useSupabase ? 'supabase' : 'in-memory (fallback)',
    message: useSupabase 
      ? '✅ Usando Supabase'
      : '⚠️ Usando banco de dados em memória (fallback). Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local para usar Supabase.',
    configured: {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
    }
  })
}
