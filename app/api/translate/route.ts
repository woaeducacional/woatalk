import { NextRequest, NextResponse } from 'next/server'
import openai from '@/src/lib/openaiClient'

// Remove pontuação/espaços para comparação
function stripForCompare(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Verifica se a tradução é genuinamente diferente do original.
 * Rejeita quando:
 * 1. O texto normalizado é idêntico ao original (ex: "I am 25 years old." → "I am 25 years old")
 * 2. Todas as palavras significativas (>2 letras) da tradução já existem no original
 *    (ex: "my name is" → todas as palavras estão em "My name is John" → falhou)
 */
function isValidTranslation(translated: string, original: string): boolean {
  if (!translated) return false
  if (stripForCompare(translated) === stripForCompare(original)) return false

  const origWords = new Set(original.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/))
  const transWords = translated.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2)

  if (transWords.length === 0) return false

  // Se ≥ 80% das palavras da tradução existem no original → ainda é inglês
  const overlap = transWords.filter(w => origWords.has(w)).length
  if (overlap / transWords.length >= 0.8) return false

  return true
}

/**
 * Protege nomes próprios substituindo por placeholders antes de traduzir.
 * Detecta palavras capitalizadas que NÃO são a primeira palavra da frase
 * e não são o pronome "I".
 *
 * Ex: "My name is John Smith." → "My name is ZZZ0ZZZ ZZZ1ZZZ."
 * Após traduzir "Meu nome é ZZZ0ZZZ ZZZ1ZZZ." → "Meu nome é John Smith."
 */
function protectProperNouns(text: string): { protected: string; restore: (s: string) => string } {
  const map: Array<{ ph: string; name: string }> = []
  let idx = 0

  // Encontra palavras capitalizadas que não iniciam a frase:
  // precedidas por espaço (não início de string) e que não sejam "I" sozinho
  const protected_ = text.replace(/(?<=\s)([A-Z][a-z]+)/g, (match) => {
    if (match === 'I') return match
    const ph = `ZZZ${idx}ZZZ`
    map.push({ ph, name: match })
    idx++
    return ph
  })

  const restore = (translated: string) =>
    map.reduce((t, { ph, name }) => t.replaceAll(ph, name), translated)

  return { protected: protected_, restore }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { text, targetLang = 'pt' } = body
  const sourceLang = targetLang === 'en' ? 'pt' : 'en'

  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  // Primary: GPT-4o-mini — usa o texto original direto (sem proteção de nomes próprios)
  try {
    const targetLabel = targetLang === 'en' ? 'English' : 'Brazilian Portuguese'
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the user's text to ${targetLabel}. Return ONLY the translated text, no explanations, no quotes.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 500,
    })
    const translated = completion.choices[0]?.message?.content?.trim() ?? ''
    if (translated && isValidTranslation(translated, text)) {
      return NextResponse.json({ translation: translated })
    }
  } catch (e) {
    console.error('GPT-mini translate error:', e)
  }

  // Fallbacks usam proteção de nomes próprios (para evitar que o Google/MyMemory os altere)
  const { protected: safeText, restore } = protectProperNouns(text)

  // Fallback 1: Google Translate
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(safeText)}`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (response.ok) {
      const data = await response.json()
      const translated: string = Array.isArray(data?.[0])
        ? data[0].map((part: any[]) => part?.[0] ?? '').join('')
        : ''

      if (isValidTranslation(translated, safeText)) {
        return NextResponse.json({ translation: restore(translated) })
      }
    }
  } catch (e) {
    console.error('Google Translate error:', e)
  }

  // Fallback 2: MyMemory
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(safeText)}&langpair=${sourceLang}|${targetLang}`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (response.ok) {
      const data = await response.json()
      const translated = data?.responseData?.translatedText

      if (translated && data?.responseStatus === 200 && isValidTranslation(translated, safeText)) {
        return NextResponse.json({ translation: restore(translated) })
      }
    }
  } catch (e) {
    console.error('MyMemory error:', e)
  }

  return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
}
