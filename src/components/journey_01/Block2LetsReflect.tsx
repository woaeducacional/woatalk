'use client'

import { useState, useEffect } from 'react'
import { ListenRepeatQuestion, SpeakFromMemoryQuestion } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'

interface Block2LetsReflectProps {
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

const QUOTE = '"Do what you love, and you will never have to work a day in your life." — Confucius'
const QUOTE_PT = '"Faça o que você ama e nunca terá que trabalhar um dia na sua vida." — Confúcio'

const CHOICES = [
  { id: 'A', text: 'I love spending time with my family.', pt: 'Eu adoro passar tempo com minha família.' },
  { id: 'B', text: 'I love listening to music.', pt: 'Eu adoro ouvir música.' },
  { id: 'C', text: 'I love watching movies.', pt: 'Eu adoro assistir filmes.' },
]

const MODEL_SENTENCE = 'I love dancing because it makes me feel free.'
const MODEL_SENTENCE_PT = 'Eu adoro dançar porque me sinto livre.'

const FIRST_BLANKS = ['listening to music', 'spending time with my family', 'watching movies']
const SECOND_BLANKS = ['it helps me relax', 'it makes me happy', 'I feel good when I do it']

const FIRST_BLANKS_PT: Record<string, string> = {
  'listening to music': 'ouvir música',
  'spending time with my family': 'passar tempo com minha família',
  'watching movies': 'assistir filmes',
}
const SECOND_BLANKS_PT: Record<string, string> = {
  'it helps me relax': 'me ajuda a relaxar',
  'it makes me happy': 'me deixa feliz',
  'I feel good when I do it': 'me sinto bem quando faço isso',
}

const BOOST_SENTENCE = 'I want to do what I love every day.'
const BOOST_SENTENCE_PT = 'Eu quero fazer o que amo todos os dias.'

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

export function Block2LetsReflect({ onComplete, onActivityChange, alreadyCompleted = false }: Block2LetsReflectProps) {
  const [stage, setStage] = useState<Stage>(() => {
    const RESTORE: Partial<Record<Stage, Stage>> = { repeatNoAudio: 'yourTurn', boostNoAudio: 'quickBoost' }
    const s = getCookie('woa_b2_stage') as Stage | null
    if (s && s !== 'complete') return RESTORE[s] ?? s
    return 'quote'
  })
  const [chosenSentence, setChosenSentence] = useState('')
  const [chosenSentencePt, setChosenSentencePt] = useState('')
  const [firstBlank, setFirstBlank] = useState('')
  const [secondBlank, setSecondBlank] = useState('')
  const [builtSentence, setBuiltSentence] = useState(() => getCookie('woa_b2_built') ?? '')
  const [isPlaying, setIsPlaying] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)

