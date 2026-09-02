import { NextRequest, NextResponse } from 'next/server'
import { AzureSTTProvider } from '@/lib/speech/azure'

export async function POST(request: NextRequest) {
  let body: { audio?: string; mimeType?: string; language?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Formato de requisição inválido' }, { status: 400 })
  }

  if (!body?.audio) {
    return NextResponse.json({ error: 'Nenhum áudio recebido' }, { status: 400 })
  }

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) {
    console.error('Azure Speech Services credentials not configured:', {
      key: !!key,
      region: !!region,
    })
    return NextResponse.json({ error: 'Azure credentials not configured' }, { status: 503 })
  }

  try {
    // Decodificar base64 para buffer
    const audioBuf = Buffer.from(body.audio, 'base64')
    
    // Log para debug
    console.log('Transcription request:', {
      audioSize: audioBuf.length,
      mimeType: body.mimeType,
      language: body.language,
      keyLength: key.length,
      region,
    })

    const provider = new AzureSTTProvider(key, region)
    const language = body.language || 'en-US'
    const transcript = await provider.transcribe(audioBuf, { language })
    
    console.log('Transcription result:', { transcript, language })
    
    return NextResponse.json({ transcript: transcript || '' })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: `Transcription error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

