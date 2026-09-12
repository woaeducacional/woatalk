import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import openai from '@/src/lib/openaiClient'
import { supabase } from '@/src/lib/supabaseClient'

/**
 * POST /api/pronunciation/journey-chat
 *
 * Similar to topic-chat but uses journey content as context
 * Recebe: phaseId, histórico da conversa, e última fala do usuário
 * Retorna: feedback + próxima pergunta baseada no conteúdo da jornada
 */

const TOTAL_QUESTIONS = 10

interface ConversationTurn {
  role: 'assistant' | 'user'
  content: string
}

interface JourneyContent {
  phase_id: number
  title: string
  description: string
  block1?: any
  block2?: any
  block3?: any
  block4?: any
  block5?: any
}

/** Extrai tópicos-chave do conteúdo da jornada */
function extractJourneyContext(journeyContent: JourneyContent): string {
  const parts: string[] = []

  // Título e descrição
  if (journeyContent.title) parts.push(`Journey: ${journeyContent.title}`)
  if (journeyContent.description) parts.push(journeyContent.description)

  // Block1: video insight
  if (journeyContent.block1?.videoTitle) {
    parts.push(`Topic: ${journeyContent.block1.videoTitle}`)
  }
  if (journeyContent.block1?.listenRepeatSentences) {
    parts.push(
      `Key sentences: ${journeyContent.block1.listenRepeatSentences.slice(0, 3).join(', ')}`
    )
  }

  // Block2: reflection/motivation
  if (journeyContent.block2?.choicePrompt) {
    parts.push(`Theme: ${journeyContent.block2.choicePrompt}`)
  }

  // Block3: vocabulary
  if (journeyContent.block3?.vocabulary?.length) {
    const vocabWords = journeyContent.block3.vocabulary.slice(0, 5).map((v: any) => v.word)
    parts.push(`Key vocabulary: ${vocabWords.join(', ')}`)
  }

  // Block5: speaking challenge hint
  if (journeyContent.block5?.topicHints?.length) {
    parts.push(`Focus areas: ${journeyContent.block5.topicHints.slice(0, 2).join(', ')}`)
  }

  return parts.join('. ')
}

/** Remove prefixos como "FEEDBACK: " ou "QUESTION: " */
function stripMarker(s: string): string {
  return s.replace(/^(FEEDBACK|QUESTION):\s*/i, '').trim()
}

/** Separa feedback (PT) de pergunta (EN) */
function parseFeedbackAndQuestion(raw: string): { feedback: string; question: string } {
  const feedbackMatch = raw.match(/FEEDBACK:\s*([\s\S]*?)(?=QUESTION:|$)/i)
  const questionMatch = raw.match(/QUESTION:\s*([\s\S]*?)$/i)
  if (feedbackMatch && questionMatch && questionMatch[1].trim()) {
    return { feedback: feedbackMatch[1].trim(), question: questionMatch[1].trim() }
  }

  const onlyQuestion = raw.match(/^QUESTION:\s*([\s\S]+)$/i)
  if (onlyQuestion) {
    return { feedback: '', question: onlyQuestion[1].trim() }
  }

  const sentences = raw.split(/(?<=[.!?])\s+/).filter(Boolean)
  let lastQIdx = -1
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (sentences[i].trimEnd().endsWith('?')) {
      lastQIdx = i
      break
    }
  }

  if (lastQIdx > 0) {
    return {
      feedback: stripMarker(sentences.slice(0, lastQIdx).join(' ')),
      question: stripMarker(sentences.slice(lastQIdx).join(' ')),
    }
  }

  return { feedback: '', question: stripMarker(raw) }
}

/** Monta o prompt do sistema para conversa baseada em jornada */
function buildSystemPrompt(journeyTitle: string, journeyContext: string): string {
  return `You are WOA Talk's English conversation coach — warm, natural and encouraging.
Your role in this conversation:
1. Keep the entire conversation centered on the WOA Learning Journey: "${journeyTitle}"
2. Use context from the learning material to guide meaningful questions
3. Understand the user even when they speak in Portuguese, but always respond in English
4. Encourage the user gently to speak in English when they answer in Portuguese
5. Keep the tone natural, realistic, and conversational, like a real English-speaking partner
6. Guide the conversation with short, engaging prompts relevant to the journey content

Learning Material Context:
${journeyContext}

IMPORTANT RULES:
- The entire response must be in English, including the feedback and the question
- The user may speak in Portuguese, but you must understand it and answer in English only
- If the user answers in Portuguese, say something like: "Try to answer in English next time" or "Good idea — let's keep it in English"
- Stay focused on the journey theme throughout the entire session
- Do not jump to unrelated topics
- Keep feedback brief and helpful, not long or formal
- Use natural spoken English, not textbook language
- Always end your message with the next question in English

RESPONSE FORMAT (always follow this exactly):
FEEDBACK: [short English feedback — or empty if question 1]
QUESTION: [next question in English only, related to the journey]

Rules:
- NEVER use markdown, asterisks or formatting symbols
- Keep feedback short and specific, ideally 1-2 sentences
- Be encouraging and friendly
- The QUESTION field must be in English only
- If this is question 1, leave FEEDBACK empty and just write the first question in QUESTION
- After question ${TOTAL_QUESTIONS}, write a final encouraging message in FEEDBACK in English and end with "Session complete. Great job!" in QUESTION`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Verificar se é premium
  const { data: userData } = supabase
    ? await supabase
        .from('users')
        .select('subscription_plan, subscription_status')
        .eq('email', session.user.email ?? '')
        .single()
    : { data: null }

  const isActive = userData?.subscription_status === 'active' || userData?.subscription_status === 'trial'
  const isPremium = isActive && userData?.subscription_plan && userData.subscription_plan.includes('premium')

  if (!isPremium) {
    return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
  }

  const body = await req.json()
  const { phaseId, history, userSpeech, questionNumber } = body as {
    phaseId: number
    history: ConversationTurn[]
    userSpeech: string
    questionNumber: number
  }

  // Buscar conteúdo da jornada
  const { data: journeyContent } = supabase
    ? await supabase
        .from('journey_content')
        .select('*')
        .eq('phase_id', phaseId)
        .single()
    : { data: null }

  if (!journeyContent) {
    return NextResponse.json({ error: 'Journey not found' }, { status: 404 })
  }

  const journeyTitle = journeyContent.title || `Phase ${phaseId}`
  const journeyContext = extractJourneyContext(journeyContent as JourneyContent)
  const systemPrompt = buildSystemPrompt(journeyTitle, journeyContext)

  // Preparar histórico de conversa
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...history,
    ...(userSpeech
      ? [
          {
            role: 'user' as const,
            content: userSpeech,
          },
        ]
      : []),
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const rawResponse = completion.choices[0]?.message?.content ?? ''
    const { feedback, question } = parseFeedbackAndQuestion(rawResponse)

    const isComplete = questionNumber >= TOTAL_QUESTIONS
    const nextQuestionNumber = questionNumber + 1

    return NextResponse.json({
      feedback,
      question,
      questionNumber: nextQuestionNumber,
      isComplete,
    })
  } catch (error) {
    console.error('[JourneyChat] ❌ OpenAI error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
