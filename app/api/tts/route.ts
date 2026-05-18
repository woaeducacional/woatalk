import { NextRequest, NextResponse } from 'next/server'
import { getTTSProvider, createTTSProvider, loadSpeechConfig } from '@/lib/speech'
import { AzureTTSProvider } from '@/lib/speech/azure'

export async function POST(request: NextRequest) {
  const { text, voice, rate } = await request.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  try {
    // Tenta usar o provider configurado
    try {
      const provider = getTTSProvider()
      const audioBuffer = await provider.synthesize(text, { voice, rate })
      
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch (primaryError) {
      console.warn('Primary TTS provider failed, falling back to Azure:', primaryError)
      
      // Fallback para Azure se o provider primário falhar
      const config = loadSpeechConfig()
      if (!config.azure.speechKey || !config.azure.speechRegion) {
        throw new Error('No fallback provider available: Azure credentials missing')
      }
      
      const azureProvider = new AzureTTSProvider(config.azure.speechKey, config.azure.speechRegion)
      const audioBuffer = await azureProvider.synthesize(text, { voice, rate })
      
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      {
        error: `TTS error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 502 }
    )
  }
}
