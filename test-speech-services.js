/**
 * Simple test script para testar Speech Services
 * 
 * Uso:
 * 1. npm run dev (iniciar servidor)
 * 2. node test-speech-services.js
 */

const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3000'

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testSTT() {
  log('\n🎤 Testing STT (Speech-to-Text)...', 'cyan')

  try {
    // Este é um exemplo com áudio dummy
    // Em produção, você teria um arquivo de áudio real
    const dummyAudio = Buffer.alloc(1024, 0).toString('base64')

    const response = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: dummyAudio,
        mimeType: 'audio/wav',
      }),
    })

    const data = await response.json()

    if (response.ok) {
      log(`✅ STT endpoint working!`, 'green')
      log(`   Transcript: "${data.transcript || '(empty - dummy audio)'}"`, 'blue')
    } else {
      log(`❌ STT error: ${data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ STT test failed: ${error.message}`, 'red')
  }
}

async function testTTS() {
  log('\n🔊 Testing TTS (Text-to-Speech)...', 'cyan')

  try {
    const response = await fetch(`${BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello world, this is a test of the text to speech system.',
        voice: 'female',
        rate: 'normal',
      }),
    })

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer()
      const size = audioBuffer.byteLength

      log(`✅ TTS endpoint working!`, 'green')
      log(`   Audio size: ${(size / 1024).toFixed(2)} KB`, 'blue')

      // Salvar arquivo de áudio para teste
      const outputPath = path.join(__dirname, 'test-output.mp3')
      fs.writeFileSync(outputPath, Buffer.from(audioBuffer))
      log(`   Saved to: ${outputPath}`, 'blue')
    } else {
      const data = await response.json()
      log(`❌ TTS error: ${data.error}`, 'red')
    }
  } catch (error) {
    log(`❌ TTS test failed: ${error.message}`, 'red')
  }
}

async function checkProvider() {
  log('\n📋 Checking configured provider...', 'cyan')

  try {
    // Tentar fazer uma requisição e ver qual provider é usado
    const response = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: Buffer.alloc(100, 0).toString('base64'),
      }),
    })

    const data = await response.json()

    // Analisar mensagem de erro para determinar provider
    if (data.error) {
      if (data.error.includes('Azure')) {
        log('Using: Azure Speech Services', 'yellow')
      } else if (data.error.includes('Whisper')) {
        log('Using: Whisper (Local)', 'yellow')
      } else if (data.error.includes('openai-whisper')) {
        log('Using: Whisper (CLI)', 'yellow')
      }
    } else {
      log('Provider active and responding', 'green')
    }
  } catch (error) {
    log(`Could not determine provider: ${error.message}`, 'yellow')
  }
}

async function main() {
  log('\n===============================', 'cyan')
  log('🎙️  Speech Services Test Suite', 'cyan')
  log('===============================\n', 'cyan')

  log(`Testing: ${BASE_URL}`, 'blue')
  log('Make sure server is running: npm run dev\n', 'yellow')

  await checkProvider()
  await testSTT()
  await testTTS()

  log('\n===============================', 'cyan')
  log('✅ Tests complete!', 'green')
  log('===============================\n', 'cyan')
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red')
  process.exit(1)
})
