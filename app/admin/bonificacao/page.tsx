'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface SearchUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: string
}

interface BonusUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

interface GrantedByUser {
  id: string
  name: string
}

interface Bonus {
  id: string
  plan_type: 'starter' | 'premium'
  granted_at: string
  expires_at: string
  users: BonusUser
  granted_by_user: GrantedByUser | null
}

function daysRemaining(expiresAt: string): number {
  const now = new Date()
  const end = new Date(expiresAt)
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function DaysBadge({ days }: { days: number }) {
  if (days <= 0)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
        Expirado
      </span>
    )
  if (days <= 7)
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.3)' }}>
        {days}d restantes
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
      {days}d restantes
    </span>
  )
}

function PlanBadge({ plan }: { plan: 'starter' | 'premium' }) {
  if (plan === 'premium')
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)' }}>
        👑 Premium
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(0,212,255,0.12)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}>
      🚀 Starter
    </span>
  )
}

export default function AdminBonificacao() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tab, setTab] = useState<'grant' | 'list'>('grant')

  // Grant tab
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'premium' | null>(null)
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantError, setGrantError] = useState('')
  const [grantSuccess, setGrantSuccess] = useState('')

  // List tab
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [listLoading, setListLoading] = useState(false)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchBonuses = useCallback(async () => {
    setListLoading(true)
    const res = await fetch('/api/admin/bonuses')
    if (res.ok) {
      const d = await res.json()
      setBonuses(d.bonuses ?? [])
    }
    setListLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (tab === 'list' && status === 'authenticated') fetchBonuses()
  }, [tab, status, fetchBonuses])

  // Debounced search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    if (searchQ.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    searchRef.current = setTimeout(() => {
      fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQ)}`)
        .then(r => r.ok ? r.json() : { users: [] })
        .then(d => { setSearchResults(d.users ?? []); setSearchLoading(false) })
        .catch(() => setSearchLoading(false))
    }, 350)
  }, [searchQ])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (session?.user?.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  async function handleGrant() {
    if (!selectedUser || !selectedPlan) return
    setGrantLoading(true)
    setGrantError('')
    setGrantSuccess('')
    const res = await fetch('/api/admin/bonuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selectedUser.id, plan_type: selectedPlan }),
    })
    const data = await res.json()
    if (!res.ok) {
      setGrantError(data.error ?? 'Erro ao conceder bonificação')
      setGrantLoading(false)
      return
    }
    setGrantSuccess(`✅ Bonificação ${selectedPlan === 'premium' ? 'Premium' : 'Starter'} concedida para ${selectedUser.name} por 30 dias!`)
    setSelectedUser(null)
    setSelectedPlan(null)
    setSearchQ('')
    setGrantLoading(false)
  }

  function resetGrant() {
    setSelectedUser(null)
    setSelectedPlan(null)
    setSearchQ('')
    setSearchResults([])
    setGrantError('')
    setGrantSuccess('')
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#050E1A' }}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">🎁 Bonificação</h1>
            <p className="text-blue-200/50 text-sm mt-0.5">Conceda 1 mês de acesso gratuito a usuários</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/20 hover:bg-white/5 transition-all"
          >
            ← Admin
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['grant', 'list'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #0055FF, #00D4FF)', color: '#fff', boxShadow: '0 0 12px rgba(0,212,255,0.25)' }
                : { color: 'rgba(255,255,255,0.4)' }}
            >
              {t === 'grant' ? '🎁 Conceder Bônus' : '📋 Bonificados'}
            </button>
          ))}
        </div>

        {/* ── GRANT TAB ── */}
        {tab === 'grant' && (
          <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>

            {grantSuccess && (
              <div className="px-4 py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                {grantSuccess}
                <button onClick={resetGrant} className="ml-3 text-xs underline opacity-70 hover:opacity-100">Nova bonificação</button>
              </div>
            )}

            {/* Step 1 — Search user */}
            <div className="space-y-2">
              <label className="text-[11px] font-black tracking-widest text-white/50">1. BUSCAR USUÁRIO (NOME OU EMAIL)</label>
              <input
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setSelectedUser(null); setGrantSuccess('') }}
                placeholder="Digite o nome ou email..."
                disabled={!!grantSuccess}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
              />
              {searchLoading && <p className="text-[11px] text-white/40">Buscando...</p>}

              {/* Results dropdown */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.5)' }}>
                  {searchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchResults([]) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-blue-500/20 flex items-center justify-center">
                        {u.avatar_url
                          ? <Image src={u.avatar_url} alt={u.name} width={32} height={32} className="object-cover w-full h-full" />
                          : <span className="text-sm font-bold text-cyan-400">{u.name[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{u.name}</p>
                        <p className="text-white/40 text-[10px] truncate">{u.email}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected user card */}
              {selectedUser && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.25)' }}>
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-blue-500/20 flex items-center justify-center">
                    {selectedUser.avatar_url
                      ? <Image src={selectedUser.avatar_url} alt={selectedUser.name} width={40} height={40} className="object-cover w-full h-full" />
                      : <span className="text-base font-bold text-cyan-400">{selectedUser.name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{selectedUser.name}</p>
                    <p className="text-white/50 text-xs truncate">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedUser(null); setSearchQ(''); setSelectedPlan(null) }}
                    className="text-white/30 hover:text-white/60 text-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Step 2 — Choose plan */}
            {selectedUser && (
              <div className="space-y-3">
                <label className="text-[11px] font-black tracking-widest text-white/50">2. ESCOLHER PLANO</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Starter */}
                  <button
                    onClick={() => setSelectedPlan('starter')}
                    className="relative flex flex-col items-center gap-2 py-5 px-4 rounded-2xl transition-all hover:scale-[1.02]"
                    style={selectedPlan === 'starter'
                      ? { background: 'rgba(0,212,255,0.12)', border: '2px solid rgba(0,212,255,0.6)', boxShadow: '0 0 20px rgba(0,212,255,0.2)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.08)' }}
                  >
                    {selectedPlan === 'starter' && (
                      <span className="absolute top-2 right-2 text-[10px] font-black text-cyan-400">✓</span>
                    )}
                    <span className="text-3xl">🚀</span>
                    <span className="text-sm font-black text-white">Starter</span>
                    <span className="text-[11px] text-white/50">1 mês grátis</span>
                  </button>

                  {/* Premium */}
                  <button
                    onClick={() => setSelectedPlan('premium')}
                    className="relative flex flex-col items-center gap-2 py-5 px-4 rounded-2xl transition-all hover:scale-[1.02]"
                    style={selectedPlan === 'premium'
                      ? { background: 'rgba(255,215,0,0.10)', border: '2px solid rgba(255,215,0,0.5)', boxShadow: '0 0 20px rgba(255,215,0,0.15)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.08)' }}
                  >
                    {selectedPlan === 'premium' && (
                      <span className="absolute top-2 right-2 text-[10px] font-black text-yellow-400">✓</span>
                    )}
                    <span className="text-3xl">👑</span>
                    <span className="text-sm font-black text-white">Premium</span>
                    <span className="text-[11px] text-white/50">1 mês grátis</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Confirm */}
            {selectedUser && selectedPlan && (
              <div className="space-y-3 pt-1">
                <div className="px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                  Conceder acesso <strong style={{ color: selectedPlan === 'premium' ? '#FFD700' : '#00D4FF' }}>{selectedPlan === 'premium' ? 'Premium' : 'Starter'}</strong> por <strong className="text-white">30 dias</strong> para <strong className="text-white">{selectedUser.name}</strong>.
                  {' '}Se já tiver uma assinatura com prazo maior, o prazo não será reduzido.
                </div>

                {grantError && (
                  <p className="text-xs text-red-400 px-1">{grantError}</p>
                )}

                <button
                  onClick={handleGrant}
                  disabled={grantLoading}
                  className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: selectedPlan === 'premium' ? 'linear-gradient(135deg, #B8860B, #FFD700)' : 'linear-gradient(135deg, #0055FF, #00D4FF)', boxShadow: selectedPlan === 'premium' ? '0 0 16px rgba(255,215,0,0.25)' : '0 0 16px rgba(0,212,255,0.25)' }}
                >
                  {grantLoading ? 'Concedendo...' : `🎁 Confirmar Bonificação ${selectedPlan === 'premium' ? 'Premium' : 'Starter'}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── LIST TAB ── */}
        {tab === 'list' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(5,14,26,0.80)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-sm font-black text-white tracking-wide">Usuários Bonificados</p>
              <button
                onClick={fetchBonuses}
                disabled={listLoading}
                className="text-[11px] font-bold px-3 py-1 rounded-lg transition-all hover:bg-white/5 disabled:opacity-40"
                style={{ color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}
              >
                {listLoading ? '...' : '↻ Atualizar'}
              </button>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            ) : bonuses.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">🎁</p>
                <p className="text-white/50 text-sm">Nenhuma bonificação concedida ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Usuário', 'Plano', 'Concedido em', 'Dias Restantes', 'Concedido por'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-black tracking-widest text-white/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bonuses.map(bonus => {
                      const days = daysRemaining(bonus.expires_at)
                      const user = bonus.users
                      const grantedBy = bonus.granted_by_user
                      return (
                        <tr key={bonus.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          {/* User */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-blue-500/20 flex items-center justify-center">
                                {user?.avatar_url
                                  ? <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="object-cover w-full h-full" />
                                  : <span className="text-sm font-bold text-cyan-400">{user?.name?.[0]?.toUpperCase()}</span>
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-bold text-xs truncate max-w-[120px]">{user?.name}</p>
                                <p className="text-white/40 text-[10px] truncate max-w-[120px]">{user?.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-3">
                            <PlanBadge plan={bonus.plan_type} />
                          </td>

                          {/* Granted at */}
                          <td className="px-4 py-3">
                            <span className="text-white/60 text-xs">
                              {new Date(bonus.granted_at).toLocaleDateString('pt-BR')}
                            </span>
                          </td>

                          {/* Days remaining */}
                          <td className="px-4 py-3">
                            <DaysBadge days={days} />
                          </td>

                          {/* Granted by */}
                          <td className="px-4 py-3">
                            <span className="text-white/40 text-xs">{grantedBy?.name ?? '—'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
