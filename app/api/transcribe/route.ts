import { NextRequest, NextResponse } from 'next/server'
import { getSTTProvider, resetProviders, createSTTProvider, loadSpeechConfig } from '@/lib/speech'
import { AzureSTTProvider } from '@/lib/speech/azure'

export async function POST(request: NextRequest) {
  let body: { audio?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Formato de requisição inválido' }, { status: 400 })
  }

  if (!body?.audio) {
    return NextResponse.json({ error: 'Nenhum áudio recebido' }, { status: 400 })
  }

  try {
    const audioBuf = Buffer.from(body.audio, 'base64')
    
    // Tenta usar o provider configurado
    try {
      const provider = getSTTProvider()
      const transcript = await provider.transcribe(audioBuf, { language: 'en-US' })
      return NextResponse.json({ transcript: transcript || '' })
    } catch (primaryError) {
      console.warn('Primary STT provider failed, falling back to Azure:', primaryError)
      
      // Fallback para Azure se o provider primário falhar
      const config = loadSpeechConfig()
      if (!config.azure.speechKey || !config.azure.speechRegion) {
        throw new Error('No fallback provider available: Azure credentials missing')
      }
      
      const azureProvider = new AzureSTTProvider(config.azure.speechKey, config.azure.speechRegion)
      const transcript = await azureProvider.transcribe(audioBuf, { language: 'en-US' })
      return NextResponse.json({ transcript: transcript || '' })
    }
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      {
        error: `Transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 502 }
    )
  }
}

