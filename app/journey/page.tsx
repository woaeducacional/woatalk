'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/src/components/ui/Button'

// Dados das fases
const OCEAN_PHASES = [
  { id: 1,  name: 'Pacific Ocean',      depth: '4.280m', color: '#0a1a2e', aula: 'The Alphabet' },
  { id: 2,  name: 'Atlantic Ocean',     depth: '3.339m', color: '#1a1a3e', aula: 'Introduce Yourself' },
  { id: 3,  name: 'Indian Ocean',       depth: '3.970m', color: '#0f3a5c', aula: 'Talking About Things' },
  { id: 4,  name: 'Arctic Ocean',       depth: '1.205m', color: '#1a4d6d', aula: 'Counting Up to 20' },
  { id: 5,  name: 'Antarctic Ocean',    depth: '4.500m', color: '#2d5a7b', aula: 'Counting from 20 to 1000' },
  { id: 6,  name: 'Mediterranean Sea',  depth: '2.500m', color: '#1a5c7a', aula: 'Talking About the Time' },
  { id: 7,  name: 'Caribbean Sea',      depth: '2.754m', color: '#0f5c6b', aula: 'Days, Months and Years' },
  { id: 8,  name: 'South China Sea',    depth: '5.016m', color: '#1a6d5c', aula: 'Ordinal Numbers' },
  { id: 9,  name: 'Arabian Sea',        depth: '2.200m', color: '#2d5a7b', aula: 'How to Ask Questions' },
  { id: 10, name: 'Coral Sea',          depth: '3.000m', color: '#0f4c5d', aula: 'Talking About the Weather' },
  { id: 11, name: 'Bering Sea',         depth: '1.547m', color: '#2d5c7d', aula: 'How to Build Sentences' },
  { id: 12, name: 'Philippine Sea',     depth: '4.000m', color: '#1a4c8f', aula: 'Verb To Be (Present)' },
  { id: 13, name: 'Sea of Japan',       depth: '3.742m', color: '#2d6d8f', aula: 'How to Speak in the Past Tense' },
  { id: 14, name: 'Red Sea',            depth: '2.600m', color: '#7a2d2d', aula: 'How to Ask Someone to Hang Out' },
  { id: 15, name: 'Black Sea',          depth: '1.253m', color: '#2d2d4d', aula: 'How to Talk About the Future' },
  { id: 16, name: 'Baltic Sea',         depth: '459m',   color: '#2d6d7f', aula: 'TH Sound \u2014 THE (\u00f0)' },
  { id: 17, name: 'North Sea',          depth: '570m',   color: '#3d7d8f', aula: 'TH Sound \u2014 THANKS (\u03b8)' },
  { id: 18, name: 'Gulf of Mexico',     depth: '3.750m', color: '#2d6a3a', aula: 'How to Say "No" Politely' },
  { id: 19, name: 'Sea of Okhotsk',     depth: '838m',   color: '#3d6d8f', aula: 'The Main Verb Tenses' },
  { id: 20, name: 'Tasman Sea',         depth: '2.612m', color: '#4d8f8f', aula: 'To Be in the Past (WAS/WERE)' },
]

