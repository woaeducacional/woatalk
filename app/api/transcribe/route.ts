import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Formato de requisição inválido' }, { status: 400 })
  }

  const audio = formData.get('audio') as Blob | null
  if (!audio) {
    return NextResponse.json({ error: 'Nenhum áudio recebido' }, { status: 400 })
  }

  // Monta o FormData para o Whisper
  const whisperForm = new FormData()
  whisperForm.append('file', audio, 'recording.webm')
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('language', 'en')
  whisperForm.append('response_format', 'json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: whisperForm,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[transcribe] Whisper error:', err)
    return NextResponse.json({ error: 'Falha na transcrição' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json({ transcript: data.text ?? '' })
}
