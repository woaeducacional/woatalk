import { NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabaseClient'

/** GET /api/journey — list all published journeys (public) */
export async function GET() {
  if (!supabase) return NextResponse.json({ journeys: [] })

  const { data, error } = await supabase
    .from('journey_content')
    .select('phase_id, title, description, blocked, is_pro')
    .order('phase_id', { ascending: true })

  if (error) return NextResponse.json({ journeys: [] })

  return NextResponse.json({
    journeys: (data ?? []).map((row) => ({
      phase_id: row.phase_id,
      title: row.title,
      description: row.description ?? '',
      blocked: row.blocked ?? false,
      is_pro: row.is_pro ?? false,
    })),
  })
}
