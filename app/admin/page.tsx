'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

interface Level {
  id: number
  name: string
  description: string | null
  mission_groups_count: number
}

interface Coupon {
  id: number
  code: string
  discount_percent: number
  active: boolean
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // ── Coupons ──
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  // ── Banner ──
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [bannerLinkUrl, setBannerLinkUrl] = useState('')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerRemoving, setBannerRemoving] = useState(false)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/banner')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.banner) setBannerUrl(d.banner.image_url) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then(r => r.ok ? r.json() : { coupons: [] })
      .then(d => setCoupons(d.coupons ?? []))
      .catch(() => {})
  }, [])

  const handleCreateCoupon = async () => {
    setCouponError(null)
    setCouponSuccess(null)
    const code = couponCode.trim().toUpperCase()
    const discount = Number(couponDiscount)
    if (!code || code.length < 3) { setCouponError('Código deve ter pelo menos 3 caracteres'); return }
    if (!discount || discount < 1 || discount > 100) { setCouponError('Desconto deve ser entre 1 e 100%'); return }
    setCouponLoading(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discount_percent: discount }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error ?? 'Erro ao criar cupom'); return }
      setCoupons(prev => [data.coupon, ...prev])
      setCouponCode('')
      setCouponDiscount('')
      setCouponSuccess(`Cupom ${data.coupon.code} criado com sucesso!`)
    } catch {
      setCouponError('Erro de conexão')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleToggleCoupon = async (id: number, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
      }
    } catch { /* ignore */ }
  }

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('Remover este cupom permanentemente?')) return
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (res.ok) setCoupons(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
  }

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
    setBannerError(null)
  }

  const handleBannerUpload = async () => {
    if (!bannerFile) return
    setBannerUploading(true)
    setBannerError(null)
    try {
      const form = new FormData()
      form.append('file', bannerFile)
      if (bannerLinkUrl.trim()) form.append('link_url', bannerLinkUrl.trim())
      const res = await fetch('/api/admin/banner/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setBannerError(data.error ?? 'Erro no upload'); return }
      setBannerUrl(data.banner.image_url)
      setBannerPreview(null)
      setBannerFile(null)
      setBannerLinkUrl('')
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    } catch {
      setBannerError('Erro de conexão')
    } finally {
      setBannerUploading(false)
    }
  }

  const handleBannerRemove = async () => {
    setBannerRemoving(true)
    setBannerError(null)
    try {
      const res = await fetch('/api/admin/banner', { method: 'DELETE' })
      if (res.ok) setBannerUrl(null)
      else { const d = await res.json(); setBannerError(d.error ?? 'Erro ao remover') }
    } catch {
      setBannerError('Erro de conexão')
    } finally {
      setBannerRemoving(false)
    }
  }

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
              onClick={() => router.push('/admin/afiliados')}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
            >
              🤝 Afiliados
            </button>
            <button
              onClick={() => router.push('/admin/bonificacao')}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700' }}
            >
              🎁 Bonificação
            </button>
            <button
              onClick={() => router.push('/admin/journey-content/new')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              + Criar Nova Jornada
            </button>
          </div>
        </div>

        {/* ── COUPON MANAGEMENT ── */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <div>
            <p className="text-sm font-black text-white tracking-wide">🎫 Cupons de Desconto</p>
            <p className="text-[11px] text-white/40 mt-0.5">Crie códigos de desconto para os planos</p>
          </div>

          {/* Form criar cupom */}
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Código</label>
              <input
                type="text"
                placeholder="EX: PROMO10"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); setCouponSuccess(null) }}
                maxLength={30}
                className="px-3 py-2 rounded-xl text-sm text-white outline-none w-40"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Desconto %</label>
              <input
                type="number"
                placeholder="10"
                min={1}
                max={100}
                value={couponDiscount}
                onChange={e => { setCouponDiscount(e.target.value); setCouponError(null); setCouponSuccess(null) }}
                className="px-3 py-2 rounded-xl text-sm text-white outline-none w-24"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
            </div>
            <button
              onClick={handleCreateCoupon}
              disabled={couponLoading}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 12px rgba(168,85,247,0.3)' }}
            >
              {couponLoading ? 'Criando...' : '+ Criar Cupom'}
            </button>
          </div>

          {couponError && <p className="text-xs text-red-400">{couponError}</p>}
          {couponSuccess && <p className="text-xs text-green-400">{couponSuccess}</p>}

          {/* Lista de cupons */}
          {coupons.length > 0 && (
            <div className="space-y-2 pt-1">
              {coupons.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.active ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <span
                    className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: c.active ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.06)', color: c.active ? '#a855f7' : 'rgba(255,255,255,0.3)' }}
                  >
                    {c.active ? 'ATIVO' : 'INATIVO'}
                  </span>
                  <span className="font-black text-sm text-white tracking-wider">{c.code}</span>
                  <span className="text-sm text-purple-300 font-bold">{c.discount_percent}% off</span>
                  <span className="text-[11px] text-white/30 ml-auto">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                  <button
                    onClick={() => handleToggleCoupon(c.id, c.active)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                    style={{ background: c.active ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', color: c.active ? '#eab308' : '#22c55e', border: `1px solid ${c.active ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}` }}
                  >
                    {c.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-red-400/60 border border-red-500/20 hover:bg-red-500/10 hover:text-red-300 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
          {coupons.length === 0 && (
            <p className="text-xs text-white/30 text-center py-2">Nenhum cupom cadastrado</p>
          )}
        </div>

        {/* ── BANNER MANAGEMENT ── */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-white tracking-wide">🖼️ Banner do Dashboard</p>
              <p className="text-[11px] text-white/40 mt-0.5">Imagem exibida no topo da tela dos usuários</p>
            </div>
            {bannerUrl && (
              <button
                onClick={handleBannerRemove}
                disabled={bannerRemoving}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                {bannerRemoving ? 'Removendo...' : '🗑️ Remover banner'}
              </button>
            )}
          </div>

          {/* Preview do banner atual */}
          {bannerUrl && !bannerPreview && (
            <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '4/1' }}>
              <Image src={bannerUrl} alt="Banner ativo" fill className="object-cover" />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/80 text-white">
                ● ATIVO
              </div>
            </div>
          )}

          {/* Preview do novo arquivo selecionado */}
          {bannerPreview && (
            <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '4/1' }}>
              <Image src={bannerPreview} alt="Pré-visualização" fill className="object-cover" />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/80 text-white">
                PRÉVIA
              </div>
            </div>
          )}

          {/* Form de upload */}
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleBannerFileChange}
                className="hidden"
                id="banner-file-input"
              />
              <label
                htmlFor="banner-file-input"
                className="cursor-pointer px-4 py-2 rounded-xl text-sm font-bold text-white border border-white/20 hover:bg-white/5 transition-all"
              >
                📁 Escolher imagem
              </label>
              {bannerFile && (
                <span className="text-xs text-white/50 truncate max-w-[200px]">{bannerFile.name}</span>
              )}
            </div>

            <input
              type="url"
              placeholder="Link ao clicar no banner (opcional)"
              value={bannerLinkUrl}
              onChange={e => setBannerLinkUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
            />

            {bannerError && (
              <p className="text-xs text-red-400">{bannerError}</p>
            )}

            <button
              onClick={handleBannerUpload}
              disabled={!bannerFile || bannerUploading}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #0055FF, #00D4FF)', boxShadow: bannerFile ? '0 0 16px rgba(0,212,255,0.3)' : 'none' }}
            >
              {bannerUploading ? 'Enviando...' : '⬆️ Publicar banner'}
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
