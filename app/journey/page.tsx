'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { playClick } from '@/lib/sounds'

const OCEAN_PHASES = [
  { id: 1,  name: 'Pacific Ocean',      depth: '4.280m', aula: 'The Alphabet' },
  { id: 2,  name: 'Atlantic Ocean',     depth: '3.339m', aula: 'Introduce Yourself' },
  { id: 3,  name: 'Indian Ocean',       depth: '3.970m', aula: 'Talking About Things' },
  { id: 4,  name: 'Arctic Ocean',       depth: '1.205m', aula: 'Counting Up to 20' },
  { id: 5,  name: 'Antarctic Ocean',    depth: '4.500m', aula: 'Counting from 20 to 1000' },
  { id: 6,  name: 'Mediterranean Sea',  depth: '2.500m', aula: 'Talking About the Time' },
  { id: 7,  name: 'Caribbean Sea',      depth: '2.754m', aula: 'Days, Months and Years' },
  { id: 8,  name: 'South China Sea',    depth: '5.016m', aula: 'Ordinal Numbers' },
  { id: 9,  name: 'Arabian Sea',        depth: '2.200m', aula: 'How to Ask Questions' },
  { id: 10, name: 'Coral Sea',          depth: '3.000m', aula: 'Talking About the Weather' },
  { id: 11, name: 'Bering Sea',         depth: '1.547m', aula: 'How to Build Sentences' },
  { id: 12, name: 'Philippine Sea',     depth: '4.000m', aula: 'Verb To Be (Present)' },
  { id: 13, name: 'Sea of Japan',       depth: '3.742m', aula: 'How to Speak in the Past Tense' },
  { id: 14, name: 'Red Sea',            depth: '2.600m', aula: 'How to Ask Someone to Hang Out' },
  { id: 15, name: 'Black Sea',          depth: '1.253m', aula: 'How to Talk About the Future' },
  { id: 16, name: 'Baltic Sea',         depth: '459m',   aula: 'TH Sound — THE (ð)' },
  { id: 17, name: 'North Sea',          depth: '570m',   aula: 'TH Sound — THANKS (θ)' },
  { id: 18, name: 'Gulf of Mexico',     depth: '3.750m', aula: 'How to Say "No" Politely' },
  { id: 19, name: 'Sea of Okhotsk',     depth: '838m',   aula: 'The Main Verb Tenses' },
  { id: 20, name: 'Tasman Sea',         depth: '2.612m', aula: 'To Be in the Past (WAS/WERE)' },
]

