'use client'

import { useState, useEffect } from 'react'
import { deleteCookie } from '@/lib/utils'
import { ListenRepeatQuestion, SpeakFromMemoryQuestion } from '../questions_structs'

interface Block5WOAChallengeProps {
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

type Stage = 'write' | 'translate' | 'listen' | 'repeat' | 'understand' | 'speakFree' | 'complete'

async function tts(text: string): Promise<void> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('TTS failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    await new Promise<void>((resolve) => {
      const audio = new Audio(url)
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
      audio.play().catch(() => resolve())
    })
  } catch {
    await new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'; u.rate = 0.8
      u.onend = () => resolve(); u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    })
  }
}

const STAGE_INDEX: Record<Stage, number> = { write:1, translate:2, listen:3, repeat:4, understand:5, speakFree:6, complete:6 }

const LS_KEY = 'woa_b5_progress'

function loadProgress() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? 'null') } catch { return null }
}

function saveProgress(data: object) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function clearProgress() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LS_KEY)
  deleteCookie('woa_b5_stage')
}

export function Block5WOAChallenge({ onComplete, onActivityChange, alreadyCompleted = false }: Block5WOAChallengeProps) {
  const [stage, setStage] = useState<Stage>(() => {
    const saved = loadProgress()
    const s = saved?.stage as Stage | null
    if (s && s !== 'complete') return s
    return 'write'
  })
  const [portugueseText, setPortugueseText] = useState<string>(() => loadProgress()?.portugueseText ?? '')
  const [englishText, setEnglishText] = useState<string>(() => loadProgress()?.englishText ?? '')
  const [isTranslating, setIsTranslating] = useState(false)
  const [repeatIdx, setRepeatIdx] = useState(0)
  const [sentences, setSentences] = useState<string[]>(() => loadProgress()?.sentences ?? [])
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState('')
  const [xpEarned, setXpEarned] = useState<number>(() => loadProgress()?.xpEarned ?? 0)

  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 6)
    if (stage !== 'complete') {
      saveProgress({ stage, portugueseText, englishText, sentences, xpEarned })
    }
  }, [stage, portugueseText, englishText, sentences, xpEarned])


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

          <p className="text-blue-200/80 mb-1 text-sm">✍️ <strong>Passo 1 — Escreva em Português</strong> (3–4 linhas):</p>
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
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">🔄 PASSO 2 — TRADUZIR COM IA</p>
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
                <p className="text-green-300 text-xs mb-1">🇺🇸 Em inglês:</p>
                <p className="text-white text-sm">{englishText}</p>
              </div>
              <p className="text-blue-200/40 text-xs mb-3">+10 XP pela tradução</p>
              <button onClick={() => { setRepeatIdx(0); setStage('repeat') }} className="w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
                🎧 Método WOA →
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
          <div className="flex justify-center gap-1 mb-4">{['Ouça', 'Repita', 'Entenda', 'Fale'].map((s, i) => (<span key={s} className={`px-2 py-1 text-xs rounded ${i === 0 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/5 text-white/30'}`}>{s}</span>))}</div>

          <p className="text-white text-lg font-semibold mb-6">{sent}</p>

          <button onClick={async () => { setIsPlaying(true); await tts(sent); setIsPlaying(false) }} disabled={isPlaying} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
            {isPlaying ? '🔊 Tocando...' : '🎧 Ouvir'}
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
    return (
      <ListenRepeatQuestion
        sentences={sentences}
        onComplete={() => { setXpEarned(p => p + 30); setStage('understand') }}
        xpReward={30}
        icon="🎤"
        stepLabel="WOA — REPEAT"
        title="Repita as Frases"
        instruction="Ouça e repita cada frase:"
      />
    )
  }

  // ─── Step 5: Understand ───
  if (stage === 'understand') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30 text-center" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm mb-0.5">💡 WOA — UNDERSTAND</p>
          <p className="text-white/40 text-[10px] mb-1">Entenda o significado</p>
          <div className="flex justify-center gap-1 mb-4">{['Ouça', 'Repita', 'Entenda', 'Fale'].map((s, i) => (<span key={s} className={`px-2 py-1 text-xs rounded ${i === 2 ? 'bg-yellow-500/30 text-yellow-300' : 'bg-white/5 text-white/30'}`}>{s}</span>))}</div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-4 text-left">
            <p className="text-blue-200/60 text-xs mb-1">Seu texto (PT):</p>
            <p className="text-white text-sm mb-3">{portugueseText}</p>
            <p className="text-blue-200/60 text-xs mb-1">English:</p>
            <p className="text-green-300 text-sm">{englishText}</p>
          </div>

          <p className="text-blue-200/60 text-sm mb-4">Compare as frases. Você consegue entender cada uma?</p>

          <button onClick={async () => { setIsPlaying(true); await tts(englishText); setIsPlaying(false) }} disabled={isPlaying} className="px-6 py-2 rounded-xl font-bold text-white mb-4 hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {isPlaying ? '🔊 Tocando...' : '🎧 Ouvir tudo'}
          </button>

          <button onClick={() => { setRepeatIdx(0); setStage('speakFree') }} className="block mx-auto mt-2 px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            🎤 SPEAK — DESAFIO FINAL →
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Step 6: Speak without support ───
  if (stage === 'speakFree') {
    return (
      <SpeakFromMemoryQuestion
        sentences={sentences}
        onComplete={() => { setXpEarned(p => p + 40); setStage('complete') }}
        xpReward={40}
        stepLabel="WOA — SPEAK"
        title="Fale Sem Apoio"
        icon="🔥"
        instruction="Diga cada frase de memória — sem ouvir!"
      />
    )
  }

  // ─── Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Desafio de Conversação Concluído!</h3>
        <p className="text-blue-200/80 mb-2">Parabéns! Você completou o Método WOA!</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +15 WOA Coins</p></div>
        </div>
        <button onClick={() => { clearProgress(); onComplete(alreadyCompleted ? 0 : xpEarned) }} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>FINALIZAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
