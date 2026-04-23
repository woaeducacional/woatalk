import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { text } = await request.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  // Primary: MyMemory (free, no token, no cold start)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt`
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })

    if (response.ok) {
      const data = await response.json()
      const translated = data?.responseData?.translatedText

      if (translated && data?.responseStatus === 200) {
        return NextResponse.json({ translation: translated })
      }
    }
  } catch (e) {
    console.error('MyMemory error:', e)
  }

  // Fallback: HuggingFace Helsinki model
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
          body: JSON.stringify({ inputs: text }),
          signal: AbortSignal.timeout(30000),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const translated = Array.isArray(data) ? data[0]?.translation_text : data?.translation_text
        if (translated) {
          return NextResponse.json({ translation: translated })
        }
      }
    } catch (e) {
      console.error('HuggingFace error:', e)
    }
  }

  return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
}
