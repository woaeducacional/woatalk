'use client'

import { useState, useRef } from 'react'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'

interface Activity1QuoteProps {
  onComplete: (xp: number) => void
}

const QUOTE = '"Do what you love, and you will never have to work a day in your life." — Confucius'

const CHOICES = [
  { id: 'A', text: 'I love spending time with my family.' },
  { id: 'B', text: 'I love listening to music.' },
  { id: 'C', text: 'I love watching movies.' },
]

const MODEL_SENTENCE = 'I love dancing because it makes me feel free.'

const FIRST_BLANKS = ['listening to music', 'spending time with my family', 'watching movies']
const SECOND_BLANKS = ['it helps me relax', 'it makes me happy', 'I feel good when I do it']

const BOOST_SENTENCE = 'I want to do what I love every day.'

type Stage =
  | 'quote'
  | 'listenChoice'
  | 'repeatChoice'
  | 'listenThink'
  | 'yourTurn'
  | 'listenBuilt'
  | 'repeatBuilt'
  | 'repeatNoAudio'
  | 'quickBoost'
  | 'boostRepeat'
  | 'boostNoAudio'
  | 'complete'

function speak(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rate
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

export function Activity1Quote({ onComplete }: Activity1QuoteProps) {
  const [stage, setStage] = useState<Stage>('quote')
  const [chosenSentence, setChosenSentence] = useState('')
  const [firstBlank, setFirstBlank] = useState('')
  const [secondBlank, setSecondBlank] = useState('')
  const [builtSentence, setBuiltSentence] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [xpEarned, setXpEarned] = useState(0)
  const [boostCount, setBoostCount] = useState(0)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')

  const calculateScore = (spoken: string, target: string): number => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    const spokenWords = normalize(spoken)
    const targetWords = normalize(target)
    if (targetWords.length === 0) return 0
    let matched = 0
    for (const w of targetWords) {
      if (spokenWords.includes(w)) matched++
    }
    return Math.round((matched / targetWords.length) * 100)
  }

  const handleListen = async (text: string) => {
    setIsPlaying(true)
    await speak(text)
    setIsPlaying(false)
  }

  const handleRecord = async (targetSentence: string, nextStage: Stage, xp: number) => {
    if (isRecording) return
    setError('')
    setTranscript('')

    const SpeechRecognitionAPI = getSpeechRecognition()
    if (!SpeechRecognitionAPI) {
      setError('Seu navegador não suporta reconhecimento de voz.')
      return
    }

    const rec = new SpeechRecognitionAPI()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true

    setIsRecording(true)
    transcriptRef.current = ''

    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    const resetSilence = () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      silenceTimer = setTimeout(() => rec.stop(), 3000)
    }

    rec.onresult = (event: any) => {
      resetSilence()
      const t = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      transcriptRef.current = t
      setTranscript(t)
    }

    rec.onend = () => {
      setIsRecording(false)
      if (silenceTimer) clearTimeout(silenceTimer)
      const s = calculateScore(transcriptRef.current, targetSentence)
      setScore(s)
      if (s >= 70) {
        setXpEarned((prev) => prev + xp)
        setTimeout(() => setStage(nextStage), 800)
      } else {
        setError(`Score: ${s}%. Tente novamente (mínimo 70%).`)
      }
    }

    rec.onerror = (e: any) => {
      setIsRecording(false)
      if (silenceTimer) clearTimeout(silenceTimer)
      if (e.error === 'no-speech') setError('Nenhuma fala detectada.')
      else if (e.error === 'not-allowed') setError('Microfone bloqueado.')
      else setError(`Erro: ${e.error}`)
    }

    recognitionRef.current = rec
    await rec.start()
    resetSilence()
  }

  // ─── STAGE: Quote + Choose ───
  if (stage === 'quote') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.08)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-2">💬 LET&apos;S REFLECT</p>
          <p className="text-white text-lg italic">{QUOTE}</p>
        </div>
        <p className="text-blue-200/80 text-center">👉 What do you love to do? Choose one:</p>
        <div className="space-y-3">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setChosenSentence(c.text); setStage('listenChoice') }}
              className="w-full p-4 rounded-xl text-left text-white font-medium transition-all hover:scale-[1.02] active:scale-95 border"
              style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.3)' }}
            >
              <span className="text-cyan-400 font-bold mr-2">{c.id})</span> {c.text}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── STAGE: Listen to chosen sentence ───
  if (stage === 'listenChoice') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-cyan-400/30 text-center" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-cyan-300 font-bold text-sm tracking-widest mb-3">🎧 LISTEN</p>
          <p className="text-white text-xl font-semibold mb-6">{chosenSentence}</p>
          <button
            onClick={async () => { await handleListen(chosenSentence); setStage('repeatChoice') }}
            disabled={isPlaying}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}
          >
            {isPlaying ? '🔊 Reproduzindo...' : '🎧 Ouvir'}
          </button>
        </div>
      </div>
    )
  }

  // ─── STAGE: Repeat chosen sentence ───
  if (stage === 'repeatChoice') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <p className="text-green-300 font-bold text-sm tracking-widest mb-3">🎤 REPEAT</p>
          <p className="text-white text-xl font-semibold mb-2">{chosenSentence}</p>
          {transcript && <p className="text-blue-200/60 text-sm mb-2">Você disse: &quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>Score: {score}%</p>}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={() => handleRecord(chosenSentence, 'listenThink', 10)}
            disabled={isRecording}
            className="mt-4 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🎤 Falar'}
          </button>
          <p className="text-blue-200/40 text-xs mt-2">+10 XP</p>
        </div>
      </div>
    )
  }

  // ─── STAGE: Listen & Think ───
  if (stage === 'listenThink') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-purple-400/30 text-center" style={{ background: 'rgba(147,51,234,0.06)' }}>
          <p className="text-purple-300 font-bold text-sm tracking-widest mb-3">🎧 LISTEN & THINK</p>
          <p className="text-blue-200/80 mb-4">👉 Listen to the sentence. Don&apos;t focus on details — just understand the idea.</p>
          <p className="text-white text-xl font-semibold mb-6">🎧 {MODEL_SENTENCE}</p>
          <button
            onClick={async () => { await handleListen(MODEL_SENTENCE); setStage('yourTurn') }}
            disabled={isPlaying}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #9333ea, #7c3aed)' }}
          >
            {isPlaying ? '🔊 Reproduzindo...' : '🎧 Ouvir'}
          </button>
        </div>
      </div>
    )
  }

  // ─── STAGE: Your Turn - Build sentence ───
  if (stage === 'yourTurn') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-3">🎤 YOUR TURN</p>
          <p className="text-blue-200/80 mb-4">👉 Build your sentence: <span className="text-white font-bold">I love ______ because ______.</span></p>
          
          <p className="text-cyan-300 text-sm font-bold mb-2">Choose your activity:</p>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {FIRST_BLANKS.map((b) => (
              <button
                key={b}
                onClick={() => setFirstBlank(b)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${firstBlank === b ? 'bg-cyan-500/30 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-blue-200/70'} border`}
              >
                {b}
              </button>
            ))}
          </div>

          <p className="text-yellow-300 text-sm font-bold mb-2">Choose your reason:</p>
          <div className="grid grid-cols-1 gap-2 mb-6">
            {SECOND_BLANKS.map((b) => (
              <button
                key={b}
                onClick={() => setSecondBlank(b)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${secondBlank === b ? 'bg-yellow-500/30 border-yellow-400 text-white' : 'bg-white/5 border-white/10 text-blue-200/70'} border`}
              >
                {b}
              </button>
            ))}
          </div>

          {firstBlank && secondBlank && (
            <div className="text-center">
              <p className="text-white text-lg font-semibold mb-4">
                &quot;I love {firstBlank} because {secondBlank}.&quot;
              </p>
              <button
                onClick={() => {
                  const s = `I love ${firstBlank} because ${secondBlank}.`
                  setBuiltSentence(s)
                  setXpEarned((prev) => prev + 10)
                  setStage('listenBuilt')
                }}
                className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                ✅ Confirmar (+10 XP)
              </button>
            </div>
          )}
        </div>
        <div className="p-4 rounded-lg border border-blue-400/20" style={{ background: 'rgba(0,100,255,0.06)' }}>
          <p className="text-blue-300 text-sm">💡 <strong>Need help?</strong> I love + activity because + reason</p>
        </div>
      </div>
    )
  }

  // ─── STAGE: Listen to built sentence ───
  if (stage === 'listenBuilt') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-cyan-400/30 text-center" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-cyan-300 font-bold text-sm tracking-widest mb-3">🎧 LISTEN → 🎤 REPEAT</p>
          <p className="text-blue-200/80 mb-2">👉 Listen to your sentence</p>
          <p className="text-white text-xl font-semibold mb-6">{builtSentence}</p>
          <button
            onClick={async () => { await handleListen(builtSentence); setStage('repeatBuilt') }}
            disabled={isPlaying}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}
          >
            {isPlaying ? '🔊 Reproduzindo...' : '🎧 Ouvir'}
          </button>
        </div>
      </div>
    )
  }

  // ─── STAGE: Repeat built sentence (with audio) ───
  if (stage === 'repeatBuilt') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <p className="text-green-300 font-bold text-sm tracking-widest mb-3">🎤 1ª VEZ — COM TEXTO</p>
          <p className="text-white text-xl font-semibold mb-2">{builtSentence}</p>
          {transcript && <p className="text-blue-200/60 text-sm mb-2">Você disse: &quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>Score: {score}%</p>}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={() => handleRecord(builtSentence, 'repeatNoAudio', 20)}
            disabled={isRecording}
            className="mt-4 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🎤 Repetir'}
          </button>
          <p className="text-blue-200/40 text-xs mt-2">+20 XP</p>
        </div>
      </div>
    )
  }

  // ─── STAGE: Repeat without audio ───
  if (stage === 'repeatNoAudio') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-orange-400/30 text-center" style={{ background: 'rgba(249,115,22,0.06)' }}>
          <p className="text-orange-300 font-bold text-sm tracking-widest mb-3">🧠 2ª VEZ — SEM TEXTO</p>
          <p className="text-blue-200/80 mb-4">👉 Agora diga sem ler! Lembre da frase.</p>
          {transcript && <p className="text-blue-200/60 text-sm mb-2">Você disse: &quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>Score: {score}%</p>}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={() => handleRecord(builtSentence, 'quickBoost', 25)}
            disabled={isRecording}
            className="mt-4 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🧠 Falar de memória'}
          </button>
          <p className="text-blue-200/40 text-xs mt-2">+25 XP</p>
        </div>
      </div>
    )
  }

  // ─── STAGE: Quick Boost ───
  if (stage === 'quickBoost') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-3">⚡ QUICK BOOST</p>
          <p className="text-blue-200/80 mb-2">👉 Add one more sentence:</p>
          <p className="text-white text-xl font-semibold mb-4">{BOOST_SENTENCE}</p>

          <button
            onClick={async () => {
              await handleListen(BOOST_SENTENCE)
              setStage('boostRepeat')
            }}
            disabled={isPlaying}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 mr-2"
            style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}
          >
            {isPlaying ? '🔊 Reproduzindo...' : '🎧 Ouvir'}
          </button>
        </div>
      </div>
    )
  }

  // ─── STAGE: Boost Repeat (with text) ───
  if (stage === 'boostRepeat') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <p className="text-green-300 font-bold text-sm tracking-widest mb-3">🎤 REPEAT</p>
          <p className="text-white text-xl font-semibold mb-2">{BOOST_SENTENCE}</p>
          {transcript && <p className="text-blue-200/60 text-sm mb-2">Você disse: &quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>Score: {score}%</p>}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={() => { setBoostCount(1); handleRecord(BOOST_SENTENCE, 'boostNoAudio', 0) }}
            disabled={isRecording}
            className="mt-4 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🎤 Repetir'}
          </button>
        </div>
      </div>
    )
  }

  // ─── STAGE: Boost without audio ───
  if (stage === 'boostNoAudio') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-orange-400/30 text-center" style={{ background: 'rgba(249,115,22,0.06)' }}>
          <p className="text-orange-300 font-bold text-sm tracking-widest mb-3">🧠 SAY WITHOUT LISTENING</p>
          <p className="text-blue-200/80 mb-4">👉 Diga as duas frases completas sem olhar:</p>
          {transcript && <p className="text-blue-200/60 text-sm mb-2">Você disse: &quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>Score: {score}%</p>}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={() => handleRecord(`${builtSentence} ${BOOST_SENTENCE}`, 'complete', 15)}
            disabled={isRecording}
            className="mt-4 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🧠 Falar tudo'}
          </button>
          <p className="text-blue-200/40 text-xs mt-2">+15 XP bônus</p>
        </div>
      </div>
    )
  }

  // ─── STAGE: Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Group Complete!</h3>
        <p className="text-blue-200/80 mb-4">Quote & Reflect concluído</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400">
            <p className="text-yellow-300 font-bold">+{xpEarned} XP</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400">
            <p className="text-yellow-300 font-bold">🪙 +5 WOA Coins</p>
          </div>
        </div>
        <button
          onClick={() => onComplete(xpEarned)}
          className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}
        >
          CONTINUAR →
        </button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