export default function JourneyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPhase, setCurrentPhase] = useState<number>(2)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Carregando jornada...</p>
      </div>
    )
  }

  const handleStartChallenge = (phaseId: number) => {
    // Em breve: rota para o desafio
    router.push(`/challenge/${phaseId}`)
  }

  const handleAdvancePhase = () => {
    if (currentPhase < OCEAN_PHASES.length) {
      setCurrentPhase(currentPhase + 1)
    }
  }

  const currentOceanPhase = OCEAN_PHASES[currentPhase - 1]

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="hover:opacity-70">
              <Image 
                src="/images/logo.png" 
                alt="WOA Talk Logo" 
                width={50} 
                height={50}
                className="rounded-lg"
              />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sua Jornada Épica</h1>
              <p className="text-sm text-gray-600">Fase {currentPhase} de {OCEAN_PHASES.length}</p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Voltar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Current Phase Info */}
        <div 
          className="rounded-xl p-12 mb-12 text-white relative overflow-hidden"
          style={{ backgroundColor: currentOceanPhase.color }}
        >
          {/* Efeito de água animado */}
          <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
            <div className="w-full h-full rounded-full bg-white animate-pulse"></div>
          </div>
          
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-2">
              Profundidade: {currentOceanPhase.depth}
            </p>
            <h2 className="text-5xl font-bold mb-4">{currentOceanPhase.name}</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl">
              Você chegou à fase {currentPhase}. Realize os desafios desta área para avançar sua jornada épica no aprendizado do inglês.
            </p>
            
            <Button 
              onClick={() => handleStartChallenge(currentPhase)}
              className="text-white font-semibold text-lg px-8 py-3 rounded-lg"
              style={{ backgroundColor: '#CC4A00' }}
            >
              Iniciar Desafio
            </Button>
          </div>
        </div>

        {/* Journey Map */}
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-gray-900">Mapa da Jornada</h3>
          
          <div className="space-y-6">
            {OCEAN_PHASES.map((phase, index) => {
              const isCompleted = false // nenhuma fase concluída ainda
              const isCurrent = index === currentPhase - 1
              const isLocked = !isCurrent

              return (
                <div key={phase.id} className="flex items-center gap-6">
                  {/* Timeline Line */}
                  {index !== OCEAN_PHASES.length - 1 && (
                    <div className="flex flex-col items-center -mr-6 z-0">
                      <div 
                        className="w-8 h-8 rounded-full border-4 flex items-center justify-center relative z-10"
                        style={{
                          borderColor: isCurrent ? '#0043BB' : '#d1d5db',
                          backgroundColor: isCurrent ? '#0043BB' : 'white',
                        }}
                      >
                        {isCurrent && <span className="text-white text-lg">●</span>}
                      </div>
                      <div 
                        className="w-1 h-20"
                        style={{
                          backgroundColor: isCurrent ? '#0043BB' : '#e5e7eb',
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Card */}
                  <div
                    className={`flex-1 rounded-lg p-6 transition-all border-2 ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-gray-50'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">
                            {phase.id}. {phase.name}
                          </h4>
                          {isCurrent && (
                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                              DISPONÍVEL
                            </span>
                          )}
                          {isLocked && (
                            <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                              EM BREVE
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1" style={{ color: isLocked ? '#9ca3af' : '#0043BB' }}>📖 {phase.aula}</p>
                        <p className="text-sm text-gray-500">Profundidade: {phase.depth}</p>
                      </div>

                      {isCurrent && (
                        <Button
                          onClick={() => handleStartChallenge(phase.id)}
                          className="text-white font-semibold px-6 py-2 rounded-lg"
                          style={{ backgroundColor: '#CC4A00' }}
                        >
                          Iniciar
                        </Button>
                      )}

                      {isLocked && (
                        <span className="text-gray-400 font-semibold text-xl">🔒</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress Footer */}
        {currentPhase < OCEAN_PHASES.length && (
          <div className="mt-12 flex justify-center">
            <Button 
              onClick={handleAdvancePhase}
              className="text-white font-semibold text-lg px-8 py-3 rounded-lg"
              style={{ backgroundColor: '#0043BB' }}
            >
              Avançar para a Próxima Fase (Teste)
            </Button>
          </div>
        )}

        {currentPhase === OCEAN_PHASES.length && (
          <div className="mt-12 text-center p-8 bg-blue-50 rounded-lg border-2 border-blue-600">
            <p className="text-2xl font-bold text-gray-900">
              Parabéns! Você completou toda a jornada! 🎉
            </p>
            <p className="text-gray-600 mt-2">Em breve, mais fases estarão disponíveis.</p>
          </div>
        )}
      </div>
    </main>
  )
}
