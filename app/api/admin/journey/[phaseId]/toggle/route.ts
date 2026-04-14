import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/src/lib/supabaseClient'
import { authOptions } from '@/lib/authOptions'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

/** PATCH /api/admin/journey/[phaseId]/toggle — toggle blocked or is_pro */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { phaseId: raw } = await params
  const phaseId = parseInt(raw)
  if (isNaN(phaseId)) return NextResponse.json({ error: 'Invalid phaseId' }, { status: 400 })

  const body = await req.json()
  const field = body.field as string
  const value = body.value as boolean

  if (!['blocked', 'is_pro'].includes(field) || typeof value !== 'boolean') {
    return NextResponse.json({ error: 'Invalid field or value' }, { status: 400 })
  }

  const { error } = await supabase
    .from('journey_content')
    .update({ [field]: value })
    .eq('phase_id', phaseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, [field]: value })
}
