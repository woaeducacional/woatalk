/**
 * POST /api/pronunciation/tip
 * Gera (ou retorna do cache) uma dica de pronúncia via GPT-4 mini.
 * Body: { sentence: string, wrongWords: { expected: string, spoken: string | null }[] }
 * Retorna: { tip: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import openai from '@/src/lib/openaiClient'
import { getCachedTip, cacheTip } from '@/src/services/pronunciation.service'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface WrongWord {
  expected: string
  spoken: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Formata a lista de palavras erradas para o prompt */
function formatWrongWords(words: WrongWord[]): string {
  return words
    .map(w => w.spoken
      ? `"${w.expected}" (você pronunciou: "${w.spoken}")`
      : `"${w.expected}" (não reconhecida)`
    )
    .join(', ')
}

/** Mensagem de sistema — define a persona proativa da coruja */
const SYSTEM_PROMPT = `Você é a Coruja de Pronúncia do WOA Talk.
Você é uma tutora proativa e carinhosa de inglês para brasileiros.
Você NÃO responde perguntas — você INICIA a aula sozinha, como uma professora que já sabe o que o aluno precisa.
Sempre comece EXATAMENTE com "Deixe eu te ajudar!" e ensine diretamente, sem esperar ser perguntada.
Use no máximo 80 palavras, fonética simples (ex: meet = "mít") e linguagem encorajadora.
Não mencione pontuações, acertos ou erros — apenas ensine a pronunciar.
Use emojis com moderação.
IMPORTANTE: NÃO use markdown, NÃO use asteriscos (**), NÃO use negrito. Escreva texto puro e simples.`

/** Monta a mensagem de contexto com os dados do exercício */
function buildUserContext(sentence: string, wrongWords: WrongWord[]): string {
  const wordList = wrongWords
    .map(w => w.spoken
      ? `- "${w.expected}" (o aluno disse: "${w.spoken}")`
      : `- "${w.expected}" (não reconhecida)`
    )
    .join('\n')

  return `Frase praticada: "${sentence}"
Palavras que precisam de atenção:
${wordList}

Inicie a aula agora.`
}

/** Chama o GPT-4 mini e retorna a dica gerada */
async function generateTipFromAI(sentence: string, wrongWords: WrongWord[]): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserContext(sentence, wrongWords) },
    ],
    max_tokens: 200,
    temperature: 0.75,
  })

  return completion.choices[0]?.message?.content?.trim() ?? ''
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Valida sessão
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { sentence, wrongWords } = body ?? {}

  if (!sentence || !Array.isArray(wrongWords) || wrongWords.length === 0) {
    return NextResponse.json({ error: 'sentence e wrongWords são obrigatórios' }, { status: 400 })
  }

  // Filtra apenas as palavras erradas
  const onlyWrong: WrongWord[] = wrongWords.filter((w: WrongWord) => w.expected)

  // Verifica cache para a primeira palavra errada (heurística: tip cobre o contexto da frase)
  const firstWord = onlyWrong[0]?.expected?.toLowerCase().replace(/[^a-z]/g, '')
  if (firstWord) {
    const cached = await getCachedTip(session.user.id, firstWord)
    // Invalida cache se contiver markdown (asteriscos) — força nova geração com prompt atualizado
    if (cached && !cached.includes('**')) {
      return NextResponse.json({ tip: cached, cached: true })
    }
  }

  // Gera dica nova via IA
  const tip = await generateTipFromAI(sentence, onlyWrong)
  if (!tip) {
    return NextResponse.json({ error: 'Falha ao gerar dica' }, { status: 500 })
  }

  // Cacheia a dica para cada palavra errada (evita chamadas futuras)
  if (firstWord) {
    await cacheTip(session.user.id, firstWord, tip).catch(() => {})
  }

  return NextResponse.json({ tip, cached: false })
}
