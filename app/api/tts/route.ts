import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { text, voice, rate } = await request.json()
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) {
    return NextResponse.json({ error: 'Azure Speech not configured' }, { status: 500 })
  }

  const voiceName = voice === 'oliver' ? 'en-US-GuyNeural' : 'en-US-JennyNeural'
  const rateValue = rate === 'slow' ? '-40%' : '-25%'

  const ssml = `<speak version='1.0' xml:lang='en-US'>
    <voice name='${voiceName}'>
      <prosody rate='${rateValue}'>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</prosody>
    </voice>
  </speak>`

  const res = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      },
      body: ssml,
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Azure error: ${err}` }, { status: 502 })
  }

  const audioBuffer = await res.arrayBuffer()

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
