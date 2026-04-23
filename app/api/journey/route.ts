import { NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabaseClient'

/** GET /api/journey — list all published journeys (public) */
export async function GET() {
  if (!supabase) return NextResponse.json({ journeys: [] })

  // Try to select with icon_url first, fallback if column doesn't exist
  let { data, error } = await supabase
    .from('journey_content')
    .select('phase_id, title, description, blocked, is_pro, icon_url')
    .order('phase_id', { ascending: true })

  // If error (likely column doesn't exist), try without icon_url
  if (error) {
    const { data: fallbackData } = await supabase
      .from('journey_content')
      .select('phase_id, title, description, blocked, is_pro')
      .order('phase_id', { ascending: true })
    
    return NextResponse.json({
      journeys: (fallbackData ?? []).map((row) => ({
        phase_id: row.phase_id,
        title: row.title,
        description: row.description ?? '',
        blocked: row.blocked ?? false,
        is_pro: row.is_pro ?? false,
        icon_url: null,
      })),
    })
  }

  return NextResponse.json({
    journeys: (data ?? []).map((row: any) => ({
      phase_id: row.phase_id,
      title: row.title,
      description: row.description ?? '',
      blocked: row.blocked ?? false,
      is_pro: row.is_pro ?? false,
      icon_url: row.icon_url || null,
    })),
  })
}
