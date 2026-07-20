'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface AffiliateUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: string
}

interface Affiliate {
  id: string
  code: string
  discount_percent: number
  starter_sales: number
  premium_sales: number
  created_at: string
  users: AffiliateUser
}

interface SearchUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: string
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://woatalk.com'

function roleDisplay(user: AffiliateUser | null, isAffiliate: boolean): string {
  if (!user) return 'user'
  const isAdmin = user.role === 'admin'
  if (isAdmin && isAffiliate) return 'admin, afiliado'
  if (isAdmin) return 'admin'
  if (isAffiliate) return 'afiliado'
  return 'user'
}

export default function AdminAfiliados() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [stats, setStats] = useState<{ free: number; starter: number; premium: number } | null>(null)
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [newCode, setNewCode] = useState('')
  const [newDiscount, setNewDiscount] = useState(10)
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Edit state per row
  const [editCodeId, setEditCodeId] = useState<string | null>(null)
  const [editCodeVal, setEditCodeVal] = useState('')
  const [editDiscountId, setEditDiscountId] = useState<string | null>(null)
  const [editDiscountVal, setEditDiscountVal] = useState(10)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<Record<string, string>>({})

  // Copy tooltip
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    const [statsRes, affRes] = await Promise.all([
      fetch('/api/admin/stats').then(r => r.ok ? r.json() : null),
      fetch('/api/admin/affiliates').then(r => r.ok ? r.json() : { affiliates: [] }),
    ])
    if (statsRes) setStats(statsRes)
    setAffiliates(affRes.affiliates ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetchData()
  }, [status, fetchData])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  // Debounced user search
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

  if (status === 'loading' || loading) {
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

  async function handleAddAffiliate() {
    if (!selectedUser) { setAddError('Selecione um usuário'); return }
    const slug = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!slug) { setAddError('Código inválido'); return }
    setAddLoading(true)
    setAddError('')
    const res = await fetch('/api/admin/affiliates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selectedUser.id, code: slug, discount_percent: newDiscount }),
    })
    const data = await res.json()
    if (!res.ok) { setAddError(data.error ?? 'Erro'); setAddLoading(false); return }
    setAddOpen(false)
    setSelectedUser(null)
    setNewCode('')
    setNewDiscount(10)
    setSearchQ('')
    await fetchData()
    setAddLoading(false)
  }

  async function handleUpdateCode(id: string) {
    const slug = editCodeVal.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: slug }),
    })
    const data = await res.json()
    if (!res.ok) { setRowError(prev => ({ ...prev, [id]: data.error ?? 'Erro' })); return }
    setEditCodeId(null)
    setRowError(prev => { const n = { ...prev }; delete n[id]; return n })
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, code: data.affiliate.code } : a))
  }

  async function handleUpdateDiscount(id: string) {
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discount_percent: editDiscountVal }),
    })
    const data = await res.json()
    if (!res.ok) { setRowError(prev => ({ ...prev, [id]: data.error ?? 'Erro' })); return }
    setEditDiscountId(null)
    setRowError(prev => { const n = { ...prev }; delete n[id]; return n })
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, discount_percent: data.affiliate.discount_percent } : a))
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/affiliates/${id}`, { method: 'DELETE' })
    if (!res.ok) { setRowError(prev => ({ ...prev, [id]: 'Erro ao excluir' })); return }
    setConfirmDeleteId(null)
    setAffiliates(prev => prev.filter(a => a.id !== id))
  }

  function copyLink(affiliate: Affiliate) {
    const link = `${BASE_URL}/premium?ref=${affiliate.code}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(affiliate.id)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#050E1A' }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">🤝 Afiliados</h1>
            <p className="text-blue-200/50 text-sm mt-0.5">Gerencie afiliados e acompanhe vendas</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="px-4 py-2 rounded-lg text-sm text-white/60 border border-white/20 hover:bg-white/5 transition-all">
              ← Admin
            </Link>
            <button
              onClick={() => { setAddOpen(true); setSelectedUser(null); setSearchQ(''); setNewCode(''); setNewDiscount(10); setAddError('') }}
              className="px-5 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0055FF, #00D4FF)', boxShadow: '0 0 16px rgba(0,212,255,0.3)' }}
            >
              + Adicionar afiliado
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'FREE', value: stats?.free ?? '—', color: '#6B7280', icon: '🆓' },
            { label: 'STARTER', value: stats?.starter ?? '—', color: '#00D4FF', icon: '🚀' },
            { label: 'PREMIUM', value: stats?.premium ?? '—', color: '#FFD700', icon: '👑' },
          ].map(card => (
            <div key={card.label} className="rounded-2xl p-5 text-center" style={{ background: 'rgba(5,14,26,0.80)', border: `1px solid ${card.color}30` }}>
              <p className="text-2xl mb-1">{card.icon}</p>
              <p className="text-3xl font-black" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[11px] font-black tracking-widest mt-1" style={{ color: `${card.color}99` }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Affiliates table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(5,14,26,0.80)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-sm font-black text-white tracking-wide">Afiliados da plataforma</p>
          </div>

          {affiliates.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🤝</p>
              <p className="text-white/50 text-sm">Nenhum afiliado cadastrado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Usuário', 'Role', 'Starter', 'Premium', 'Código', 'Link', '⚙️'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-black tracking-widest text-white/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map(aff => {
                    const user = aff.users
                    const role = roleDisplay(user, true)
                    const link = `${BASE_URL}/premium?ref=${aff.code}`
                    return (
                      <tr key={aff.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-blue-500/20">
                              {user?.avatar_url
                                ? <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="object-cover w-full h-full" />
                                : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-cyan-400">{user?.name?.[0]?.toUpperCase()}</div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-bold text-xs truncate max-w-[120px]">{user?.name}</p>
                              <p className="text-white/40 text-[10px] truncate max-w-[120px]">{user?.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                            background: role.includes('admin') ? 'rgba(239,68,68,0.15)' : 'rgba(0,212,255,0.12)',
                            color: role.includes('admin') ? '#ef4444' : '#00D4FF',
                            border: `1px solid ${role.includes('admin') ? 'rgba(239,68,68,0.3)' : 'rgba(0,212,255,0.25)'}`,
                          }}>
                            {role}
                          </span>
                        </td>

                        {/* Starter sales */}
                        <td className="px-4 py-3">
                          <span className="text-white font-black">{aff.starter_sales}</span>
                          <span className="text-white/30 text-[10px] ml-1">vendas</span>
                        </td>

                        {/* Premium sales */}
                        <td className="px-4 py-3">
                          <span className="text-yellow-400 font-black">{aff.premium_sales}</span>
                          <span className="text-white/30 text-[10px] ml-1">vendas</span>
                        </td>

                        {/* Code — editable */}
                        <td className="px-4 py-3">
                          {editCodeId === aff.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                value={editCodeVal}
                                onChange={e => setEditCodeVal(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                className="w-24 px-2 py-1 rounded-lg text-xs font-bold outline-none"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,212,255,0.4)', color: '#fff' }}
                                onKeyDown={e => { if (e.key === 'Enter') handleUpdateCode(aff.id); if (e.key === 'Escape') setEditCodeId(null) }}
                                autoFocus
                              />
                              <button onClick={() => handleUpdateCode(aff.id)} className="text-green-400 hover:text-green-300 text-base">✓</button>
                              <button onClick={() => setEditCodeId(null)} className="text-white/40 hover:text-white/60 text-base">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditCodeId(aff.id); setEditCodeVal(aff.code) }}
                              className="font-black text-cyan-300 text-xs hover:text-cyan-200 transition-colors px-2 py-1 rounded-lg hover:bg-cyan-400/10"
                            >
                              {aff.code} ✏️
                            </button>
                          )}
                          {rowError[aff.id] && <p className="text-[10px] text-red-400 mt-0.5">{rowError[aff.id]}</p>}
                        </td>

                        {/* Link */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-white/40 truncate max-w-[140px]">/premium?ref={aff.code}</span>
                            <button
                              onClick={() => copyLink(aff)}
                              title={link}
                              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold transition-all hover:scale-105"
                              style={{ background: copiedId === aff.id ? 'rgba(34,197,94,0.2)' : 'rgba(0,212,255,0.12)', color: copiedId === aff.id ? '#22c55e' : '#00D4FF', border: `1px solid ${copiedId === aff.id ? 'rgba(34,197,94,0.3)' : 'rgba(0,212,255,0.25)'}` }}
                            >
                              {copiedId === aff.id ? '✓ Copiado' : '📋 Copiar'}
                            </button>
                          </div>
                        </td>

                        {/* Config */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {editDiscountId === aff.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={editDiscountVal}
                                  onChange={e => setEditDiscountVal(Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded-lg text-xs font-bold outline-none"
                                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,165,0,0.4)', color: '#fff' }}
                                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateDiscount(aff.id); if (e.key === 'Escape') setEditDiscountId(null) }}
                                  autoFocus
                                />
                                <span className="text-white/40 text-xs">%</span>
                                <button onClick={() => handleUpdateDiscount(aff.id)} className="text-green-400 hover:text-green-300">✓</button>
                                <button onClick={() => setEditDiscountId(null)} className="text-white/40 hover:text-white/60">✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditDiscountId(aff.id); setEditDiscountVal(aff.discount_percent) }}
                                className="text-[10px] font-black px-2 py-1 rounded-lg transition-all hover:scale-105"
                                style={{ background: 'rgba(255,165,0,0.12)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.3)' }}
                              >
                                {aff.discount_percent}% desc
                              </button>
                            )}

                            {confirmDeleteId === aff.id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-300/80">Confirmar?</span>
                                <button onClick={() => handleDelete(aff.id)} className="text-[10px] font-bold text-red-300 hover:text-red-200 px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30">Sim</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-white/40 hover:text-white/60 px-1 py-0.5">Não</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(aff.id)}
                                className="text-red-400/60 hover:text-red-300 text-base transition-colors"
                                title="Remover afiliado"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add affiliate modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.25)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-black text-base">Adicionar Afiliado</h2>
              <button onClick={() => setAddOpen(false)} className="text-white/40 hover:text-white text-xl">✕</button>
            </div>

            {/* Search user */}
            <div className="space-y-2">
              <label className="text-[11px] font-black tracking-widest text-white/50">BUSCAR USUÁRIO</label>
              <input
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setSelectedUser(null) }}
                placeholder="Digite o nome do usuário..."
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
              />
              {searchLoading && <p className="text-[11px] text-white/40">Buscando...</p>}
              {searchResults.length > 0 && !selectedUser && (
                <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  {searchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setNewCode(u.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)); setSearchResults([]) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-blue-500/20">
                        {u.avatar_url
                          ? <Image src={u.avatar_url} alt={u.name} width={28} height={28} className="object-cover w-full h-full" />
                          : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-cyan-400">{u.name[0]}</div>
                        }
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold">{u.name}</p>
                        <p className="text-white/40 text-[10px]">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-blue-500/20">
                    {selectedUser.avatar_url
                      ? <Image src={selectedUser.avatar_url} alt={selectedUser.name} width={28} height={28} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-cyan-400">{selectedUser.name[0]}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold">{selectedUser.name}</p>
                    <p className="text-white/50 text-[10px]">{selectedUser.email}</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setSearchQ('') }} className="text-white/40 hover:text-white/60 text-xs">✕</button>
                </div>
              )}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <label className="text-[11px] font-black tracking-widest text-white/50">CÓDIGO DE AFILIADO</label>
              <input
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Ex: JOAO20"
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none tracking-widest"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#00D4FF' }}
              />
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <label className="text-[11px] font-black tracking-widest text-white/50">DESCONTO (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={newDiscount}
                onChange={e => setNewDiscount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFA500' }}
              />
            </div>

            {addError && <p className="text-xs text-red-400">{addError}</p>}

            <button
              onClick={handleAddAffiliate}
              disabled={addLoading || !selectedUser || !newCode}
              className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #0055FF, #00D4FF)' }}
            >
              {addLoading ? 'Adicionando...' : 'Adicionar afiliado'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
