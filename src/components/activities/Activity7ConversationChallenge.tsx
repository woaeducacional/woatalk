'use client'

import { useEffect, useState } from 'react'
import { playClick } from '@/lib/sounds'

interface Activity7ConversationChallengeProps {
  onComplete: (xp: number) => void
}

type Step = 'write' | 'translate' | 'practice' | 'final' | 'complete'

export function Activity7ConversationChallenge({ onComplete }: Activity7ConversationChallengeProps) {
  const [step, setStep] = useState<Step>('write')
  const [textPT, setTextPT] = useState('')
  const [textEN, setTextEN] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState('')
  const [practiceStep, setPracticeStep] = useState(0)
  const [listened, setListened] = useState(false)
  const [repeated, setRepeated] = useState(0)
  const [understood, setUnderstood] = useState(false)
  const [spoken, setSpoken] = useState(0)
  const [finalCompleted, setFinalCompleted] = useState(false)

  const handleWrite = () => {
    console.log('handleWrite called, textPT length:', textPT.length)
    if (textPT.length >= 30) {
      playClick()
      console.log('texto válido, mudando para step translate')
      setStep('translate')
    } else {
      console.log('texto curto demais')
    }
  }

  const handleTranslate = async () => {
    playClick()
    setIsTranslating(true)
    setTranslationError('')
    
    console.log('Iniciando tradução do texto:', textPT)
    
    try {
      const encodedText = encodeURIComponent(textPT)
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=pt|en`
      console.log('URL da API:', url)
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log('Resposta completa da API:', data)
      console.log('Campo translatedText:', data.responseData?.translatedText)
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText
        console.log('Tradução final:', translated)
        setTextEN(translated)
        setIsTranslating(false)
      } else {
        console.log('Erro: responseStatus não é 200 ou translatedText vazio')
        setTranslationError('Erro na tradução. Tente novamente.')
        setIsTranslating(false)
      }
    } catch (error) {
      console.error('Translation error:', error)
      setTranslationError('Falha ao conectar com o serviço de tradução.')
      setIsTranslating(false)
    }
  }

  const handleListen = () => {
    playClick()
    setListened(true)
  }

  const handleRepeat = () => {
    playClick()
    setRepeated(repeated + 1)
    if (repeated >= 2) {
      setPracticeStep(1)
      setListened(false)
      setRepeated(0)
    }
  }

  const handleUnderstood = () => {
    playClick()
    setUnderstood(true)
    setPracticeStep(2)
  }

  const handleSpeak = () => {
    playClick()
    setSpoken(spoken + 1)
    if (spoken >= 2) {
      setPracticeStep(3)
      setSpoken(0)
      setFinalCompleted(true)
    }
  }

  const handleFinal = () => {
    playClick()
    setStep('final')
  }

  if (step === 'write') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
            <span>🎯</span> Conversation Challenge
          </h2>
          <p className="text-base text-blue-200/80">💬 Let's reflect</p>
          <p className="text-base text-blue-200/80 italic">
            "Do what you love, and you will never have to work a day in your life." — Confucius
          </p>
          <p className="text-base text-blue-200/80 mt-4">👉 What do you love to do?</p>
        </div>

        <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
          <p className="text-sm text-cyan-400/60 mb-3 tracking-widest">✍️ Step 1 — Write (in Portuguese)</p>
          <p className="text-xs text-blue-200/50 mb-4">
            Include: O que você gosta / Por que / Quando você costuma fazer (3–4 linhas)
          </p>
          <textarea
            value={textPT}
            onChange={(e) => setTextPT(e.target.value)}
            placeholder="Escreva sua resposta aqui..."
            className="w-full px-4 py-3 h-32 rounded-lg bg-black/30 border border-cyan-400/30 text-blue-200 placeholder-blue-200/30 outline-none focus:border-cyan-400 resize-none"
          />
          <p className="text-xs text-blue-200/40 mt-2">
            {textPT.length} caracteres (mínimo 30)
          </p>
        </div>

        <button
          onClick={handleWrite}
          disabled={textPT.length < 30}
          className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: textPT.length >= 30
              ? 'linear-gradient(135deg, #003AB0, #0066FF)'
              : 'rgba(0,102,255,0.3)',
            border: '2px solid #00D4FF',
          }}
        >
          → TRANSLATE
        </button>
      </div>
    )
  }

  if (step === 'translate') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300">🔄 Step 2 — Translate with AI</h2>
          <p className="text-base text-blue-200/80">Seu texto será traduzido para o inglês</p>
        </div>

        {/* Portuguese */}
        <div className="p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
          <p className="text-xs text-cyan-400/60 mb-2 tracking-widest">PORTUGUÊS</p>
          <p className="text-base text-blue-200/90">{textPT}</p>
        </div>

        {/* English */}
        <div className="p-6 rounded-2xl backdrop-blur-md relative overflow-hidden" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(34,197,94,0.5)' }}>
          <p className="text-xs text-cyan-400/60 mb-2 tracking-widest">✨ ENGLISH (AI TRANSLATED)</p>
          {isTranslating ? (
            <p className="text-base text-blue-200/60 italic">Traduzindo...</p>
          ) : (
            <p className="text-base text-green-300/90">{textEN || '(Clique em TRADUZIR para gerar)'}</p>
          )}
        </div>

        {/* Translation button */}
        {!textEN && !isTranslating && (
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            {isTranslating ? '⏳ Traduzindo...' : '→ TRADUZIR'}
          </button>
        )}

        {/* Error message */}
        {translationError && (
          <div className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.5)' }}>
            <p className="text-red-400 text-sm text-center">{translationError}</p>
            <button
              onClick={handleTranslate}
              className="w-full mt-3 font-bold tracking-widest px-6 py-2 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(239,68,68,0.3)',
                border: '1px solid rgba(239,68,68,0.5)',
              }}
            >
              🔄 Tentar novamente
            </button>
          </div>
        )}

        {/* Practice button (only show after translation) */}
        {textEN && !isTranslating && (
          <button
            onClick={() => {
              playClick()
              setStep('practice')
            }}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            🎧 PRACTICE (WOA Method)
          </button>
        )}
      </div>
    )
  }

  if (step === 'practice') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300">🎧 Step 3 — Practice (WOA Method)</h2>
          <p className="text-sm text-blue-200/50">Agora pratique seguindo os passos:</p>
        </div>

        {/* Step 1 - Listen */}
        {practiceStep === 0 && (
          <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🟠</span>
              <div>
                <p className="text-lg font-bold text-orange-400">Step 1 — Listen</p>
                <p className="text-sm text-blue-200/60">Escutar com atenção na pronúncia</p>
              </div>
            </div>

            <div className="bg-black/30 p-6 rounded-lg mb-6">
              <p className="text-base text-blue-200/90 leading-relaxed">{textEN}</p>
            </div>

            <div className="space-y-2 mb-6">
              <button
                onClick={handleListen}
                className="w-full font-bold py-3 rounded-lg"
                style={{
                  background: listened ? 'rgba(34,197,94,0.2)' : 'rgba(0,102,255,0.1)',
                  border: listened ? '2px solid #22c55e' : '1px solid rgba(0,212,255,0.2)',
                }}
              >
                {listened ? '✅ Listened' : '🎧 Listen'}
              </button>
            </div>

            {listened && (
              <button
                onClick={handleRepeat}
                className="w-full font-bold tracking-widest px-6 py-3 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #003AB0, #0066FF)',
                  border: '2px solid #00D4FF',
                }}
              >
                🔁 REPEAT {repeated}/3
              </button>
            )}
          </div>
        )}

        {/* Step 2 - Understand */}
        {practiceStep === 1 && (
          <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🔁</span>
              <div>
                <p className="text-lg font-bold text-cyan-400">Step 2 — Repeat</p>
                <p className="text-sm text-blue-200/60">Escute e repita junto</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleListen}
                className="w-full font-bold py-3 rounded-lg"
                style={{
                  background: 'rgba(0,102,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.2)',
                }}
              >
                🎧 Listen Again
              </button>
              <button
                onClick={handleRepeat}
                className="w-full font-bold py-3 rounded-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #003AB0, #0066FF)',
                  border: '2px solid #00D4FF)',
                }}
              >
                🎤 REPEAT {repeated}/3
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Understand */}
        {practiceStep === 2 && (
          <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🧠</span>
              <div>
                <p className="text-lg font-bold text-cyan-400">Step 3 — Understand</p>
                <p className="text-sm text-blue-200/60">Escute novamente em inglês</p>
              </div>
            </div>

            <button
              onClick={handleUnderstood}
              className="w-full font-bold py-3 rounded-lg transition-all"
              style={{
                background: understood ? 'rgba(34,197,94,0.2)' : 'rgba(0,102,255,0.1)',
                border: understood ? '2px solid #22c55e' : '1px solid rgba(0,212,255,0.2)',
              }}
            >
              {understood ? '✅ Understood' : '🎧 Listen & Understand'}
            </button>
          </div>
        )}

        {/* Step 4 - Speak */}
        {practiceStep === 3 && (
          <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🎤</span>
              <div>
                <p className="text-lg font-bold text-cyan-400">Step 4 — Speak</p>
                <p className="text-sm text-blue-200/60">Agora fale sem ouvir o áudio</p>
              </div>
            </div>

            <button
              onClick={handleSpeak}
              className="w-full font-bold tracking-widest px-6 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: spoken >= 3 ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #003AB0, #0066FF)',
                border: spoken >= 3 ? '2px solid #22c55e' : '2px solid #00D4FF',
              }}
            >
              {spoken >= 3 ? '✅ COMPLETED' : `🎤 SPEAK ${spoken}/3`}
            </button>

            {spoken >= 3 && (
              <button
                onClick={handleFinal}
                className="w-full mt-4 font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #003AB0, #0066FF)',
                  border: '2px solid #00D4FF',
                }}
              >
                ✓ COMPLETE UNIT (+90 XP)
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (step === 'final') {
    return (
      <div className="space-y-8">
        <div
          className="p-12 rounded-3xl backdrop-blur-md text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,212,255,0.1))',
            border: '1px solid #22c55e',
          }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-4">Unit Complete!</h2>
          <p className="text-lg text-blue-200/80 mb-6">
            🔥 Parabéns! Você criou sua primeira conversa real
          </p>

          <div className="space-y-3 mb-8 p-6 rounded-2xl" style={{ background: 'rgba(0,36,120,0.3)' }}>
            <p className="text-blue-200/80">✅ You practiced like a native speaker</p>
            <p className="text-blue-200/80">✅ You are improving step by step</p>
            <p className="text-blue-200/80">✅ Your fluency is being built</p>
          </div>

          <button
            onClick={() => onComplete(90)}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            🚀 COMPLETE ACTIVITY 7 (+90 XP)
          </button>

          <p className="text-sm text-cyan-400/60 mt-6 tracking-widest">
            🦅 +15 WOA COINS
          </p>
        </div>
      </div>
    )
  }

  return null
}
