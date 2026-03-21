'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { CheckpointCelebration } from '@/src/components/CheckpointCelebration'
import Image from 'next/image'
import {
  DiscoverMission,
  NameBuilderMission,
  OrderSentenceMission,
  ListenSelectMission,
  AddressMission,
  PhoneNumberMission,
  OriginMission,
  ProfessionMission,
  SpeakModeMission,
} from '@/src/components/Missions'
import { MediaPalette, MediaPaletteButton } from '@/src/components/MediaPalette'
import { LESSONS_DATA, Exercise, Mission } from '@/lib/lessons'
import { playClick } from '@/lib/sounds'
import type { PhraseSentence } from '@/app/api/lessons/sentences/[phaseId]/route'

const OCEAN_PHASES = [
  { id: 1,  name: 'Pacific Ocean',     depth: '4.280m' },
  { id: 2,  name: 'Atlantic Ocean',    depth: '3.339m' },
  { id: 3,  name: 'Indian Ocean',      depth: '3.970m' },
  { id: 4,  name: 'Arctic Ocean',      depth: '1.205m' },
  { id: 5,  name: 'Antarctic Ocean',   depth: '4.500m' },
  { id: 6,  name: 'Mediterranean Sea', depth: '2.500m' },
  { id: 7,  name: 'Caribbean Sea',     depth: '2.754m' },
  { id: 8,  name: 'South China Sea',   depth: '5.016m' },
  { id: 9,  name: 'Arabian Sea',       depth: '2.200m' },
  { id: 10, name: 'Coral Sea',         depth: '3.000m' },
  { id: 11, name: 'Bering Sea',        depth: '1.547m' },
  { id: 12, name: 'Philippine Sea',    depth: '4.000m' },
  { id: 13, name: 'Sea of Japan',      depth: '3.742m' },
  { id: 14, name: 'Red Sea',           depth: '2.600m' },
  { id: 15, name: 'Black Sea',         depth: '1.253m' },
  { id: 16, name: 'Baltic Sea',        depth: '459m'   },
  { id: 17, name: 'North Sea',         depth: '570m'   },
  { id: 18, name: 'Gulf of Mexico',    depth: '3.750m' },
  { id: 19, name: 'Sea of Okhotsk',    depth: '838m'   },
  { id: 20, name: 'Tasman Sea',        depth: '2.612m' },
]

