'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type MyTicket = {
  id: string
  subject: string
  problem: string
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
}

function statusLabel(status: MyTicket['status']): string {
  if (status === 'resolved') return 'Resolvido'
  if (status === 'in_progress') return 'Em andamento'
  return 'Aberto'
}

function statusColor(status: MyTicket['status']): string {
  if (status === 'resolved') return '#22c55e'
  if (status === 'in_progress') return '#f59e0b'
  return '#00D4FF'
}

export default function SupportPage() {
  const router = useRouter()
  const { status } = useSession()

  const [subject, setSubject] = useState('')
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tickets, setTickets] = useState<MyTicket[]>([])
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/support-tickets')
      .then(r => r.ok ? r.json() : { tickets: [] })
      .then(d => setTickets(Array.isArray(d.tickets) ? d.tickets : []))
      .catch(() => {})
      .finally(() => setListLoading(false))
  }, [status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedSubject = subject.trim()
    const trimmedProblem = problem.trim()

    if (trimmedSubject.length < 4) {
      setError('O assunto precisa ter pelo menos 4 caracteres.')
      return
    }
    if (trimmedProblem.length < 10) {
      setError('Descreva melhor seu problema (mínimo de 10 caracteres).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: trimmedSubject, problem: trimmedProblem }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível enviar sua solicitação.')
        return
      }

      setSuccess('Solicitação enviada com sucesso. Nosso time vai analisar seu caso.')
      setSubject('')
      setProblem('')
      if (data.ticket) {
        setTickets(prev => [data.ticket as MyTicket, ...prev])
      }
    } catch {
      setError('Erro de conexão. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: '#050E1A' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">🛟 Suporte</h1>
            <p className="text-sm text-blue-200/60">Envie seu problema e acompanhe suas solicitações.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg text-sm text-white/70 border border-white/20 hover:bg-white/5 transition-all"
          >
            ← Dashboard
          </button>
        </div>

        <section className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h2 className="text-sm font-black text-white tracking-wide">Abrir nova solicitação</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest text-blue-200/70 uppercase">Assunto</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={120}
                placeholder="Ex: Erro para entrar na Jornada 2"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest text-blue-200/70 uppercase">Descreva seu problema</label>
              <textarea
                value={problem}
                onChange={e => setProblem(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Explique o que aconteceu, quando aconteceu e se apareceu alguma mensagem de erro."
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-y"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
            {success && <p className="text-xs text-green-400">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.01] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0055FF, #00D4FF)' }}
            >
              {loading ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h2 className="text-sm font-black text-white tracking-wide mb-3">Minhas solicitações</h2>

          {listLoading ? (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-xs text-white/40">Você ainda não abriu nenhuma solicitação.</p>
          ) : (
            <div className="space-y-2.5">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white truncate">{ticket.subject}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${statusColor(ticket.status)}20`, color: statusColor(ticket.status), border: `1px solid ${statusColor(ticket.status)}50` }}>
                      {statusLabel(ticket.status)}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/35 mt-1">{new Date(ticket.created_at).toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
