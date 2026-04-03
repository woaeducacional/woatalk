'use client'

import { useState, useRef } from 'react'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'

interface Activity4ConversationProps {
  onComplete: (xp: number) => void
}

type Stage = 'write' | 'translate' | 'listen' | 'repeat' | 'understand' | 'speakFree' | 'complete'

function tts(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = rate
    u.onend = () => resolve(); u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

export function Activity4Conversation({ onComplete }: Activity4ConversationProps) {
  const [stage, setStage] = useState<Stage>('write')
  const [portugueseText, setPortugueseText] = useState('')
  const [englishText, setEnglishText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [repeatIdx, setRepeatIdx] = useState(0)
  const [sentences, setSentences] = useState<string[]>([])
  const [showText, setShowText] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [xpEarned, setXpEarned] = useState(0)
  const [speakFreeIdx, setSpeakFreeIdx] = useState(0)
  const transcriptRef = useRef('')

  const calcScore = (spoken: string, target: string): number => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    const a = norm(spoken), b = norm(target)
    if (b.length === 0) return 0
    let m = 0; for (const w of b) if (a.includes(w)) m++
    return Math.round((m / b.length) * 100)
  }

  const record = async (target: string, onPass: () => void, threshold = 70) => {
    if (isRecording) return
    setError(''); setTranscript(''); setScore(0)
    const API = getSpeechRecognition()
    if (!API) { setError('Speech Recognition not supported.'); return }

    const rec = new API()
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
    setIsRecording(true); transcriptRef.current = ''

    let timer: ReturnType<typeof setTimeout> | null = null
    const resetT = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => rec.stop(), 4000) }

    rec.onresult = (e: any) => { resetT(); const t = Array.from(e.results).map((r: any) => r[0].transcript).join(''); transcriptRef.current = t; setTranscript(t) }
    rec.onend = () => { setIsRecording(false); if (timer) clearTimeout(timer); const s = calcScore(transcriptRef.current, target); setScore(s); if (s >= threshold) { setTimeout(onPass, 600) } else { setError(`Score: ${s}%. Mínimo ${threshold}%. Tente de novo.`) } }
    rec.onerror = (e: any) => { setIsRecording(false); if (timer) clearTimeout(timer); setError(e.error === 'no-speech' ? 'Nenhuma fala detectada.' : `Erro: ${e.error}`) }

    await rec.start(); resetT()
  }

  const translateWithAI = async (text: string): Promise<string> => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) throw new Error('Translation failed')
    const data = await response.json()
    return data.translation
  }

  // ─── Step 1: Write in Portuguese ───
  if (stage === 'write') {
    const wordCount = portugueseText.trim().split(/\s+/).filter(Boolean).length
    const canAdvance = wordCount >= 10
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.05)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">🏆 CONVERSATION CHALLENGE</p>
          <p className="text-white/40 text-[10px] mb-1">Desafio de Conversão</p>
          <p className="text-blue-200/60 text-xs mb-4">👉 🇺🇸 What do you like to do in your free time?  |  🇧🇷 O que você gosta de fazer no seu tempo livre?</p>

          <p className="text-blue-200/80 mb-1 text-sm">✍️ <strong>Step 1 — Escreva em Português</strong> (3–4 linhas):</p>
          <ul className="text-blue-200/50 text-xs mb-3 space-y-0.5 pl-4 list-disc">
            <li>O que você gosta de fazer</li>
            <li>Por que você gosta</li>
            <li>Quando e com quem você faz isso</li>
          </ul>

          <div className="p-3 rounded-lg border border-white/10 mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-blue-200/40 text-[10px] tracking-widest mb-1">💡 EXEMPLO</p>
            <p className="text-blue-200/50 text-xs leading-relaxed italic">
              Eu gosto de dançar porque me sinto livre e feliz, a música me ajuda a esquecer os problemas do dia a dia, eu geralmente faço isso nos finais de semana com meus amigos e às vezes danço sozinho para relaxar.
            </p>
          </div>

          <textarea
            value={portugueseText}
            onChange={(e) => setPortugueseText(e.target.value)}
            placeholder="No meu tempo livre, eu gosto de..."
            rows={5}
            className="w-full p-4 rounded-lg bg-white/5 border border-white/20 text-white placeholder-blue-200/30 resize-none"
          />
          <p className={`text-xs mt-1 ${canAdvance ? 'text-green-400/70' : 'text-blue-200/40'}`}>
            {wordCount} palavras {canAdvance ? '✓' : `(mínimo 10)`}
          </p>

          <button
            onClick={() => { setXpEarned(p => p + 20); setStage('translate') }}
            disabled={!canAdvance}
            className="mt-4 w-full py-3 rounded-xl font-bold text-white transition-all"
            style={{
              background: canAdvance ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)',
              opacity: canAdvance ? 1 : 0.5,
              cursor: canAdvance ? 'pointer' : 'not-allowed',
            }}
          >
            🔄 TRADUZIR →
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 2: Translate ───
  if (stage === 'translate') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">🔄 STEP 2 — TRANSLATE WITH AI</p>
          <p className="text-white/40 text-[10px] mb-1">Traduza com Inteligência Artificial</p>
          <p className="text-blue-200/50 text-xs mb-4">Seu texto será traduzido para o inglês 🇺🇸</p>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
            <p className="text-blue-200/60 text-xs mb-1">🇧🇷 Seu texto:</p>
            <p className="text-white text-sm">{portugueseText}</p>
          </div>

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          {!englishText ? (
            <button
              onClick={async () => {
                setIsTranslating(true)
                setError('')
                try {
                  const translated = await translateWithAI(portugueseText)
                  setEnglishText(translated)
                  const sents = translated.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 3)
                  setSentences(sents.length > 0 ? sents : [translated])
                  setXpEarned(p => p + 10)
                } catch {
                  setError('Erro ao traduzir. Verifique sua conexão e tente novamente.')
                } finally {
                  setIsTranslating(false)
                }
              }}
              disabled={isTranslating}
              className="w-full py-4 rounded-xl font-bold text-white hover:scale-105 transition-all text-lg"
              style={{ background: isTranslating ? '#666' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              {isTranslating ? '⏳ Traduzindo...' : '🌍 Traduzir'}
            </button>
          ) : (
            <div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/30 mb-4">
                <p className="text-green-300 text-xs mb-1">🇺🇸 English version:</p>
                <p className="text-white text-sm">{englishText}</p>
              </div>
              <p className="text-blue-200/40 text-xs mb-3">+10 XP pela tradução</p>
              <button onClick={() => { setRepeatIdx(0); setStage('listen') }} className="w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
                🎧 WOA METHOD →
              </button>
            </div>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 3: Listen (WOA Method) ───
  if (stage === 'listen') {
    const sent = sentences[repeatIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-cyan-400/30 text-center" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-cyan-300 font-bold text-sm mb-0.5">🎧 WOA — LISTEN ({repeatIdx + 1}/{sentences.length})</p>
          <p className="text-white/40 text-[10px] mb-1">Ouça com atenção</p>
          <div className="flex justify-center gap-1 mb-4">{['Listen', 'Repeat', 'Understand', 'Speak'].map((s, i) => (<span key={s} className={`px-2 py-1 text-xs rounded ${i === 0 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/5 text-white/30'}`}>{s}</span>))}</div>

          <p className="text-white text-lg font-semibold mb-6">{sent}</p>

          <button onClick={async () => { setIsPlaying(true); await tts(sent, 0.8); setIsPlaying(false) }} disabled={isPlaying} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
            {isPlaying ? '🔊 Playing...' : '🎧 Ouvir'}
          </button>

          <button onClick={() => { if (repeatIdx < sentences.length - 1) { setRepeatIdx(repeatIdx + 1) } else { setRepeatIdx(0); setStage('repeat') } }} className="block mx-auto mt-4 px-6 py-2 text-sm text-cyan-300 underline">
            Próxima →
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 4: Repeat ───
  if (stage === 'repeat') {
    const sent = sentences[repeatIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <p className="text-green-300 font-bold text-sm mb-0.5">🎤 WOA — REPEAT ({repeatIdx + 1}/{sentences.length})</p>
          <p className="text-white/40 text-[10px] mb-1">Repita em voz alta</p>
          <div className="flex justify-center gap-1 mb-4">{['Listen', 'Repeat', 'Understand', 'Speak'].map((s, i) => (<span key={s} className={`px-2 py-1 text-xs rounded ${i === 1 ? 'bg-green-500/30 text-green-300' : 'bg-white/5 text-white/30'}`}>{s}</span>))}</div>

          <p className="text-white text-lg font-semibold mb-4">{sent}</p>

          <button onClick={async () => { setIsPlaying(true); await tts(sent, 0.8); setIsPlaying(false) }} disabled={isPlaying} className="px-6 py-2 rounded-xl font-bold text-white mb-4 hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
            {isPlaying ? '🔊...' : '🎧 Ouvir'}
          </button>

          {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={() => record(sent, () => {
              setTranscript(''); setScore(0)
              if (repeatIdx < sentences.length - 1) setRepeatIdx(repeatIdx + 1)
              else { setXpEarned(p => p + 30); setRepeatIdx(0); setShowText(true); setStage('understand') }
            }, 70)}
            disabled={isRecording}
            className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🎤 Repetir'}
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 5: Understand ───
  if (stage === 'understand') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30 text-center" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm mb-0.5">💡 WOA — UNDERSTAND</p>
          <p className="text-white/40 text-[10px] mb-1">Entenda o significado</p>
          <div className="flex justify-center gap-1 mb-4">{['Listen', 'Repeat', 'Understand', 'Speak'].map((s, i) => (<span key={s} className={`px-2 py-1 text-xs rounded ${i === 2 ? 'bg-yellow-500/30 text-yellow-300' : 'bg-white/5 text-white/30'}`}>{s}</span>))}</div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4 text-left">
            <p className="text-blue-200/60 text-xs mb-1">Seu texto (PT):</p>
            <p className="text-white text-sm mb-3">{portugueseText}</p>
            <p className="text-blue-200/60 text-xs mb-1">English:</p>
            <p className="text-green-300 text-sm">{englishText}</p>
          </div>

          <p className="text-blue-200/60 text-sm mb-4">Compare the sentences. Can you understand each one?</p>

          <button onClick={async () => { setIsPlaying(true); await tts(englishText, 0.75); setIsPlaying(false) }} disabled={isPlaying} className="px-6 py-2 rounded-xl font-bold text-white mb-4 hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {isPlaying ? '🔊 Playing...' : '🎧 Ouvir tudo'}
          </button>

          <button onClick={() => { setRepeatIdx(0); setStage('speakFree') }} className="block mx-auto mt-2 px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            🎤 SPEAK — DESAFIO FINAL →
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 6: Speak without support (80% minimum) ───
  if (stage === 'speakFree') {
    const sent = sentences[speakFreeIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-red-400/30 text-center" style={{ background: 'rgba(239,68,68,0.06)' }}>
          <p className="text-red-300 font-bold text-sm mb-0.5">🔥 WOA — SPEAK ({speakFreeIdx + 1}/{sentences.length})</p>
          <p className="text-white/40 text-[10px] mb-1">Fale livremente</p>
          <div className="flex justify-center gap-1 mb-4">{['Listen', 'Repeat', 'Understand', 'Speak'].map((s, i) => (<span key={s} className={`px-2 py-1 text-xs rounded ${i === 3 ? 'bg-red-500/30 text-red-300' : 'bg-white/5 text-white/30'}`}>{s}</span>))}</div>

          {showText && <p className="text-white/30 text-sm mb-2 italic">Hint: {sent}</p>}
          <button onClick={() => setShowText(!showText)} className="text-xs text-blue-200/40 underline mb-4 block mx-auto">
            {showText ? 'Esconder dica' : 'Mostrar dica'}
          </button>

          <p className="text-blue-200/80 mb-4">Diga a frase sem ouvir (mínimo 80%):</p>

          {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 80 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={() => record(sent, () => {
              setTranscript(''); setScore(0); setShowText(false)
              if (speakFreeIdx < sentences.length - 1) setSpeakFreeIdx(speakFreeIdx + 1)
              else { setXpEarned(p => p + 40); setStage('complete') }
            }, 80)}
            disabled={isRecording}
            className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #dc2626, #991b1b)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🎤 Falar sem apoio'}
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Conversation Challenge Complete!</h3>
        <p className="text-blue-200/80 mb-2">Parabéns! Você completou o WOA Method!</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +15 WOA Coins</p></div>
        </div>
        <button onClick={() => onComplete(xpEarned)} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>FINALIZAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