export default function JourneyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPhase] = useState<number>(2)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/60 text-sm tracking-widest">CARREGANDO MAPA...</p>
        </div>
      </div>
    )
  }

  const activePhase = OCEAN_PHASES[currentPhase - 1]
  const isAdmin = session?.user?.role === 'admin'

  return (
    <main className="min-h-screen relative" style={{ background: '#050E1A' }}>

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image src="/images/fundo_do_mar.png" alt="Fundo do Mar" fill className="object-cover object-bottom" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.90) 0%, rgba(5,14,26,0.70) 40%, rgba(5,14,26,0.92) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* NAV */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => { playClick(); router.push('/dashboard') }} className="relative w-9 h-9 hover:scale-110 transition-transform">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/50 object-cover" />
            </button>
            <div>
              <span className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>MAPA DA JORNADA</span>
              <p className="text-[10px] text-cyan-400/50 tracking-widest">FASE {currentPhase} DE {OCEAN_PHASES.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => { playClick() }}
                className="text-xs font-bold tracking-widest px-4 py-2 rounded border transition-all hover:scale-105 active:scale-95 uppercase"
                style={{ background: 'linear-gradient(135deg, #FFFFFF, #E0E0E0)', color: '#111', borderColor: 'rgba(255,255,255,0.9)', boxShadow: '0 0 12px rgba(255,255,255,0.15)' }}
              >
                ✏️ EDITAR JORNADA
              </button>
            )}
            <button
              onClick={() => { playClick(); router.push('/dashboard') }}
              className="text-xs font-bold tracking-widest px-4 py-2 rounded border border-cyan-500/25 text-cyan-300/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-all"
            >
              ← VOLTAR
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-8">

          {/* Active phase hero */}
          <section className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,36,120,0.8), rgba(0,102,255,0.5))', border: '1px solid #00D4FF45', boxShadow: '0 0 40px rgba(0,102,255,0.15)' }}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,#00D4FF,transparent)' }} />
            <div className="relative px-8 py-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 border border-cyan-400/25 text-[10px] font-black tracking-widest" style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    MISSÃO ATIVA
                  </div>
                  <h2 className="text-3xl font-black text-white mb-1" style={{ textShadow: '0 0 20px rgba(0,212,255,0.35)' }}>
                    {activePhase.name}
                  </h2>
                  <p className="text-[11px] text-cyan-400/60 tracking-widest mb-2">🌊 {activePhase.depth} DE PROFUNDIDADE</p>
                  <p className="text-sm text-blue-200/70">📖 {activePhase.aula}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => { playClick(); router.push(`/challenge/${currentPhase}`) }}
                    className="px-6 py-3 font-black text-sm tracking-widest rounded-lg text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#CC4A00,#FF6B35)', boxShadow: '0 0 20px rgba(255,107,53,0.35)', border: '1px solid rgba(255,107,53,0.4)' }}
                  >
                    ⚔️ INICIAR
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { playClick() }}
                      className="px-4 py-2 text-[10px] font-black tracking-widest rounded-lg transition-all hover:scale-105 active:scale-95 uppercase"
                      style={{ background: 'linear-gradient(135deg, #FFFFFF, #E0E0E0)', color: '#111', border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 0 12px rgba(255,255,255,0.15)' }}
                    >
                      ✏️ EDITAR JORNADA
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Journey list */}
          <section>
            <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400/60 mb-5">— TODAS AS FASES —</h3>

            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-px" style={{ background: 'linear-gradient(to bottom, #00D4FF40, transparent)' }} />

              <div className="space-y-3">
                {OCEAN_PHASES.map((phase, index) => {
                  const isCurrent = phase.id === currentPhase
                  const isLocked = phase.id > currentPhase

                  return (
                    <div key={phase.id} className="flex items-center gap-4">

                      {/* Node */}
                      <div className="relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all"
                        style={{
                          borderColor: isCurrent ? '#00D4FF' : isLocked ? 'rgba(255,255,255,0.1)' : '#00F0C8',
                          background: isCurrent ? 'rgba(0,212,255,0.15)' : isLocked ? 'rgba(5,14,26,0.8)' : 'rgba(0,240,200,0.1)',
                          boxShadow: isCurrent ? '0 0 14px rgba(0,212,255,0.5)' : 'none',
                        }}
                      >
                        {isLocked
                          ? <span className="text-sm opacity-30">🔒</span>
                          : isCurrent
                            ? <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            : <span className="text-sm">✓</span>
                        }
                      </div>

                      {/* Card */}
                      <div
                        className={`flex-1 flex items-center justify-between gap-4 px-5 py-4 rounded-xl backdrop-blur-md transition-all ${isCurrent ? 'hover:scale-[1.01]' : ''}`}
                        style={{
                          background: isCurrent
                            ? 'rgba(0,68,187,0.25)'
                            : isLocked
                              ? 'rgba(5,14,26,0.45)'
                              : 'rgba(0,240,200,0.06)',
                          border: isCurrent
                            ? '1px solid #00D4FF45'
                            : isLocked
                              ? '1px solid rgba(255,255,255,0.06)'
                              : '1px solid rgba(0,240,200,0.2)',
                          opacity: isLocked ? 0.55 : 1,
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-black tracking-widest"
                              style={{ color: isCurrent ? '#00D4FF' : isLocked ? 'rgba(255,255,255,0.25)' : '#00F0C8' }}>
                              #{String(phase.id).padStart(2, '0')}
                            </span>
                            <h4 className="text-sm font-black text-white" style={{ opacity: isLocked ? 0.4 : 1 }}>
                              {phase.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded border"
                                style={{ color: '#00D4FF', borderColor: '#00D4FF40', background: 'rgba(0,212,255,0.1)' }}>
                                ATIVO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px]" style={{ color: isLocked ? 'rgba(147,197,253,0.25)' : 'rgba(147,197,253,0.6)' }}>
                            📖 {phase.aula} · 🌊 {phase.depth}
                          </p>
                        </div>

                        {isCurrent && (
                          <button
                            onClick={() => { playClick(); router.push(`/challenge/${phase.id}`) }}
                            className="shrink-0 text-[10px] font-black tracking-widest px-4 py-2 rounded-lg text-white transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg,#CC4A00,#FF6B35)', boxShadow: '0 0 12px rgba(255,107,53,0.3)' }}
                          >
                            ▶ IR
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Completion banner */}
          {currentPhase === OCEAN_PHASES.length && (
            <section className="rounded-2xl px-8 py-8 text-center" style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid #00D4FF40' }}>
              <p className="text-2xl font-black text-white mb-2" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
                🏆 JORNADA COMPLETA!
              </p>
              <p className="text-sm text-blue-200/55">Em breve, novas fases estarão disponíveis.</p>
            </section>
          )}

        </div>

        <footer className="py-5 text-center border-t border-cyan-400/10">
          <p className="text-[11px] text-blue-200/30 tracking-[0.2em]">WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS</p>
        </footer>
      </div>
    </main>
  )
}
