import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import openai from '@/src/lib/openaiClient'
import { supabase } from '@/src/lib/supabaseClient'

/**
 * POST /api/pronunciation/topic-chat
 *
 * Recebe o tópico, o histórico da conversa e a última fala do usuário.
 * Retorna:
 *  - feedback: correção de pronúncia da fala do usuário (em PT-BR)
 *  - nextQuestion: próxima pergunta em inglês (ou null se for a última)
 *  - isComplete: true quando as 10 perguntas foram feitas
 */

const TOTAL_QUESTIONS = 10

// Mapa de temas para contexto do GPT
const TOPIC_CONTEXT: Record<string, string> = {
  viagens:     'travel, destinations, vacation experiences, airports, hotels, tourist attractions',
  trabalho:    'work, career, job interviews, office life, professional skills, business English',
  cotidiano:   'daily life, routines, shopping, food, weather, hobbies, family',
  english_tips:'English learning tips, grammar, vocabulary strategies, common mistakes, study methods',
}

interface ConversationTurn {
  role: 'assistant' | 'user'
  content: string
}

/**
 * Separa o feedback em PT da pergunta em EN.
 * Tenta primeiro os marcadores FEEDBACK:/QUESTION:.
 * Fallback: divide na última frase que termina com "?" (a pergunta em inglês).
 */
/** Remove prefixos como "FEEDBACK: " ou "QUESTION: " do início de uma string */
function stripMarker(s: string): string {
  return s.replace(/^(FEEDBACK|QUESTION):\s*/i, '').trim()
}

function parseFeedbackAndQuestion(raw: string): { feedback: string; question: string } {
  // 1. Tenta marcadores estruturados (FEEDBACK: ... QUESTION: ...)
  const feedbackMatch = raw.match(/FEEDBACK:\s*([\s\S]*?)(?=QUESTION:|$)/i)
  const questionMatch = raw.match(/QUESTION:\s*([\s\S]*?)$/i)
  if (feedbackMatch && questionMatch && questionMatch[1].trim()) {
    return { feedback: feedbackMatch[1].trim(), question: questionMatch[1].trim() }
  }

  // 2. Só QUESTION: sem FEEDBACK: (ex: primeira pergunta)
  const onlyQuestion = raw.match(/^QUESTION:\s*([\s\S]+)$/i)
  if (onlyQuestion) {
    return { feedback: '', question: onlyQuestion[1].trim() }
  }

  // 3. Fallback: separa na última frase que termina com ?
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

  // 4. Último recurso: tudo é a pergunta
  return { feedback: '', question: stripMarker(raw) }
}

/** Monta o prompt do sistema para o chat de pronúncia */
function buildSystemPrompt(topic: string, topicContext: string): string {
  return `You are WOA Talk's English conversation coach — warm, natural and encouraging.
Your role in this conversation:
1. Keep the entire conversation centered on the topic: ${topic} (${topicContext})
2. Understand the user even when they speak in Portuguese, but always respond in English
3. Encourage the user gently to speak in English when they answer in Portuguese
4. Keep the tone natural, realistic, and conversational, like a real English-speaking partner
5. Guide the conversation with short, engaging prompts that feel relevant to the theme

IMPORTANT RULES:
- The entire response must be in English, including the feedback and the question
- The user may speak in Portuguese, but you must understand it and answer in English only
- If the user answers in Portuguese, say something like: "Try to answer in English next time" or "Good idea — let's keep it in English"
- Stay inside the same theme throughout the entire session
- Do not jump to unrelated topics
- Keep feedback brief and helpful, not long or formal
- Use natural spoken English, not textbook language
- Always end your message with the next question in English

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
  const { topic, history, userSpeech, questionNumber } = body as {
    topic: string
    history: ConversationTurn[]
    userSpeech: string
    questionNumber: number
  }

  if (!topic) {
    return NextResponse.json({ error: 'topic é obrigatório' }, { status: 400 })
  }

  const topicContext = TOPIC_CONTEXT[topic] ?? topic
  const systemPrompt = buildSystemPrompt(topic, topicContext)

  // Monta o histórico de mensagens para o GPT
  const messages: { role: 'system' | 'assistant' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(turn => ({ role: turn.role, content: turn.content })),
  ]

  // Adiciona a fala atual do usuário (se não for a pergunta inicial)
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
