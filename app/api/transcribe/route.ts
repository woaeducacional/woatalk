import { NextRequest, NextResponse } from 'next/server'

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

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) {
    return NextResponse.json({ error: 'Azure Speech não configurado' }, { status: 500 })
  }

  const audioBuf = Buffer.from(body.audio, 'base64')

  // Azure STT REST endpoint — audio must be WAV PCM 16kHz (converted client-side)
  const res = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=simple`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Accept': 'application/json',
      },
      body: audioBuf,
    }
  )

  const text = await res.text()
  if (!res.ok) {
    return NextResponse.json({ error: `Azure STT erro: ${text}` }, { status: 502 })
  }

  let data: { RecognitionStatus?: string; DisplayText?: string }
  try {
    data = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Resposta inválida do Azure' }, { status: 502 })
  }

  if (data.RecognitionStatus !== 'Success') {
    // No speech detected — return empty transcript instead of error so UI handles gracefully
    return NextResponse.json({ transcript: '' })
  }

  return NextResponse.json({ transcript: data.DisplayText ?? '' })
}

