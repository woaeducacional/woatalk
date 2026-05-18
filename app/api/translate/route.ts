import { NextRequest, NextResponse } from 'next/server'

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
  const { text } = await request.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  const { protected: safeText, restore } = protectProperNouns(text)

  // Primary: Google Translate (unofficial endpoint, sem token — mais confiável que MyMemory)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(safeText)}`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (response.ok) {
      const data = await response.json()
      // Resposta: [ [ ["translated","original",...], ... ], ... ]
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

  // Fallback 1: MyMemory
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(safeText)}&langpair=en|pt`
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

  // Fallback 2: HuggingFace Helsinki model
  const hfToken = process.env.HF_TOKEN
  if (hfToken) {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-pt',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: safeText }),
          signal: AbortSignal.timeout(30000),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const translated = Array.isArray(data) ? data[0]?.translation_text : data?.translation_text
        if (translated && isValidTranslation(translated, safeText)) {
          return NextResponse.json({ translation: restore(translated) })
        }
      }
    } catch (e) {
      console.error('HuggingFace error:', e)
    }
  }

  return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
}