export default function ChallengePage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const phaseId = parseInt(params.phaseId as string)

  const [currentMissionIdx, setCurrentMissionIdx] = useState(0)
  const [totalXp, setTotalXp] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [sentences, setSentences] = useState<PhraseSentence[]>([])
  const [dbCheckpoint, setDbCheckpoint] = useState(0)
  const [celebrationData, setCelebrationData] = useState<{ checkpoint: number; xpEarned: number } | null>(null)
  const [showPalette, setShowPalette] = useState(false)
  const checkpointXpRef = useRef(0)  // accumulates XP within the current 10-mission block

  // Busca frases do banco assim que a fase é conhecida
  useEffect(() => {
    if (!phaseId) return
    fetch(`/api/lessons/sentences/${phaseId}`)
      .then(r => r.ok ? r.json() : { sentences: [] })
      .then(data => setSentences(data.sentences ?? []))
      .catch(() => setSentences([]))
  }, [phaseId])

  // Restaura a missão em que o usuário parou (salva em cookie por 24h)
  useEffect(() => {
    if (!phaseId) return
    const key = `woa_phase_${phaseId}_mission`
    const match = document.cookie.split('; ').find(r => r.startsWith(key + '='))
    if (match) {
      const saved = parseInt(match.split('=')[1])
      if (!isNaN(saved) && saved > 0) setCurrentMissionIdx(saved)
    }
  }, [phaseId])

  // Carrega checkpoint salvo no banco
  useEffect(() => {
    if (!phaseId) return
    fetch(`/api/progress/${phaseId}`)
      .then(r => r.ok ? r.json() : { checkpoint: 0 })
      .then(d => setDbCheckpoint(d.checkpoint ?? 0))
      .catch(() => {})
  }, [phaseId])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const lesson = LESSONS_DATA[phaseId]
  const phase = OCEAN_PHASES.find(p => p.id === phaseId)

  if (!lesson || !phase) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <p className="text-cyan-300/60 text-sm tracking-widest">LIÇÃO NÃO ENCONTRADA</p>
      </div>
    )
  }

  const missions = lesson.missions

  // Injeta words do banco nas missões order-sentence
  // Distribui as frases em ordem (uma por missão do tipo order-sentence)
  let sentenceIdx = 0
  const missionsWithWords: Mission[] = missions.map(m => {
    if (m.type !== 'order-sentence') return m
    const phrase = sentences[sentenceIdx++]
    if (!phrase) return m
    return {
      ...m,
      exercise: {
        ...m.exercise,
        correctAnswer: phrase.sentence,
        words: phrase.sentence.split(' '),
        xp: phrase.xp_reward,
      },
    }
  })

  const currentMission = missionsWithWords[currentMissionIdx]

  const handleMissionComplete = (xp: number) => {
    const newTotal = totalXp + xp
    setTotalXp(newTotal)
    checkpointXpRef.current += xp

    if (currentMissionIdx < missionsWithWords.length - 1) {
      const nextIdx = currentMissionIdx + 1
      // Salva progresso em cookie (expira em 24h)
      document.cookie = `woa_phase_${phaseId}_mission=${nextIdx}; path=/; max-age=86400`
      // Salva checkpoint no banco e mostra celebração a cada 10 missões concluídas
      if (nextIdx % 10 === 0) {
        const cp = nextIdx / 10
        const xpEarned = checkpointXpRef.current
        checkpointXpRef.current = 0
        setDbCheckpoint(cp)
        fetch(`/api/progress/${phaseId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkpoint: cp, missions_completed: nextIdx, xp_earned: xpEarned, coins_earned: 1 }),
        }).catch(() => {})
        // Show celebration — advances to nextIdx after user dismisses
        setCelebrationData({ checkpoint: cp, xpEarned })
      } else {
        setCurrentMissionIdx(nextIdx)
      }
    } else {
      // Fase concluída — limpa o cookie e salva checkpoint final
      document.cookie = `woa_phase_${phaseId}_mission=0; path=/; max-age=0`
      const totalCp = Math.ceil(missionsWithWords.length / 10)
      const xpEarned = checkpointXpRef.current
      checkpointXpRef.current = 0
      setDbCheckpoint(totalCp)
      fetch(`/api/progress/${phaseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpoint: totalCp, missions_completed: missionsWithWords.length, xp_earned: xpEarned, coins_earned: 1 }),
      }).catch(() => {})
      setIsCompleted(true)
    }
  }

  const handleCelebrationContinue = () => {
    const nextIdx = (celebrationData!.checkpoint) * 10
    setCelebrationData(null)
    setCurrentMissionIdx(nextIdx)
  }

  if (isCompleted) {
    return (
      <main className="min-h-screen relative" style={{ background: '#050E1A' }}>
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <Image src="/images/fundo_do_mar.png" alt="Fundo do Mar" fill className="object-cover object-bottom" priority />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.90) 0%, rgba(5,14,26,0.70) 40%, rgba(5,14,26,0.88) 100%)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => { playClick(); router.push('/journey') }} className="relative w-9 h-9 hover:scale-110 transition-transform">
                <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30" />
                <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/50 object-cover" />
              </button>
              <span className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>WOA TALK</span>
            </div>
            <button
              onClick={() => { playClick(); router.push('/journey') }}
              className="text-xs font-bold tracking-widest px-4 py-2 rounded border border-cyan-500/25 text-cyan-300/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
            >
              ← VOLTAR
            </button>
          </header>

          {/* Completion Screen */}
          <div className="max-w-2xl mx-auto px-4 py-20 flex-1 flex items-center">
            <div className="text-center space-y-8 w-full">
              <div className="text-6xl animate-bounce">🌊</div>
              <h1 className="text-4xl font-black text-white" style={{ textShadow: '0 0 30px rgba(0,212,255,0.4)' }}>
                {phase.name} Conquistado!
              </h1>

              <div className="rounded-2xl p-8 backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.35)', border: '1px solid rgba(0,212,255,0.25)', boxShadow: '0 0 30px rgba(0,102,255,0.1)' }}>
                <p className="text-lg text-blue-200/80 leading-relaxed mb-6">
                  Você está subindo. Antes você estava nas profundezas. Agora você já consegue falar sobre quem você é.
                </p>
                <p className="text-lg text-blue-200/80 leading-relaxed">
                  Cada palavra que aprende é como subir mais perto da superfície. Continue explorando.
                </p>
              </div>

              <div className="rounded-2xl p-8 backdrop-blur-md" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <p className="text-xs text-cyan-400/60 font-bold tracking-widest mb-2">XP GANHO</p>
                <p className="text-5xl font-black" style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>+{totalXp} XP</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => { playClick(); router.push('/journey') }}
                  className="w-full font-black tracking-widest px-8 py-4 rounded-lg text-lg text-white transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #003AB0 0%, #0066FF 100%)', border: '2px solid #00D4FF', boxShadow: '0 0 30px rgba(0,102,255,0.4)' }}
                >
                  ⚔️ VOLTAR À JORNADA
                </button>
                <button
                  onClick={() => {
                    playClick()
                    setCurrentMissionIdx(0)
                    setTotalXp(0)
                    setIsCompleted(false)
                  }}
                  className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-lg text-cyan-300 transition-all hover:bg-cyan-500/10 hover:scale-105"
                  style={{ border: '2px solid rgba(0,212,255,0.3)' }}
                >
                  🔄 REPETIR LIÇÃO
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const renderMission = () => {
    const missionProps = {
      missionNumber: currentMissionIdx + 1,
      totalMissions: missionsWithWords.length,
      exercise: currentMission.exercise,
      onComplete: handleMissionComplete,
    }

    switch (currentMission.type) {
      case 'discover':
        return <DiscoverMission {...missionProps} />
      case 'name-builder':
        return <NameBuilderMission {...missionProps} />
      case 'order-sentence':
        return <OrderSentenceMission {...missionProps} />
      case 'listen-select':
        return <ListenSelectMission {...missionProps} />
      case 'address':
        return <AddressMission {...missionProps} />
      case 'phone-number':
        return <PhoneNumberMission {...missionProps} />
      case 'origin':
        return <OriginMission {...missionProps} />
      case 'profession':
        return <ProfessionMission {...missionProps} />
      case 'speak-mode':
        return <SpeakModeMission {...missionProps} />
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen relative" style={{ background: '#050E1A' }}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image src="/images/fundo_do_mar.png" alt="Fundo do Mar" fill className="object-cover object-bottom" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.90) 0%, rgba(5,14,26,0.70) 40%, rgba(5,14,26,0.88) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => { playClick(); router.push('/journey') }} className="relative w-9 h-9 hover:scale-110 transition-transform">
            <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30" />
            <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/50 object-cover" />
          </button>
          <div>
            <h1 className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>{phase.name}</h1>
            <p className="text-[10px] text-cyan-400/50 tracking-widest">
              Missão {currentMissionIdx + 1} de {missionsWithWords.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MediaPaletteButton
            onClick={() => { playClick(); setShowPalette(true) }}
            unlockedCount={(() => {
              const total = Math.ceil(missionsWithWords.length / 10)
              let count = 0
              for (let i = 0; i < total; i++) {
                const m = missionsWithWords[i * 10]
                if (currentMissionIdx >= i * 10 && m && (m.exercise.video || m.exercise.audio)) count++
              }
              return count
            })()}
          />
          <button
            onClick={() => { playClick(); router.push('/journey') }}
            className="text-xs font-bold tracking-widest px-4 py-2 rounded border border-cyan-500/25 text-cyan-300/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
          >
            ← VOLTAR
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-cyan-400/15 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.60)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-cyan-300/70">Progresso da Lição</span>
            <span className="text-xs font-bold tracking-widest text-cyan-400/60">{totalXp} XP</span>
          </div>

          {/* Depth meter — visible only for 100-mission phases */}
          {missionsWithWords.length >= 20 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🌊</span>
                <span className="text-sm font-bold" style={{ color: '#00D4FF', textShadow: '0 0 10px rgba(0,212,255,0.4)' }}>
                  {Math.round(Number(phase.depth.replace(/[^0-9]/g, '')) * (1 - currentMissionIdx / missionsWithWords.length))}m de profundidade
                </span>
              </div>
              <span className="text-xs text-cyan-400/50 tracking-widest">
                Checkpoint {Math.floor(currentMissionIdx / 10)}/{Math.ceil(missionsWithWords.length / 10)}
              </span>
            </div>
          )}

          {/* Segmented bar for large phases, simple bar for small */}
          {missionsWithWords.length >= 20 ? (
            <div className="flex gap-0.5">
              {Array.from({ length: Math.ceil(missionsWithWords.length / 10) }).map((_, i) => {
                const segStart = i * 10
                const segEnd = (i + 1) * 10
                let fill = 0
                if (currentMissionIdx >= segEnd) fill = 1
                else if (currentMissionIdx > segStart) fill = (currentMissionIdx - segStart) / 10
                return (
                  <div key={i} className="flex-1 h-2.5 rounded-sm overflow-hidden border border-cyan-500/20" title={`Checkpoint ${i + 1}`} style={{ background: 'rgba(0,212,255,0.08)' }}>
                    <div
                      className="h-full transition-all duration-300 rounded-sm"
                      style={{ width: `${fill * 100}%`, background: 'linear-gradient(90deg, #FF6B35, #FFD700)' }}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="w-full h-2.5 rounded-full overflow-hidden border border-cyan-500/20" style={{ background: 'rgba(0,212,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentMissionIdx / missions.length) * 100}%`, background: 'linear-gradient(90deg, #FF6B35, #FFD700)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mission Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 flex-1">
        {/* Mission Title with Icon */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">
            {({
              discover: '🎧',
              'name-builder': '📝',
              'order-sentence': '🔤',
              'listen-select': '👂',
              address: '🏠',
              'phone-number': '📱',
              origin: '🌍',
              profession: '👔',
              'speak-mode': '🎤',
            } as Record<string, string>)[currentMission.type] ?? '⭐'}
          </div>
          <h2 className="text-3xl font-black text-white mb-2" style={{ textShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
            {currentMission.name}
          </h2>
          <p className="text-blue-200/60 text-lg">{currentMission.description}</p>
        </div>

        {/* Mission Component */}
        <div key={currentMission.exercise.id} className="rounded-2xl p-8 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 4px 30px rgba(0,102,255,0.08)' }}>
          {renderMission()}
        </div>

        {/* XP Info */}
        <div className="mt-8 text-center text-sm text-blue-200/50">
          <p>Ganhe <span className="font-bold" style={{ color: '#FFD700', textShadow: '0 0 8px rgba(255,215,0,0.4)' }}>+{currentMission.xp} XP</span> ao completar esta missão</p>
        </div>
      </div>

      </div>

      {/* Media Palette Overlay */}
      <MediaPalette
        missions={missionsWithWords}
        currentMissionIdx={currentMissionIdx}
        totalCheckpoints={Math.ceil(missionsWithWords.length / 10)}
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
      />

      {/* Checkpoint Celebration Overlay */}
      {celebrationData && (
        <CheckpointCelebration
          checkpoint={celebrationData.checkpoint}
          xpEarned={celebrationData.xpEarned}
          missionsCompleted={10}
          onContinue={handleCelebrationContinue}
          onLater={() => { playClick(); router.push('/journey') }}
        />
      )}
    </main>
  )
}
