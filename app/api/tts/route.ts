import { NextRequest, NextResponse } from 'next/server'
import { AzureTTSProvider } from '@/lib/speech/azure'

export async function POST(request: NextRequest) {
  const { text, voice, rate } = await request.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) {
    return NextResponse.json({ error: 'Azure credentials not configured' }, { status: 503 })
  }

  try {
    const provider = new AzureTTSProvider(key, region)
    const audioBuffer = await provider.synthesize(text, { voice, rate })

    return new NextResponse(audioBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: `TTS error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}
