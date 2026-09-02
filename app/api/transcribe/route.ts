import { NextRequest, NextResponse } from 'next/server'
import { AzureSTTProvider } from '@/lib/speech/azure'

export async function POST(request: NextRequest) {
  console.log('🎤 [API] [PASSO 1] POST /api/transcribe recebido')
  
  let body: { audio?: string; mimeType?: string; language?: string }
  try {
    body = await request.json()
    console.log('🎤 [API] [PASSO 2] JSON parseado com sucesso')
  } catch (err) {
    console.error('🎤 [API] ❌ ERRO ao fazer parse JSON:', err)
    return NextResponse.json({ error: 'Formato de requisição inválido' }, { status: 400 })
  }

  if (!body?.audio) {
    console.error('🎤 [API] ❌ Nenhum áudio no body!')
    return NextResponse.json({ error: 'Nenhum áudio recebido' }, { status: 400 })
  }
  
  console.log('🎤 [API] [PASSO 3] ✅ Áudio recebido! Tamanho:', body.audio.length)

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  
  console.log('🎤 [API] [PASSO 4] Verificando credenciais Azure...')
  console.log('🎤 [API] [PASSO 4] AZURE_SPEECH_KEY existe:', !!key ? '✅ SIM' : '❌ NÃO')
  console.log('🎤 [API] [PASSO 4] AZURE_SPEECH_REGION:', region ? '✅ ' + region : '❌ NÃO DEFINIDA')
  
  if (!key || !region) {
    console.error('🎤 [API] ❌ CREDENCIAIS FALTANDO!')
    return NextResponse.json({ error: 'Azure credentials not configured' }, { status: 503 })
  }
  
  console.log('🎤 [API] [PASSO 5] ✅ Credenciais OK')

  try {
    console.log('🎤 [API] [PASSO 6] Decodificando base64 para buffer...')
    // Decodificar base64 para buffer
    const audioBuf = Buffer.from(body.audio, 'base64')
    console.log('🎤 [API] [PASSO 7] ✅ Buffer criado! Tamanho:', audioBuf.length, 'bytes')
    console.log('🎤 [API] [PASSO 7] Primeiros 4 bytes (WAV header):', audioBuf.slice(0, 4).toString('hex'))

    const language = body.language || 'en-US'
    console.log('🎤 [API] [PASSO 8] Language:', language)
    
    console.log('🎤 [API] [PASSO 9] 🔄 Chamando AzureSTTProvider.transcribe()...')
    const provider = new AzureSTTProvider(key, region)
    const transcript = await provider.transcribe(audioBuf, { language })
    
    console.log('🎤 [API] [PASSO 10] ✅ SUCESSO! Transcript:', transcript ? transcript.substring(0, 50) : '(vazio)')
    
    return NextResponse.json({ transcript: transcript || '' })
  } catch (error) {
    console.error('🎤 [API] ❌ ERRO DURANTE TRANSCRIÇÃO:', error instanceof Error ? error.message : error)
    if (error instanceof Error) {
      console.error('🎤 [API] Stack:', error.stack)
    }
    return NextResponse.json(
      { error: `Transcription error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 502 }
    )
  }
}

