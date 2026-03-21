import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabaseClient'
import type { JourneyCheckpoint } from '@/lib/journey'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const { phaseId: raw } = await params
  const phaseId = parseInt(raw)
  if (isNaN(phaseId)) {
    return NextResponse.json({ error: 'phaseId inválido' }, { status: 400 })
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('journey_checkpoints')
    .select('*')
    .eq('phase_id', phaseId)
    .order('checkpoint_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ checkpoints: data as JourneyCheckpoint[] })
}
