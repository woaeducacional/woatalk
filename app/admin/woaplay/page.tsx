'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface CourseRow {
  id: string
  title: string
  description: string
  cover_url: string
  is_published: boolean
  modules: unknown[]
  created_at: string
}

export default function AdminWOAPlay() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.role !== 'admin') {
      router.push('/auth/signin')
      return
    }
    fetchCourses()
  }, [status, session, router])

  function fetchCourses() {
    setLoading(true)
    // Admin can read all (published and unpublished) — use a direct call
    fetch('/api/woaplay/admin')
      .then((r) => r.ok ? r.json() : { courses: [] })
      .then((d) => setCourses(d.courses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/woaplay/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== id))
        setConfirmDeleteId(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  async function togglePublished(course: CourseRow) {
    const res = await fetch('/api/woaplay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: course.id, title: course.title, description: course.description, cover_url: course.cover_url, is_published: !course.is_published, modules: course.modules }),
    })
    if (res.ok) {
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_published: !c.is_published } : c))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060A14' }}>
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#060A14' }}>
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
              ADMIN · <span style={{ color: '#00D4FF' }}>WOAPLAY</span>
            </p>
            <p className="text-cyan-400/40 text-[9px] tracking-widest font-bold leading-none mt-0.5">{courses.length} CURSOS</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/woaplay/new')}
            className="px-4 py-2 text-[10px] font-black tracking-widest rounded-full text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0055FF, #00AAFF)', boxShadow: '0 0 16px rgba(0,150,255,0.3)' }}
          >
            + NOVO CURSO
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-[10px] font-black tracking-widest rounded-full transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
          >
            ← DASHBOARD
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {courses.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-5xl mb-4">🎬</p>
            <p className="text-white/40 text-sm mb-5">Nenhum curso criado ainda.</p>
            <button
              onClick={() => router.push('/admin/woaplay/new')}
              className="px-6 py-3 text-xs font-black tracking-widest text-white rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0055FF, #00AAFF)', boxShadow: '0 0 18px rgba(0,150,255,0.3)' }}
            >
              + CRIAR PRIMEIRO CURSO
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-[80px_1fr_100px_100px_140px] gap-4 px-5 py-3 text-[9px] font-black tracking-[0.2em] border-b"
              style={{ color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span>CAPA</span>
              <span>CURSO</span>
              <span className="text-center">MÓDULOS</span>
              <span className="text-center">STATUS</span>
              <span className="text-center">AÇÕES</span>
            </div>

            {/* Rows */}
            {courses.map((course) => (
              <div
                key={course.id}
                className="grid grid-cols-[80px_1fr_100px_100px_140px] gap-4 items-center px-5 py-4 border-b transition-all hover:bg-white/[0.02]"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                {/* Cover thumbnail */}
                <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(0,80,220,0.15)' }}>
                  {course.cover_url ? (
                    <Image src={course.cover_url} alt={course.title} width={64} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-white font-black text-sm truncate">{course.title}</p>
                  {course.description && (
                    <p className="text-white/30 text-xs truncate mt-0.5">{course.description}</p>
                  )}
                </div>

                {/* Module count */}
                <div className="text-center">
                  <span className="text-white/60 font-black text-sm">
                    {Array.isArray(course.modules) ? course.modules.length : 0}
                  </span>
                </div>

                {/* Published toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => togglePublished(course)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest transition-all hover:scale-105"
                    style={
                      course.is_published
                        ? { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }
                    }
                  >
                    {course.is_published ? '● PUBLICADO' : '○ RASCUNHO'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => router.push(`/admin/woaplay/${course.id}`)}
                    className="px-3 py-1.5 text-[9px] font-black tracking-widest rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(0,150,255,0.12)', border: '1px solid rgba(0,200,255,0.25)', color: '#00AAFF' }}
                  >
                    EDITAR
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(course.id)}
                    className="px-3 py-1.5 text-[9px] font-black tracking-widest rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                  >
                    DELETAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div
            className="w-full max-w-sm text-center space-y-5 p-8 rounded-2xl"
            style={{ background: '#0B1120', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 0 40px rgba(239,68,68,0.2)' }}
          >
            <p className="text-white font-black text-base tracking-widest">DELETAR CURSO?</p>
            <p className="text-white/40 text-sm">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={!!deletingId}
                className="px-6 py-2.5 text-xs font-black tracking-widest rounded-full transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}
              >
                {deletingId ? 'DELETANDO...' : 'SIM, DELETAR'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-6 py-2.5 text-xs font-black tracking-widest rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
