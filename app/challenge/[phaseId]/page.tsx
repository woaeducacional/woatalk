'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { CheckpointCelebration } from '@/src/components/CheckpointCelebration'
import Image from 'next/image'
import { Button } from '@/src/components/ui/Button'
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
import { LESSONS_DATA, Exercise, Mission } from '@/lib/lessons'
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Lição não encontrada</p>
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
      <main className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/journey')} className="hover:opacity-70">
                <Image 
                  src="/images/logo.png" 
                  alt="WOA Talk Logo" 
                  width={50} 
                  height={50}
                  className="rounded-lg"
                />
              </button>
            </div>
            <Button 
              onClick={() => router.push('/journey')}
              className="text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Voltar
            </Button>
          </div>
        </header>

        {/* Completion Screen */}
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="text-6xl animate-bounce">🌊</div>
            <h1 className="text-4xl font-bold text-gray-900">
              {phase.name} Conquistado!
            </h1>
            
            <div className="bg-blue-50 border-2 border-blue-600 rounded-xl p-8">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Você está subindo. Antes você estava nas profundezas. Agora você já consegue falar sobre quem você é.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Cada palavra que aprende é como subir mais perto da superfície. Continue explorando.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-orange-100 rounded-xl p-8 border-2 border-blue-500">
              <p className="text-sm text-gray-600 font-semibold mb-2">XP GANHO</p>
              <p className="text-5xl font-bold text-orange-600">+{totalXp} XP</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/journey')}
                className="w-full text-white font-semibold px-8 py-4 rounded-lg text-lg"
                style={{ backgroundColor: '#0043BB' }}
              >
                Voltar à Jornada
              </Button>
              <Button
                onClick={() => {
                  setCurrentMissionIdx(0)
                  setTotalXp(0)
                  setIsCompleted(false)
                }}
                className="w-full text-gray-700 border-2 border-gray-300 font-semibold px-8 py-4 rounded-lg text-lg hover:bg-gray-50"
              >
                Repetir Lição
              </Button>
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
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/journey')} className="hover:opacity-70">
              <Image 
                src="/images/logo.png" 
                alt="WOA Talk Logo" 
                width={50} 
                height={50}
                className="rounded-lg"
              />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{phase.name}</h1>
              <p className="text-sm text-gray-600">
                Missão {currentMissionIdx + 1} de {missionsWithWords.length}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/journey')}
            className="text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Voltar
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Progresso da Lição</span>
            <span className="text-sm text-gray-600">{totalXp} XP</span>
          </div>

          {/* Depth meter — visible only for 100-mission phases */}
          {missionsWithWords.length >= 20 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🌊</span>
                <span className="text-sm font-bold" style={{ color: '#0043BB' }}>
                  {Math.round(Number(phase.depth.replace(/[^0-9]/g, '')) * (1 - currentMissionIdx / missionsWithWords.length))}m de profundidade
                </span>
              </div>
              <span className="text-xs text-gray-500">
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
                  <div key={i} className="flex-1 h-2.5 bg-gray-200 rounded-sm overflow-hidden" title={`Checkpoint ${i + 1}`}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${fill * 100}%`, backgroundColor: '#CC4A00' }}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentMissionIdx / missions.length) * 100}%`, backgroundColor: '#CC4A00' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mission Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentMission.name}
          </h2>
          <p className="text-gray-600 text-lg">{currentMission.description}</p>
        </div>

        {/* Mission Component */}
        <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
          {renderMission()}
        </div>

        {/* XP Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Ganhe <span className="font-bold text-orange-600">+{currentMission.xp} XP</span> ao completar esta missão</p>
        </div>
      </div>

      {/* Checkpoint Celebration Overlay */}
      {celebrationData && (
        <CheckpointCelebration
          checkpoint={celebrationData.checkpoint}
          xpEarned={celebrationData.xpEarned}
          missionsCompleted={10}
          onContinue={handleCelebrationContinue}
        />
      )}
    </main>
  )
}
