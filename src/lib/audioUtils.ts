/**
 * Audio conversion utilities for Azure Speech-to-Text compatibility.
 *
 * Azure STT REST API only accepts WAV (PCM), OGG (Opus) — NOT audio/webm or audio/mp4.
 * This module converts any browser-recorded audio Blob to WAV (PCM 16-bit, 16kHz, mono)
 * using the Web Audio API, ensuring Azure compatibility on all platforms.
 */

export async function blobToWavBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  let audioBuffer: AudioBuffer
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  } finally {
    await audioContext.close()
  }

  // Resample to 16kHz mono via OfflineAudioContext
  const targetRate = 16000
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(audioBuffer.duration * targetRate),
    targetRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineCtx.destination)
  source.start()
  const resampled = await offlineCtx.startRendering()
  const samples = resampled.getChannelData(0)

  const wavBuffer = encodeWav(samples, targetRate)
  return arrayBufferToBase64(wavBuffer)
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const dataLength = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')

  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)       // PCM
  view.setUint16(22, 1, true)       // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, bitsPerSample, true)

  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }

  return buffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  return btoa(binary)
}
