'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type AdminTicket = {
  id: string
  subject: string
  problem: string
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  user: {
    id: string
    name: string
    username: string
    plan: string
  }
}

function planLabel(plan: string): string {
  if (plan === 'premium') return 'Premium'
  if (plan === 'starter') return 'Starter'
  return 'Free'
}

export default function AdminAtendimentoPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    if (session?.user?.role !== 'admin') {
      router.push('/auth/signin')
      return
    }

    fetch('/api/admin/support-tickets')
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? 'Erro ao carregar atendimentos')
        return data
      })
      .then((data) => {
        const rows: AdminTicket[] = Array.isArray(data.tickets) ? data.tickets : []
        setTickets(rows)
        if (rows.length > 0) setSelectedTicketId(rows[0].id)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [status, session, router])

  const selected = tickets.find(t => t.id === selectedTicketId) ?? null

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return null
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#050E1A' }}>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">📨 Atendimento</h1>
            <p className="text-sm text-blue-200/60">Demandas enviadas pelos usuários.</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/20 hover:bg-white/5 transition-all"
          >
            ← Admin
          </button>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <p className="text-sm font-black text-white mb-3">Lista de demandas ({tickets.length})</p>

            {tickets.length === 0 ? (
              <p className="text-xs text-white/35">Nenhuma demanda enviada até agora.</p>
            ) : (
              <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                {tickets.map(ticket => {
                  const active = ticket.id === selectedTicketId
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="w-full text-left rounded-xl px-4 py-3 transition-all"
                      style={{
                        background: active ? 'rgba(0,212,255,0.10)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1px solid rgba(0,212,255,0.40)' : '1px solid rgba(255,255,255,0.10)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-white truncate">{ticket.subject}</p>
                        <span className="text-[10px] text-white/50 shrink-0">{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                        <p className="text-white/80"><span className="text-white/45">Nome:</span> {ticket.user.name}</p>
                        <p className="text-white/80"><span className="text-white/45">Usuário:</span> {ticket.user.username}</p>
                        <p className="text-white/80"><span className="text-white/45">Plano:</span> {planLabel(ticket.user.plan)}</p>
                        <p className="text-white/80"><span className="text-white/45">Data:</span> {new Date(ticket.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <p className="text-sm font-black text-white mb-3">Detalhe do problema</p>

            {!selected ? (
              <p className="text-xs text-white/35">Selecione uma demanda para ver o conteúdo.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <p className="text-[11px] text-white/45">Assunto</p>
                  <p className="text-sm font-black text-white mt-1">{selected.subject}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <p className="text-[11px] text-white/45 mb-2">Problema enviado</p>
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{selected.problem}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
