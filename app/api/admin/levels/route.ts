import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/src/lib/supabaseClient'
import { authOptions } from '@/lib/authOptions'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return null
  }
  return session
}

/** GET /api/admin/levels — list all journeys from journey_content */
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { data, error } = await supabase
    .from('journey_content')
    .select('phase_id, title, description, mission_groups, created_at')
    .order('phase_id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const levels = (data ?? []).map((row) => ({
    id: row.phase_id,
    name: row.title,
    description: row.description,
    mission_groups_count: Array.isArray(row.mission_groups) ? row.mission_groups.length : 0,
    created_at: row.created_at,
  }))

  return NextResponse.json({ levels })
}
