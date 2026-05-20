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

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

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
              onClick={() => router.push('/admin/journey-content/new')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              + Criar Nova Jornada
            </button>
          </div>
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
