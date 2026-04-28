import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

interface JourneyBlock3 {
  vocabulary?: Array<{
    word: string
    translationPt: string
  }>
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Fetch user's journey progress
    const { data: user } = await supabase
      .from('users')
      .select('journey_progress')
      .eq('id', session.user.id)
      .single()

    const journeyProgress = user?.journey_progress || {}
    const completedPhases = Object.keys(journeyProgress).filter(
      (phaseId) => Array.isArray(journeyProgress[phaseId]) && journeyProgress[phaseId].length > 0
    )

    // Use first completed phase, or default to phase 1
    const targetPhaseId = completedPhases.length > 0 ? completedPhases[0] : '1'
    
    // Fetch vocabulary from journey content (block 3)
    const { data: journeyContent } = await supabase
      .from('journey_content')
      .select('block3')
      .eq('phase_id', parseInt(targetPhaseId))
      .single()

    const block3: JourneyBlock3 = journeyContent?.block3 || {}
    let vocabulary = block3.vocabulary || []

    // If no vocabulary found or less than 15 words, try fetching more phases
    if (vocabulary.length < 15 && completedPhases.length > 1) {
      for (const phaseId of completedPhases.slice(1)) {
        const { data: additionalContent } = await supabase
          .from('journey_content')
          .select('block3')
          .eq('phase_id', parseInt(phaseId))
          .single()
        const addBlock3: JourneyBlock3 = additionalContent?.block3 || {}
        vocabulary.push(...(addBlock3.vocabulary || []))
        if (vocabulary.length >= 15) break
      }
    }

    // Shuffle and take first 15 words
    const shuffled = vocabulary.sort(() => Math.random() - 0.5)
    const pairs = shuffled.slice(0, 15).map((word: any) => ({
      en: word.word || word.en || 'N/A',
      pt: word.translationPt || word.pt || word.translation || 'N/A',
    }))

    // Fallback to default pairs if none found
    if (pairs.length === 0 || pairs.every((p: any) => p.en === 'N/A' || p.pt === 'N/A')) {
      const defaultPairs = [
        { en: 'Apple', pt: 'Maçã' },
        { en: 'Book', pt: 'Livro' },
        { en: 'House', pt: 'Casa' },
        { en: 'Car', pt: 'Carro' },
        { en: 'Table', pt: 'Mesa' },
        { en: 'Chair', pt: 'Cadeira' },
        { en: 'Phone', pt: 'Telefone' },
        { en: 'Computer', pt: 'Computador' },
        { en: 'Lamp', pt: 'Lâmpada' },
        { en: 'Door', pt: 'Porta' },
        { en: 'Window', pt: 'Janela' },
        { en: 'Tree', pt: 'Árvore' },
        { en: 'Flower', pt: 'Flor' },
        { en: 'Sun', pt: 'Sol' },
        { en: 'Moon', pt: 'Lua' },
      ]
      return NextResponse.json({ pairs: defaultPairs })
    }

    return NextResponse.json({ pairs })
  } catch (error) {
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    )
  }
}
