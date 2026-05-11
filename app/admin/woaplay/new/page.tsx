'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ModuleForm from '@/src/components/ModuleForm'
import type { WOAPlayModule } from '@/lib/woaplay'

export default function AdminWOAPlayNew() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const [modules, setModules] = useState<WOAPlayModule[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingModule, setEditingModule] = useState<WOAPlayModule | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingMaterialFor, setUploadingMaterialFor] = useState<string | null>(null)
  const [courseId, setCourseId] = useState<string | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const materialInputRef = useRef<HTMLInputElement>(null)
  const activeMaterialModuleId = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') router.push('/auth/signin')
  }, [status, session, router])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/woaplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: courseId, title, description, cover_url: coverUrl, is_published: isPublished, modules }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveMsg(data.error ?? 'Erro ao salvar'); return }
      if (!courseId) setCourseId(data.course.id)
      setSaveMsg('✓ Salvo com sucesso!')
      setTimeout(() => setSaveMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !courseId) return
    setUploadingCover(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/woaplay/${courseId}/upload-cover`, { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) setCoverUrl(data.url)
    setUploadingCover(false)
    e.target.value = ''
  }

  async function handleMaterialUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const modId = activeMaterialModuleId.current
    if (!file || !courseId || !modId) return
    setUploadingMaterialFor(modId)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('moduleId', modId)
    const res = await fetch(`/api/woaplay/${courseId}/upload-material`, { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) {
      setModules((prev) =>
        prev.map((m) =>
          m.id === modId ? { ...m, materials: [...m.materials, data.material] } : m
        )
      )
    }
    setUploadingMaterialFor(null)
    e.target.value = ''
  }

  async function handleDeleteMaterial(moduleId: string, materialId: string) {
    if (!courseId) return
    await fetch(`/api/woaplay/${courseId}/upload-material?moduleId=${moduleId}&materialId=${materialId}`, { method: 'DELETE' })
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, materials: m.materials.filter((mat) => mat.id !== materialId) } : m
      )
    )
  }

  function handleSaveModule(mod: WOAPlayModule) {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.id === mod.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = mod
        return updated
      }
      return [...prev, mod]
    })
    setShowModuleForm(false)
    setEditingModule(null)
  }

  function handleDeleteModule(id: string) {
    setModules((prev) => prev.filter((m) => m.id !== id).map((m, i) => ({ ...m, position: i + 1 })))
  }

  function handleMoveModule(id: string, dir: -1 | 1) {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.id === id)
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr.map((m, i) => ({ ...m, position: i + 1 }))
    })
  }

  const needsSaveFirst = !courseId

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060A14' }}>
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen pb-12" style={{ background: '#060A14' }}>
      {/* Scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.018]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00FFFF 2px, #00FFFF 3px)' }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 border-b border-cyan-400/15 backdrop-blur-md"
        style={{ background: 'rgba(6,10,20,0.92)' }}
      >
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="WOA" width={34} height={34} className="rounded-full border-2 border-cyan-400/40 object-cover" />
          <div>
            <p className="text-white font-black tracking-[0.18em] text-sm leading-none">
              ADMIN · <span style={{ color: '#00D4FF' }}>NOVO CURSO</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-xs font-bold ${saveMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-[10px] font-black tracking-widest rounded-full text-white transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #0055FF, #00AAFF)', boxShadow: '0 0 16px rgba(0,150,255,0.3)' }}
          >
            {saving ? 'SALVANDO...' : '💾 SALVAR'}
          </button>
          <Link
            href="/admin/woaplay"
            className="px-4 py-2 text-[10px] font-black tracking-widest rounded-full transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
          >
            ← LISTA
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── SEÇÃO 1: BÁSICO ── */}
        <section
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-white font-black text-xs tracking-[0.25em]">● INFORMAÇÕES DO CURSO</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Cover */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black tracking-widest text-cyan-400/60">CAPA DO CURSO</label>
              <div
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group"
                style={{ background: 'rgba(0,80,220,0.08)', border: '2px dashed rgba(0,180,255,0.2)' }}
                onClick={() => courseId ? coverInputRef.current?.click() : null}
              >
                {coverUrl ? (
                  <Image src={coverUrl} alt="capa" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🖼️</span>
                    <span className="text-white/20 text-xs font-bold">
                      {needsSaveFirst ? 'Salve primeiro para fazer upload' : 'Clique para fazer upload'}
                    </span>
                  </div>
                )}
                {uploadingCover && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <div className="w-6 h-6 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                  </div>
                )}
                {coverUrl && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-black tracking-widest">TROCAR CAPA</span>
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-cyan-400/60 mb-1.5">TÍTULO *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Curso Prático de Conversação"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-cyan-400/60 mb-1.5">DESCRIÇÃO</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição do curso..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Published toggle */}
              <div
                className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setIsPublished(!isPublished)}
              >
                <div>
                  <p className="text-white text-sm font-bold">Publicado</p>
                  <p className="text-white/30 text-xs">Visível para assinantes premium</p>
                </div>
                <div
                  className="w-10 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: isPublished ? '#00AAFF' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: isPublished ? '22px' : '2px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {needsSaveFirst && title.trim() && (
            <p className="text-cyan-400/50 text-xs">
              💡 Salve o curso primeiro para poder adicionar módulos e upload de capa.
            </p>
          )}
        </section>

        {/* ── SEÇÃO 2: MÓDULOS ── */}
        <section
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-xs tracking-[0.25em]">● MÓDULOS ({modules.length})</h2>
            <button
              onClick={() => { setEditingModule(null); setShowModuleForm(true) }}
              disabled={needsSaveFirst}
              className="px-4 py-2 text-[10px] font-black tracking-widest rounded-full text-white transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(0,150,255,0.15)', border: '1px solid rgba(0,200,255,0.3)', color: '#00D4FF' }}
            >
              + NOVO MÓDULO
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl">🎬</span>
              <p className="mt-3 text-white/25 text-xs">
                {needsSaveFirst ? 'Salve o curso para começar a adicionar módulos.' : 'Nenhum módulo adicionado ainda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div
                className="grid gap-3 px-3 py-2 text-[9px] font-black tracking-[0.2em]"
                style={{ color: 'rgba(255,255,255,0.2)', gridTemplateColumns: '36px 1fr 80px 90px 110px' }}
              >
                <span>#</span>
                <span>TÍTULO</span>
                <span className="text-center">PRÁTICA</span>
                <span className="text-center">MATERIAIS</span>
                <span className="text-center">AÇÕES</span>
              </div>

              {modules.map((mod, idx) => (
                <div key={mod.id}>
                  <div
                    className="grid gap-3 items-center px-3 py-3 rounded-xl transition-all hover:bg-white/[0.03]"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      gridTemplateColumns: '36px 1fr 80px 90px 110px',
                    }}
                  >
                    {/* Position */}
                    <div className="flex flex-col gap-0.5 items-center">
                      <button onClick={() => handleMoveModule(mod.id, -1)} disabled={idx === 0} className="text-white/20 hover:text-white/60 disabled:opacity-20 text-xs leading-none">▲</button>
                      <span className="text-white/40 font-black text-xs">{mod.position}</span>
                      <button onClick={() => handleMoveModule(mod.id, 1)} disabled={idx === modules.length - 1} className="text-white/20 hover:text-white/60 disabled:opacity-20 text-xs leading-none">▼</button>
                    </div>

                    {/* Title */}
                    <p className="text-white text-xs font-bold truncate">{mod.video_title}</p>

                    {/* Practice */}
                    <div className="text-center">
                      <span className={`text-xs font-black ${mod.has_practice_video ? 'text-green-400' : 'text-white/20'}`}>
                        {mod.has_practice_video ? '✓ SIM' : '—'}
                      </span>
                    </div>

                    {/* Materials count */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-white/50 font-black text-xs">{mod.materials.length}</span>
                      <button
                        onClick={() => {
                          activeMaterialModuleId.current = mod.id
                          materialInputRef.current?.click()
                        }}
                        className="text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md transition-all hover:scale-105"
                        style={{ background: 'rgba(0,150,255,0.1)', border: '1px solid rgba(0,200,255,0.2)', color: '#00AAFF' }}
                      >
                        {uploadingMaterialFor === mod.id ? '...' : '+ ADD'}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={() => { setEditingModule(mod); setShowModuleForm(true) }}
                        className="px-2.5 py-1 text-[8px] font-black tracking-widest rounded-lg transition-all hover:scale-105"
                        style={{ background: 'rgba(0,150,255,0.1)', border: '1px solid rgba(0,200,255,0.2)', color: '#00AAFF' }}
                      >
                        EDITAR
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="px-2.5 py-1 text-[8px] font-black tracking-widest rounded-lg transition-all hover:scale-105"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Materials list inline */}
                  {mod.materials.length > 0 && (
                    <div className="ml-9 mt-1 space-y-1">
                      {mod.materials.map((mat) => (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <span className="text-white/40 text-xs truncate">📎 {mat.file_name}</span>
                          <button
                            onClick={() => handleDeleteMaterial(mod.id, mat.id)}
                            className="text-red-400/40 hover:text-red-400 text-xs transition-colors flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hidden file input for materials */}
          <input ref={materialInputRef} type="file" className="hidden" onChange={handleMaterialUpload} />
        </section>
      </div>

      {/* Module Form Modal */}
      {showModuleForm && (
        <ModuleForm
          initial={editingModule ?? undefined}
          nextPosition={modules.length + 1}
          onSave={handleSaveModule}
          onCancel={() => { setShowModuleForm(false); setEditingModule(null) }}
        />
      )}
    </main>
  )
}
