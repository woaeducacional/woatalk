import { NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabaseClient'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const JOURNEY_ASSETS_PREFIX = '/storage/v1/object/public/journey-assets/'

function resolveJourneyIconUrl(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null
  const icon = rawValue.trim()
  if (!icon) return null
  if (/^https?:\/\//i.test(icon)) return icon
  if (!SUPABASE_URL) return null
  return `${SUPABASE_URL}${JOURNEY_ASSETS_PREFIX}${icon.replace(/^\/+/, '')}`
}

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
      icon_url: resolveJourneyIconUrl(row.icon_url),
    })),
  })
}
