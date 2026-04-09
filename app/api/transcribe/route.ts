import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai'

export async function POST(request: NextRequest) {
  let body: { audio?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Formato de requisição inválido' }, { status: 400 })
  }

  if (!body?.audio) {
    return NextResponse.json({ error: 'Nenhum áudio recebido' }, { status: 400 })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  const hfToken = process.env.HF_TOKEN
  if (!openaiKey && !hfToken) {
    return NextResponse.json(
      { error: 'Nenhuma API configurada. Defina OPENAI_API_KEY ou HF_TOKEN no .env.local' },
      { status: 500 }
    )
  }

  const mimeType = body.mimeType || 'audio/webm'
  const audioBuf = Buffer.from(body.audio, 'base64')
  const ext = mimeType === 'audio/ogg' ? 'ogg' : mimeType === 'audio/mp4' ? 'mp4' : 'webm'
  const filename = `recording.${ext}`

  try {
    if (openaiKey) {
      const openai = new OpenAI({ apiKey: openaiKey })
      const audioFile = await toFile(audioBuf, filename, { type: mimeType })
      const result = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
      })
      return NextResponse.json({ transcript: result.text ?? '' })
    }

    // Fallback: HuggingFace (gratuito)
    const hfRes = await fetch(
      'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: audioBuf.toString('base64'),
          parameters: { generate_kwargs: { language: 'english', task: 'transcribe' } },
        }),
      }
    )
    const hfText = await hfRes.text()
    if (!hfRes.ok) {
      return NextResponse.json({ error: `HuggingFace erro: ${hfText}` }, { status: 502 })
    }
    const hfJson = JSON.parse(hfText)
    return NextResponse.json({ transcript: hfJson.text ?? '' })
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    return NextResponse.json({ error: `Erro interno: ${msg}` }, { status: 500 })
  }
}
