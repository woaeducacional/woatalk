'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Level {
  id: number
  name: string
  description: string | null
  mission_groups_count: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/admin/levels')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setLevels(data.levels ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/journey/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLevels((prev) => prev.filter((l) => l.id !== id))
      }
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#050E1A' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🗺️ Gerenciar Jornadas</h1>
            <p className="text-blue-200/60 text-sm">{levels.length} fases cadastradas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/20 hover:bg-white/5 transition-all"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => router.push('/admin/journey-content/new')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              + Criar Nova Jornada
            </button>
          </div>
        </div>

        {/* List */}
        {levels.length === 0 ? (
          <div className="p-12 rounded-xl border border-white/10 bg-white/[0.02] text-center">
            <p className="text-4xl mb-3">🌊</p>
            <p className="text-white/60 text-sm">Nenhuma jornada criada ainda.</p>
            <button
              onClick={() => router.push('/admin/journey-content/new')}
              className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            >
              Criar a primeira jornada
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {levels.map((level) => (
              <div
                key={level.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl shrink-0">
                  🌊
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-cyan-300/50">FASE {level.id}</span>
                    <span className="text-[10px] font-bold text-green-400/80 bg-green-400/10 px-2 py-0.5 rounded-full">
                      {level.mission_groups_count} GRUPOS
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm truncate">{level.name}</h3>
                  {level.description && (
                    <p className="text-blue-200/40 text-xs truncate">{level.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => router.push(`/admin/journey-content/${level.id}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 border border-cyan-400/30 hover:bg-cyan-400/10 transition-all"
                  >
                    ✏️ Atividades
                  </button>
                  <button
                    onClick={() => router.push(`/admin/journey/${level.id}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-300 border border-blue-400/30 hover:bg-blue-400/10 transition-all"
                  >
                    📋 Missões
                  </button>
                  {confirmDeleteId === level.id ? (
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[11px] text-red-300/80">Confirmar?</span>
                      <button
                        onClick={() => handleDelete(level.id)}
                        disabled={deletingId === level.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-300 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        {deletingId === level.id ? '...' : 'Sim'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/40 border border-white/20 hover:bg-white/5 transition-all"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(level.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400/60 border border-red-500/20 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 transition-all"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
