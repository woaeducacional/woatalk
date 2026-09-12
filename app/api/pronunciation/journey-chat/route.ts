import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import openai from '@/src/lib/openaiClient'
import { supabase } from '@/src/lib/supabaseClient'

/**
 * POST /api/pronunciation/journey-chat
 *
 * Similar ao topic-chat, mas usando conteúdo de uma jornada específica.
 * Recebe o phaseId, o histórico da conversa e a última fala do usuário.
 * Retorna feedback e próxima pergunta baseada no conteúdo da jornada.
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
  block1?: { videoTitle?: string; choiceQuestion?: string }
  block2?: { choicePrompt?: string }
  block3?: { vocabulary?: Array<{ word: string; definition: string }> }
  block4?: { expressions?: Array<{ text: string; example: string }> }
  block5?: { promptEn?: string }
}

function stripMarker(s: string): string {
  return s.replace(/^(FEEDBACK|QUESTION):\s*/i, '').trim()
}

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
    if (sentences[i].trimEnd().endsWith('?')) { lastQIdx = i; break }
  }

  if (lastQIdx > 0) {
    return {
      feedback: stripMarker(sentences.slice(0, lastQIdx).join(' ')),
      question: stripMarker(sentences.slice(lastQIdx).join(' ')),
    }
  }

  return { feedback: '', question: stripMarker(raw) }
}

function buildSystemPrompt(journeyContent: JourneyContent): string {
  const vocabList = journeyContent.block3?.vocabulary?.slice(0, 5).map(v => v.word).join(', ') || ''
  const expressionList = journeyContent.block4?.expressions?.slice(0, 3).map(e => e.text).join(', ') || ''
  
  const contextInfo = [
    `Journey: ${journeyContent.title}`,
    journeyContent.description,
    vocabList && `Key vocabulary: ${vocabList}`,
    expressionList && `Important expressions: ${expressionList}`,
  ]
    .filter(Boolean)
    .join('\n')

  return `You are WOA Talk's English conversation coach — warm, natural and encouraging.
Your role in this conversation:
1. Keep the entire conversation centered on the journey content below
2. Use vocabulary and expressions from the journey when possible
3. Understand the user even when they speak in Portuguese, but always respond in English
4. Encourage the user gently to speak in English when they answer in Portuguese
5. Guide the conversation with short, engaging prompts that feel relevant to the lesson content
6. Incorporate the journey's theme and topics naturally into the conversation

JOURNEY CONTENT:
${contextInfo}

IMPORTANT RULES:
- The entire response must be in English, including the feedback and the question
- The user may speak in Portuguese, but you must understand it and answer in English only
- If the user answers in Portuguese, say something like: "Try to answer in English next time" or "Good idea — let's keep it in English"
- Stay inside the journey theme throughout the entire session
- Keep feedback brief and helpful, not long or formal
- Use natural spoken English, not textbook language
- Always end your message with the next question in English
- Use vocabulary from the journey when appropriate

RESPONSE FORMAT (always follow this exactly):
FEEDBACK: [short English feedback — or empty if question 1]
QUESTION: [next question in English only]

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

  const { data: userData } = supabase
    ? await supabase.from('users').select('subscription_plan, subscription_status').eq('email', session.user.email ?? '').single()
    : { data: null }
  const plan: string | null = userData?.subscription_status === 'active' ? (userData?.subscription_plan ?? null) : null
  if (!plan) {
    return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
  }
  const model = plan.includes('premium') ? 'gpt-4o' : 'gpt-4o-mini'

  const body = await req.json()
  const { phaseId, history, userSpeech, questionNumber } = body as {
    phaseId: number
    history: ConversationTurn[]
    userSpeech: string
    questionNumber: number
  }

  if (!phaseId) {
    return NextResponse.json({ error: 'phaseId é obrigatório' }, { status: 400 })
  }

  // Busca o conteúdo da jornada do banco de dados
  let journeyContent: JourneyContent | null = null
  if (supabase) {
    const { data } = await supabase
      .from('journey_content')
      .select('*')
      .eq('phase_id', phaseId)
      .single()
    
    if (data) {
      journeyContent = data as JourneyContent
    }
  }

  if (!journeyContent) {
    return NextResponse.json(
      { error: 'journey_not_found' },
      { status: 404 }
    )
  }

  const systemPrompt = buildSystemPrompt(journeyContent)

  // Monta o histórico de mensagens para o GPT
  const messages: { role: 'system' | 'assistant' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(turn => ({ role: turn.role, content: turn.content })),
  ]

  // Adiciona a fala atual do usuário
  if (questionNumber > 0 && userSpeech) {
    messages.push({ role: 'user', content: userSpeech })
  }

  const completion = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: 200,
    temperature: 0.75,
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? ''
  const isComplete = questionNumber >= TOTAL_QUESTIONS

  const { feedback, question } = parseFeedbackAndQuestion(raw)

  return NextResponse.json({
    feedback,
    question,
    isComplete,
    questionNumber: questionNumber + 1,
  })
}
