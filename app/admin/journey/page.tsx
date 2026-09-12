'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { playClick } from '@/lib/sounds'

interface JourneyItem {
  phase_id: number
  title: string
  description: string
  blocked: boolean
  is_pro: boolean
  icon_url?: string | null
  environment?: string
}

type EnvironmentType = 'oceanos' | 'terra' | 'galaxias'

export default function AdminJourneyListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [journeys, setJourneys] = useState<JourneyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentType>('oceanos')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.email) {
      router.push('/auth/signin')
      return
    }

    fetch('/api/journey')
      .then(r => r.ok ? r.json() : { journeys: [] })
      .then(d => {
        const items = (d.journeys ?? []).map((j: any) => ({
          ...j,
          environment: j.environment ?? 'oceanos'
        }))
        setJourneys(items)
        setLoading(false)
      })
      .catch(() => {
        setJourneys([])
        setLoading(false)
      })
  }, [session, status, router])

  // Filtrar jornadas por ambiente
  const filteredJourneys = useMemo(() => {
    return journeys.filter(j => (j.environment ?? 'oceanos') === selectedEnvironment)
  }, [journeys, selectedEnvironment])

  // Contar jornadas por ambiente
  const countJourneysByEnvironment = (env: EnvironmentType) => {
    return journeys.filter(j => (j.environment ?? 'oceanos') === env).length
  }

  const handleToggleBlocked = async (phaseId: number, currentBlocked: boolean) => {
    try {
      const res = await fetch(`/api/admin/journey-content/${phaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !currentBlocked })
      })
      if (res.ok) {
        setJourneys(prev => prev.map(j => j.phase_id === phaseId ? { ...j, blocked: !currentBlocked } : j))
      }
    } catch (e) {
      console.error('Erro ao atualizar jornada:', e)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #050E1A, #0D1B2A)', minHeight: '100vh' }} className="pt-6 pb-12">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">JORNADAS CADASTRADAS</h1>
            <p className="text-blue-200/60 text-sm">Gerencie todas as jornadas disponíveis no sistema</p>
          </div>
          <Link
            href="/admin/journey-content/new"
            onClick={() => playClick()}
            className="px-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)', boxShadow: '0 0 20px rgba(0,212,255,0.35)' }}
          >
            + NOVA JORNADA
          </Link>
        </div>

        {/* Environment Tabs */}
        <section className="rounded-2xl overflow-hidden" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <p className="text-center text-xs font-black tracking-[0.25em] text-white pt-4 pb-3">FILTRAR POR AMBIENTE</p>
          <div className="grid grid-cols-3 gap-0 border-t border-white/5 px-4 py-4">
            {/* OCEANOS */}
            <button
              onClick={() => { playClick(); setSelectedEnvironment('oceanos') }}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all hover:scale-105"
              style={{
                background: selectedEnvironment === 'oceanos' ? 'rgba(0,212,255,0.12)' : 'rgba(0,212,255,0.04)',
                border: selectedEnvironment === 'oceanos' ? '2px solid #00D4FF' : '2px solid transparent'
              }}
            >
              <span className="text-lg">🌊</span>
              <span className="text-[10px] font-black tracking-widest" style={{ color: selectedEnvironment === 'oceanos' ? '#00D4FF' : 'rgba(0,212,255,0.5)' }}>OCEANOS</span>
              <span className="text-[9px] text-blue-200/40">({countJourneysByEnvironment('oceanos')})</span>
            </button>
            {/* TERRA */}
            <button
              onClick={() => { playClick(); setSelectedEnvironment('terra') }}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all hover:scale-105 border-x border-white/5"
              style={{
                background: selectedEnvironment === 'terra' ? 'rgba(52, 152, 0, 0.12)' : 'rgba(52, 152, 0, 0.04)',
                border: selectedEnvironment === 'terra' ? '2px solid #34A800' : '2px solid rgba(52, 152, 0, 0.1)'
              }}
            >
              <span className="text-lg">🌿</span>
              <span className="text-[10px] font-black tracking-widest" style={{ color: selectedEnvironment === 'terra' ? '#34A800' : 'rgba(52, 152, 0, 0.5)' }}>TERRA</span>
              <span className="text-[9px]" style={{ color: selectedEnvironment === 'terra' ? 'rgba(52, 152, 0, 0.4)' : 'rgba(52, 152, 0, 0.2)' }}>({countJourneysByEnvironment('terra')})</span>
            </button>
            {/* GALÁXIAS */}
            <button
              onClick={() => { playClick(); setSelectedEnvironment('galaxias') }}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all hover:scale-105"
              style={{
                background: selectedEnvironment === 'galaxias' ? 'rgba(148, 0, 211, 0.12)' : 'rgba(148, 0, 211, 0.04)',
                border: selectedEnvironment === 'galaxias' ? '2px solid #9400D3' : '2px solid transparent'
              }}
            >
              <span className="text-lg">✨</span>
              <span className="text-[10px] font-black tracking-widest" style={{ color: selectedEnvironment === 'galaxias' ? '#9400D3' : 'rgba(148, 0, 211, 0.5)' }}>GALÁXIAS</span>
              <span className="text-[9px]" style={{ color: selectedEnvironment === 'galaxias' ? 'rgba(148, 0, 211, 0.4)' : 'rgba(148, 0, 211, 0.2)' }}>({countJourneysByEnvironment('galaxias')})</span>
            </button>
          </div>
        </section>

        {/* Jornadas Grid */}
        {filteredJourneys.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(5,14,26,0.50)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <p className="text-white/40 text-sm font-bold">Nenhuma jornada encontrada neste ambiente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJourneys.map(journey => (
              <div
                key={journey.phase_id}
                className="rounded-xl p-4 transition-all hover:scale-102 active:scale-98"
                style={{
                  background: journey.blocked ? 'rgba(5,14,26,0.50)' : 'rgba(5,14,26,0.75)',
                  border: journey.blocked ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(0,212,255,0.2)'
                }}
              >
                {/* Icon */}
                {journey.icon_url && (
                  <div className="mb-3 h-32 rounded-lg overflow-hidden" style={{ background: 'rgba(0,212,255,0.05)' }}>
                    <img src={journey.icon_url} alt={journey.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Title */}
                <h3 className="font-black text-white mb-1 line-clamp-2">{journey.title}</h3>

                {/* Phase ID */}
                <p className="text-[10px] text-blue-200/50 mb-2">Phase #{journey.phase_id}</p>

                {/* Description */}
                <p className="text-[11px] text-blue-100/60 mb-3 line-clamp-2">{journey.description}</p>

                {/* Status badges */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {journey.is_pro && (
                    <span className="text-[9px] font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      PRO
                    </span>
                  )}
                  {journey.blocked && (
                    <span className="text-[9px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      🔒 BLOQUEADA
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <Link
                    href={`/admin/journey-content/${journey.phase_id}`}
                    onClick={() => playClick()}
                    className="block w-full py-2 px-3 text-center text-[10px] font-bold rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
                  >
                    ✏️ EDITAR CONTEÚDO
                  </Link>
                  <button
                    onClick={() => { playClick(); handleToggleBlocked(journey.phase_id, journey.blocked) }}
                    className="w-full py-2 px-3 text-[10px] font-bold rounded-lg transition-all hover:scale-105"
                    style={{
                      background: journey.blocked ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      border: journey.blocked ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                      color: journey.blocked ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {journey.blocked ? '🔓 DESBLOQUEAR' : '🔒 BLOQUEAR'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
