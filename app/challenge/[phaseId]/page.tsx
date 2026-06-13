'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { UnifiedJourneyFlow } from '@/src/components/UnifiedJourneyFlow'
import { playClick } from '@/lib/sounds'

const OCEAN_PHASES = [
  { id: 1,  name: 'Pacific Ocean'     },
  { id: 2,  name: 'Atlantic Ocean'    },
  { id: 3,  name: 'Indian Ocean'      },
  { id: 4,  name: 'Arctic Ocean'      },
  { id: 5,  name: 'Antarctic Ocean'   },
  { id: 6,  name: 'Mediterranean Sea' },
  { id: 7,  name: 'Caribbean Sea'     },
  { id: 8,  name: 'South China Sea'   },
  { id: 9,  name: 'Arabian Sea'       },
  { id: 10, name: 'Coral Sea'         },
  { id: 11, name: 'Bering Sea'        },
  { id: 12, name: 'Philippine Sea'    },
  { id: 13, name: 'Sea of Japan'      },
  { id: 14, name: 'Red Sea'           },
  { id: 15, name: 'Black Sea'         },
  { id: 16, name: 'Baltic Sea'        },
  { id: 17, name: 'North Sea'         },
  { id: 18, name: 'Gulf of Mexico'    },
  { id: 19, name: 'Sea of Okhotsk'    },
  { id: 20, name: 'Tasman Sea'        },
]

export default function ChallengePage() {
  const params = useParams()
  const router = useRouter()
  const { status } = useSession()
  const phaseId = parseInt(params.phaseId as string)
  const [accessChecked,  setAccessChecked]  = useState(false)
  const [accessBlocked,  setAccessBlocked]  = useState(false)
  const [seqBlocked,     setSeqBlocked]     = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    // Sequential lock: check if previous journey is completed (skip for phase 1)
    if (phaseId > 1) {
      fetch('/api/journey/completed')
        .then(r => r.ok ? r.json() : { completedPhaseIds: [] })
        .then(d => {
          const completed: number[] = d.completedPhaseIds ?? []
          if (!completed.includes(phaseId - 1)) {
            setSeqBlocked(true)
            setTimeout(() => router.push('/dashboard'), 3000)
            return
          }
          // Passes sequential check — proceed with daily-access check
          return fetch('/api/journey/daily-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phaseId }),
          })
            .then(r => r.ok ? r.json() : { blocked: false })
            .then(d2 => {
              if (d2.blocked) {
                setAccessBlocked(true)
                setTimeout(() => router.push('/dashboard'), 3500)
              } else {
                setAccessChecked(true)
              }
            })
        })
        .catch(() => setAccessChecked(true))
    } else {
      fetch('/api/journey/daily-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId }),
      })
        .then(r => r.ok ? r.json() : { blocked: false })
        .then(d => {
          if (d.blocked) {
            setAccessBlocked(true)
            setTimeout(() => router.push('/dashboard'), 3500)
          } else {
            setAccessChecked(true)
          }
        })
        .catch(() => setAccessChecked(true))
    }
  }, [status, phaseId, router])

  const phase = OCEAN_PHASES.find(p => p.id === phaseId)

  if (seqBlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="text-center space-y-5 p-8 max-w-sm mx-auto">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-black text-white tracking-wider">JORNADA BLOQUEADA</h2>
          <p className="text-blue-200/70 text-sm leading-relaxed">
            Complete a <span className="text-cyan-400 font-bold">Jornada {phaseId - 1}</span> para desbloquear esta.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-widest transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
          >
            ← VOLTAR AO DASHBOARD
          </button>
          <p className="text-xs text-blue-300/30">Redirecionando automaticamente...</p>
        </div>
      </main>
    )
  }

  if (accessBlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="text-center space-y-5 p-8 max-w-sm mx-auto">
          <div className="text-6xl">⏳</div>
          <h2 className="text-2xl font-black text-white tracking-wider">LIMITE DIÁRIO</h2>
          <p className="text-blue-200/70 text-sm leading-relaxed">
            Você já acessou <span className="text-orange-400 font-bold">2 jornadas hoje</span>. No plano gratuito o limite é de 2 jornadas por dia.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/premium')}
              className="w-full py-3 rounded-xl font-black tracking-widest text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)', boxShadow: '0 0 24px rgba(255,107,0,0.4)' }}
            >
              👑 VER PLANOS PREMIUM
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-widest transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            >
              ← VOLTAR AO DASHBOARD
            </button>
          </div>
          <p className="text-xs text-blue-300/30">Redirecionando automaticamente...</p>
        </div>
      </main>
    )
  }

  if (status === 'authenticated' && !accessChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen relative" style={{ background: '#050E1A' }}>
      <div className="fixed inset-0 z-0">
        <Image src="/images/fundo_do_mar.png" alt="Fundo do Mar" fill className="object-cover object-bottom" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.90) 0%, rgba(5,14,26,0.70) 40%, rgba(5,14,26,0.88) 100%)' }} />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => { playClick(); router.push('/dashboard') }} className="relative w-9 h-9 hover:scale-110 transition-transform">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/50 object-cover" />
            </button>
            <div>
              <h1 className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
                {phase?.name?.toUpperCase() ?? 'JORNADA'}
              </h1>
              <p className="text-[10px] text-cyan-400/50 tracking-widest">Aprender &amp; Praticar</p>
            </div>
          </div>
          <button onClick={() => { playClick(); router.push('/dashboard') }} className="text-xs font-bold tracking-widest px-4 py-2 rounded border border-cyan-500/25 text-cyan-300/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-all">
            ← VOLTAR
          </button>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
          <UnifiedJourneyFlow phaseId={phaseId} />
        </div>
      </div>
    </main>
  )
}
