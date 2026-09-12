import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

// PATCH — Toggle blocked status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const { phaseId: phaseIdStr } = await params
  const phaseId = parseInt(phaseIdStr)
  if (isNaN(phaseId)) return NextResponse.json({ error: 'Invalid phaseId' }, { status: 400 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { blocked } = body

  if (blocked === undefined) return NextResponse.json({ error: 'Missing blocked field' }, { status: 400 })

  const { data, error } = await supabase
    .from('journey_content')
    .update({ blocked, updated_at: new Date().toISOString() })
    .eq('phase_id', phaseId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