  const STAGE_INDEX: Record<Stage, number> = { quote:1, listenChoice:2, listenThink:3, yourTurn:4, listenBuilt:5, repeatNoAudio:6, quickBoost:7, boostNoAudio:8, complete:8 }
  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 8)
    if (stage !== 'complete') setCookie('woa_b2_stage', stage)
  }, [stage])
  const handleListen = async (text: string) => {
    setIsPlaying(true)
    await speak(text)
    setIsPlaying(false)
  }

  const handleChoiceListenRepeatComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('listenThink')
  }

  const handleBuiltListenRepeatComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('repeatNoAudio')
  }

  const handleBoostListenRepeatComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('boostNoAudio')
  }

  // ─── STAGE: Quote + Choose ───
  if (stage === 'quote') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.08)' }}>
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">💬 VAMOS REFLETIR</p>
          <p className="text-white/40 text-[10px] mb-2">Vamos refletir</p>
          <p className="text-white text-lg italic">{QUOTE}</p>
          <p className="text-white/35 text-xs italic mt-1">{QUOTE_PT}</p>
        </div>
        <p className="text-blue-200/80 text-center">👉 O que você ama fazer? Escolha um:</p>
        <div className="space-y-3">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setChosenSentence(c.text); setChosenSentencePt(c.pt); setStage('listenChoice') }}
              className="w-full p-4 rounded-xl text-left text-white font-medium transition-all hover:scale-[1.02] active:scale-95 border"
              style={{ background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.3)' }}
            >
              <span className="text-cyan-400 font-bold mr-2">{c.id})</span> {c.text}
              <p className="text-white/35 text-xs mt-0.5 ml-5">{c.pt}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── STAGE: Listen + Repeat chosen sentence ───
  if (stage === 'listenChoice') {
    return (
      <ListenRepeatQuestion
        sentences={[chosenSentence]}
        stepLabel="Ouça e Repita"
        title="Sua Escolha"
        icon="🎧"
        xpReward={10}
        onComplete={handleChoiceListenRepeatComplete}
        onBack={() => setStage('quote')}
      />
    )
  }

  // ─── STAGE: Listen & Think ───
  if (stage === 'listenThink') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-purple-400/30 text-center" style={{ background: 'rgba(147,51,234,0.06)' }}>
          <p className="text-purple-300 font-bold text-sm tracking-widest mb-0.5">🎧 OUÇA E PENSE</p>
          <p className="text-white/40 text-[10px] mb-3">Ouça e pense</p>
          <p className="text-blue-200/80 mb-4">👉 Ouça a frase. Não foque nos detalhes — apenas entenda a ideia.</p>
          <p className="text-white text-xl font-semibold mb-1">🎧 {MODEL_SENTENCE}</p>
          <p className="text-white/35 text-xs mb-6">{MODEL_SENTENCE_PT}</p>
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
          <p className="text-yellow-300 font-bold text-sm tracking-widest mb-0.5">🎤 SUA VEZ</p>
          <p className="text-white/40 text-[10px] mb-3">Sua vez</p>
          <p className="text-blue-200/80 mb-4">👉 Monte sua frase: <span className="text-white font-bold">I love ______ because ______.</span></p>
          
          <p className="text-cyan-300 text-sm font-bold mb-2">Escolha sua atividade:</p>
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

          <p className="text-yellow-300 text-sm font-bold mb-2">Escolha seu motivo:</p>
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
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-white text-lg font-semibold">
                  &quot;I love {firstBlank} because {secondBlank}.&quot;
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
                >
                  ?
                </button>
              </div>
              {showTranslation && (
                <p className="text-white/40 text-sm mb-4 -mt-2">
                  &quot;Eu adoro {FIRST_BLANKS_PT[firstBlank]} porque {SECOND_BLANKS_PT[secondBlank]}.&quot;
                </p>
              )}
              <button
                onClick={() => {
                  const s = `I love ${firstBlank} because ${secondBlank}.`
                  setBuiltSentence(s)
                  setCookie('woa_b2_built', s)
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
          <p className="text-blue-300 text-sm">💡 <strong>Precisa de ajuda?</strong> I love + activity because + reason</p>
        </div>
      </div>
    )
  }

  // ─── STAGE: Listen + Repeat built sentence ───
  if (stage === 'listenBuilt') {
    return (
      <ListenRepeatQuestion
        sentences={[builtSentence]}
        stepLabel="Ouça e Repita"
        title="Sua Frase"
        icon="🎧"
        xpReward={20}
        onComplete={handleBuiltListenRepeatComplete}
        onBack={() => setStage('yourTurn')}
      />
    )
  }

  // ─── STAGE: Repeat without audio ───
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

  // ─── STAGE: Quick Boost ───
  if (stage === 'quickBoost') {
    return (
      <ListenRepeatQuestion
        sentences={[BOOST_SENTENCE]}
        stepLabel="⚡ Extra Rápido"
        title="Frase Extra"
        icon="⚡"
        xpReward={0}
        onComplete={handleBoostListenRepeatComplete}
      />
    )
  }

  // ─── STAGE: Boost without audio ───
  if (stage === 'boostNoAudio') {
    return (
      <SpeakFromMemoryQuestion
        sentences={[builtSentence, BOOST_SENTENCE]}
        stepLabel="Sem Áudio — Bônus"
        title="Fale em Inglês!"
        icon="🔥"
        instruction="Diga uma das duas frases que você praticou — sem ouvir!"
        xpReward={15}
        onComplete={(xp) => { setXpEarned((p) => p + xp); setStage('complete') }}
      />
    )
  }

  // ─── STAGE: Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Grupo Concluído!</h3>
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
          onClick={() => { deleteCookie('woa_b2_stage'); deleteCookie('woa_b2_built'); onComplete(alreadyCompleted ? 0 : xpEarned) }}
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
