'use client'

import { useState, useEffect } from 'react'
import { ListenRepeatQuestion, SpeakFromMemoryQuestion } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'
import type { Block2Content } from '@/lib/journeyContent'

interface Block2LetsReflectProps {
  content: Block2Content
  phaseId: number
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

type Stage =
  | 'quote'
  | 'listenChoice'
  | 'listenThink'
  | 'yourTurn'
  | 'listenBuilt'
  | 'repeatNoAudio'
  | 'quickBoost'
  | 'boostNoAudio'
  | 'complete'

async function speak(text: string): Promise<void> {
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

export function Block2LetsReflect({ content, phaseId, onComplete, onActivityChange, alreadyCompleted = false }: Block2LetsReflectProps) {
  const cookieKey = `woa_p${phaseId}_b2_stage`
  const builtCookieKey = `woa_p${phaseId}_b2_built`
  const [stage, setStage] = useState<Stage>(() => {
    const RESTORE: Partial<Record<Stage, Stage>> = { repeatNoAudio: 'yourTurn', boostNoAudio: 'quickBoost' }
    const s = getCookie(cookieKey) as Stage | null
    if (s && s !== 'complete') return RESTORE[s] ?? s
    return 'quote'
  })
  const [chosenSentence, setChosenSentence] = useState('')
  const [firstBlank, setFirstBlank] = useState('')
  const [secondBlank, setSecondBlank] = useState('')
  const [builtSentence, setBuiltSentence] = useState(() => getCookie(builtCookieKey) ?? '')
  const [isPlaying, setIsPlaying] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)

  const STAGE_INDEX: Record<Stage, number> = { quote:1, listenChoice:2, listenThink:3, yourTurn:4, listenBuilt:5, repeatNoAudio:6, quickBoost:7, boostNoAudio:8, complete:8 }
  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 8)
    if (stage !== 'complete') setCookie(cookieKey, stage)
  }, [stage])

  const handleListen = async (text: string) => { setIsPlaying(true); await speak(text); setIsPlaying(false) }

  // --- Quote + Choose ---
  if (stage === 'quote') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.08)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">💬 VAMOS REFLETIR</p>
          <p className="text-white/40 text-[10px] mb-2">Vamos refletir</p>
          <p className="text-white text-lg italic">{content.quote}</p>
          <p className="text-white/35 text-xs italic mt-1">{content.quotePt}</p>
        </div>
        <p className="text-blue-200/80 text-center">👉 {content.choicePrompt}</p>
        <div className="space-y-3">
          {content.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => { setChosenSentence(c.text); setStage('listenChoice') }}
              className="w-full p-4 rounded-xl text-left text-white font-medium transition-all hover:scale-[1.02] active:scale-95 border"
              style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.3)' }}
            >
              <span className="text-cyan-400 font-bold mr-2">{c.id})</span> {c.text}
              <p className="text-white/35 text-xs mt-0.5 ml-5">{c.pt}</p>
            </button>
          ))}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // --- Listen + Repeat chosen sentence ---
  if (stage === 'listenChoice') {
    return (
      <ListenRepeatQuestion
        sentences={[chosenSentence]}
        stepLabel="Ouça e Repita"
        title="Sua Motivação"
        icon="🎧"
        xpReward={10}
        onComplete={(xp) => { setXpEarned((p) => p + xp); setStage('listenThink') }}
        onBack={() => setStage('quote')}
      />
    )
  }

  // --- Listen & Think ---
  if (stage === 'listenThink') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-purple-400/30 text-center" style={{ background: 'rgba(147,51,234,0.06)' }}>
          <p className="text-purple-300 font-bold text-sm tracking-widest mb-0.5">🎧 OUÇA E PENSE</p>
          <p className="text-white/40 text-[10px] mb-3">Ouça e pense</p>
          <p className="text-blue-200/80 mb-4">👉 Ouça a frase. Não foque nos detalhes — apenas entenda a ideia.</p>
          <p className="text-white text-xl font-semibold mb-1">🎧 {content.modelSentence}</p>
          <p className="text-white/35 text-xs mb-6">{content.modelSentencePt}</p>
          <button
            onClick={async () => { await handleListen(content.modelSentence); setStage('yourTurn') }}
            disabled={isPlaying}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #9333ea, #7c3aed)' }}
          >
            {isPlaying ? '🔊 Reproduzindo...' : '🎧 Ouvir'}
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // --- Your Turn ---
  if (stage === 'yourTurn') {
    const templateDisplay = content.sentenceTemplate.replace('{first}', '______').replace('{second}', '______')
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">🎤 SUA VEZ</p>
          <p className="text-white/40 text-[10px] mb-3">Sua vez</p>
          <p className="text-blue-200/80 mb-4">👉 Monte sua frase: <span className="text-white font-bold">{templateDisplay}</span></p>

          <p className="text-cyan-300 text-sm font-bold mb-2">{content.firstBlanksLabel}</p>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {content.firstBlanks.map((b) => (
              <button key={b.en} onClick={() => setFirstBlank(b.en)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${firstBlank === b.en ? 'bg-cyan-500/30 border-cyan-400 text-white' : 'bg-white/5 border-white/10 text-blue-200/70'} border`}
              >{b.en}</button>
            ))}
          </div>

          <p className="text-yellow-300 text-sm font-bold mb-2">{content.secondBlanksLabel}</p>
          <div className="grid grid-cols-1 gap-2 mb-6">
            {content.secondBlanks.map((b) => (
              <button key={b.en} onClick={() => setSecondBlank(b.en)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${secondBlank === b.en ? 'bg-yellow-500/30 border-yellow-400 text-white' : 'bg-white/5 border-white/10 text-blue-200/70'} border`}
              >{b.en}</button>
            ))}
          </div>

          {firstBlank && secondBlank && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-white text-lg font-semibold">
                  &quot;{content.sentenceTemplate.replace('{first}', firstBlank).replace('{second}', secondBlank)}&quot;
                </p>
                <button
                  onClick={() => setShowTranslation((v) => !v)}
                  title="Ver tradução"
                  className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: showTranslation ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: showTranslation ? '#00D4FF' : 'rgba(255,255,255,0.4)',
                  }}
                >?</button>
              </div>
              {showTranslation && (
                <p className="text-white/40 text-sm mb-4 -mt-2">
                  &quot;{content.sentenceTemplatePt
                    .replace('{first}', content.firstBlanks.find(b => b.en === firstBlank)?.pt ?? '')
                    .replace('{second}', content.secondBlanks.find(b => b.en === secondBlank)?.pt ?? '')}&quot;
                </p>
              )}
              <button
                onClick={() => {
                  const s = content.sentenceTemplate.replace('{first}', firstBlank).replace('{second}', secondBlank)
                  setBuiltSentence(s)
                  setCookie(builtCookieKey, s)
                  setXpEarned((p) => p + 10)
                  setStage('listenBuilt')
                }}
                className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >✅ Confirmar (+10 XP)</button>
            </div>
          )}
        </div>
        <div className="p-4 rounded-lg border border-blue-400/20" style={{ background: 'rgba(0,100,255,0.06)' }}>
          <p className="text-blue-300 text-sm">💡 <strong>Precisa de ajuda?</strong> {content.helpText}</p>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // --- Listen + Repeat built sentence ---
  if (stage === 'listenBuilt') {
    return (
      <ListenRepeatQuestion
        sentences={[builtSentence]}
        stepLabel="Ouça e Repita"
        title="Sua Frase"
        icon="🎧"
        xpReward={20}
        onComplete={(xp) => { setXpEarned((p) => p + xp); setStage('repeatNoAudio') }}
        onBack={() => setStage('yourTurn')}
      />
    )
  }

  // --- Repeat without audio ---
  if (stage === 'repeatNoAudio') {
    return (
      <SpeakFromMemoryQuestion
        sentences={[builtSentence]}
        stepLabel="2ª Vez — Sem Texto"
        title="Fale de Memória"
        icon="🧠"
        instruction="Agora diga sua frase sem ler — de memória!"
        xpReward={25}
        onComplete={(xp) => { setXpEarned((p) => p + xp); setStage('quickBoost') }}
      />
    )
  }

  // --- Quick Boost ---
  if (stage === 'quickBoost') {
    return (
      <ListenRepeatQuestion
        sentences={[content.boostSentence]}
        stepLabel="⚡ Extra Rápido"
        title="Frase Extra"
        icon="⚡"
        xpReward={0}
        onComplete={() => setStage('boostNoAudio')}
      />
    )
  }

  // --- Boost without audio ---
  if (stage === 'boostNoAudio') {
    return (
      <SpeakFromMemoryQuestion
        sentences={[builtSentence, content.boostSentence]}
        stepLabel="Sem Áudio — Bônus"
        title="Fale em Inglês!"
        icon="🔥"
        instruction="Diga uma das duas frases que você praticou — sem ouvir!"
        xpReward={15}
        onComplete={(xp) => { setXpEarned((p) => p + xp); setStage('complete') }}
      />
    )
  }

  // --- Complete ---
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Grupo Concluído!</h3>
        <p className="text-blue-200/80 mb-4">Quote &amp; Reflect concluído</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +5 WOA Coins</p></div>
        </div>
        <button
          onClick={() => { deleteCookie(cookieKey); deleteCookie(builtCookieKey); onComplete(alreadyCompleted ? 0 : xpEarned) }}
          className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}
        >CONTINUAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
