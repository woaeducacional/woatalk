import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

  // Determine file extension from mime type
  const isMP4 = audio.type?.includes('mp4') || audio.type?.includes('aac')
  const ext = isMP4 ? 'mp4' : 'webm'
  const filename = `recording.${ext}`

  // Try OpenAI Whisper first (if configured), then HuggingFace (free)
  const openaiKey = process.env.OPENAI_API_KEY
  const hfToken = process.env.HF_TOKEN

  if (openaiKey) {
    return transcribeWithOpenAI(audio, filename, openaiKey)
  }

  if (hfToken) {
    return transcribeWithHuggingFace(audio, hfToken)
  }

  return NextResponse.json(
    { error: 'Nenhuma API de transcrição configurada. Defina OPENAI_API_KEY ou HF_TOKEN no .env.local' },
    { status: 500 }
  )
}

async function transcribeWithOpenAI(audio: Blob, filename: string, apiKey: string) {
  const whisperForm = new FormData()
  whisperForm.append('file', audio, filename)
  whisperForm.append('model', 'whisper-1')
  whisperForm.append('language', 'en')
  whisperForm.append('response_format', 'json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: whisperForm,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[transcribe] OpenAI Whisper error:', err)
    return NextResponse.json({ error: 'Falha na transcrição' }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json({ transcript: data.text ?? '' })
}

async function transcribeWithHuggingFace(audio: Blob, token: string) {
  // Convert blob to ArrayBuffer for HuggingFace API
  const buffer = await audio.arrayBuffer()

  const res = await fetch(
    'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': audio.type || 'audio/mp4',
      },
      body: buffer,
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[transcribe] HuggingFace error:', err)
    return NextResponse.json({ error: 'Falha na transcrição' }, { status: 502 })
  }

  const data = await res.json()
  // HuggingFace returns { text: "..." }
  return NextResponse.json({ transcript: data.text ?? '' })
}
