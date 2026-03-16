import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/src/lib/supabaseClient'

export interface PhraseSentence {
  id: string
  phase_id: number
  sentence: string
  translation: string | null
  hint: string | null
  difficulty: number
  xp_reward: number
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const { phaseId: phaseIdStr } = await params
  const phaseId = parseInt(phaseIdStr)

  if (isNaN(phaseId)) {
    return NextResponse.json({ error: 'phaseId inválido' }, { status: 400 })
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('phase_sentences')
    .select('id, phase_id, sentence, translation, hint, difficulty, xp_reward')
    .eq('phase_id', phaseId)
    .eq('active', true)
    .order('difficulty', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sentences: data as PhraseSentence[] })
}
