import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_code,
        verification_code,
        ocean_name,
        level,
        total_study_hours,
        total_activities,
        completed_activities,
        completion_percentage,
        total_xp,
        total_woa_coins,
        issued_at,
        next_eligible_issuance_at,
        status
      `)
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })

    if (error) {
      console.error('Certificates list error:', error)

      return NextResponse.json(
        { error: 'Não foi possível carregar os certificados.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      certificates: certificates ?? [],
    })
  } catch (error) {
    console.error('Certificates API error:', error)

    return NextResponse.json(
      { error: 'Erro interno.' },
      { status: 500 },
    )
  }
}
