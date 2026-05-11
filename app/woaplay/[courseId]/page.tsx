'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import ModulePlayer from '@/src/components/ModulePlayer'
import MaterialsList from '@/src/components/MaterialsList'
import ModuleProgress from '@/src/components/ModuleProgress'
import type { WOAPlayCourse, WOAPlayModule } from '@/lib/woaplay'

type CourseData = Omit<WOAPlayCourse, 'user_progress'>

export default function WOAPlayCoursePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<CourseData | null>(null)
  const [watchedModules, setWatchedModules] = useState<string[]>([])
  const [activeModule, setActiveModule] = useState<WOAPlayModule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [markingWatched, setMarkingWatched] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      fetch(`/api/woaplay/${courseId}`)
        .then((r) => {
          if (r.status === 403) throw new Error('premium')
          if (r.status === 404) throw new Error('not_found')
          if (!r.ok) throw new Error('fetch')
          return r.json()
        })
        .then((d) => {
          setCourse(d.course)
          setWatchedModules(d.watched_modules ?? [])
          const modules: WOAPlayModule[] = d.course?.modules ?? []
          if (modules.length > 0) setActiveModule(modules[0])
        })
        .catch((e) => {
          if (e.message === 'premium') router.push('/premium')
          else router.push('/woaplay')
        })
        .finally(() => setIsLoading(false))
    }
  }, [status, router, courseId])

  const handleMarkWatched = useCallback(async () => {
    if (!activeModule || markingWatched) return
    setMarkingWatched(true)
    try {
      const res = await fetch(`/api/woaplay/${courseId}/mark-watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: activeModule.id }),
      })
      const data = await res.json()
      if (res.ok) setWatchedModules(data.watched ?? [])
    } finally {
      setMarkingWatched(false)
    }
  }, [activeModule, markingWatched, courseId])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060A14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/50 text-xs tracking-widest font-bold">CARREGANDO...</p>
        </div>
      </div>
    )
  }

  if (!course) return null

  const modules: WOAPlayModule[] = course.modules ?? []
  const watchedCount = watchedModules.length
  const totalModules = modules.length
  const progressPct = totalModules > 0 ? Math.round((watchedCount / totalModules) * 100) : 0
  const isActiveWatched = activeModule ? watchedModules.includes(activeModule.id) : false

  return (
    <main className="min-h-screen" style={{ background: '#060A14' }}>
      {/* Scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.018]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00FFFF 2px, #00FFFF 3px)' }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 border-b border-cyan-400/15 backdrop-blur-md"
        style={{ background: 'rgba(6,10,20,0.92)' }}
      >
        <Link href="/woaplay" className="text-cyan-400/50 hover:text-cyan-300 transition-colors text-xs font-bold tracking-widest flex-shrink-0">
          ← CURSOS
        </Link>
        <div className="h-4 w-px bg-white/10 flex-shrink-0" />
        <p className="text-white font-black text-sm tracking-wide truncate flex-1">
          {course.title}
        </p>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden flex-shrink-0 p-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-52px)]">
        {/* ── SIDEBAR ── */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)} />
        )}

        <aside
          className={`
            fixed lg:relative z-50 lg:z-auto
            w-72 lg:w-64 xl:w-72 h-[calc(100vh-52px)] flex-shrink-0
            flex flex-col
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{
            background: 'rgba(6,10,20,0.98)',
            borderRight: '1px solid rgba(0,212,255,0.1)',
          }}
        >
          {/* Progress summary */}
          <div className="p-4 border-b border-white/[0.06] space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/40 font-bold tracking-widest">PROGRESSO</span>
              <span className="font-black" style={{ color: progressPct === 100 ? '#22c55e' : '#00D4FF' }}>
                {watchedCount}/{totalModules}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #00AAFF, #00D4FF)',
                  boxShadow: progressPct === 100 ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(0,212,255,0.4)',
                }}
              />
            </div>
          </div>

          {/* Module list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-[9px] font-black tracking-[0.2em] text-white/20 px-1 pb-1">MÓDULOS</p>
            {modules.map((mod) => (
              <ModuleProgress
                key={mod.id}
                moduleId={mod.id}
                position={mod.position}
                title={mod.video_title}
                isWatched={watchedModules.includes(mod.id)}
                isActive={activeModule?.id === mod.id}
                onClick={() => { setActiveModule(mod); setSidebarOpen(false) }}
              />
            ))}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
            {activeModule ? (
              <>
                {/* Video Player */}
                <ModulePlayer url={activeModule.video_url} title={activeModule.video_title} />

                {/* Mark as watched */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleMarkWatched}
                    disabled={isActiveWatched || markingWatched}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={
                      isActiveWatched
                        ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e' }
                        : { background: 'rgba(0,150,255,0.15)', border: '1px solid rgba(0,200,255,0.35)', color: '#00D4FF' }
                    }
                  >
                    {isActiveWatched ? '✓ AULA CONCLUÍDA' : markingWatched ? 'SALVANDO...' : '✓ MARCAR COMO CONCLUÍDA'}
                  </button>

                  {/* Nav prev/next */}
                  <div className="flex gap-2 ml-auto">
                    {(() => {
                      const idx = modules.findIndex((m) => m.id === activeModule.id)
                      return (
                        <>
                          <button
                            onClick={() => idx > 0 && setActiveModule(modules[idx - 1])}
                            disabled={idx === 0}
                            className="px-3.5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all hover:scale-105 disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                          >
                            ‹‹ ANTERIOR
                          </button>
                          <button
                            onClick={() => idx < modules.length - 1 && setActiveModule(modules[idx + 1])}
                            disabled={idx === modules.length - 1}
                            className="px-3.5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all hover:scale-105 disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                          >
                            PRÓXIMO ››
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Materials */}
                {activeModule.materials && activeModule.materials.length > 0 && (
                  <div
                    className="p-5 rounded-2xl space-y-4"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <MaterialsList materials={activeModule.materials} />
                  </div>
                )}

                {/* Practice Video */}
                {activeModule.has_practice_video && activeModule.practice_video_url && (
                  <div
                    className="p-5 rounded-2xl space-y-4"
                    style={{ background: 'rgba(255,120,0,0.04)', border: '1px solid rgba(255,120,0,0.15)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎯</span>
                      <h3 className="text-white font-black text-sm tracking-[0.12em]">VÍDEO DE PRÁTICA</h3>
                    </div>
                    <ModulePlayer url={activeModule.practice_video_url} />
                  </div>
                )}

                {/* Comments */}
                <div
                  className="p-5 rounded-2xl space-y-5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <h3 className="text-white font-black text-sm tracking-[0.12em]">
                    Deixe abaixo seu comentário
                  </h3>
                  <CourseCommentBox courseId={courseId} moduleId={activeModule.id} />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <span className="text-5xl">🎬</span>
                  <p className="mt-4 text-white/40 text-sm">Selecione um módulo para assistir</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

// Inline comment box component (integrates with community posts)
function CourseCommentBox({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)

  const handlePost = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: 'woaplay_comment',
          payload: {
            courseId,
            moduleId,
            text: text.trim(),
            userName: session?.user?.name,
          },
        }),
      })
      setText('')
      setPosted(true)
      setTimeout(() => setPosted(false), 3000)
    } finally {
      setPosting(false)
    }
  }

  const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black"
          style={{ background: 'rgba(0,150,255,0.2)', border: '2px solid rgba(0,200,255,0.3)', color: '#00D4FF' }}
        >
          {session?.user?.image ? (
            <Image src={session.user.image} alt="avatar" width={40} height={40} className="rounded-full object-cover" />
          ) : (
            userInitial
          )}
        </div>
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva seu comentário aqui..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-cyan-400/40 resize-none transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={handlePost}
            disabled={!text.trim() || posting}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg transition-all hover:scale-110 disabled:opacity-30"
            style={{ color: '#3B82F6' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
      {posted && (
        <p className="text-green-400 text-xs font-bold">✓ Comentário enviado com sucesso!</p>
      )}
      <p className="text-white/20 text-xs">
        Comentários são visíveis na{' '}
        <Link href="/community" className="text-cyan-400/50 hover:text-cyan-300 transition-colors">
          Comunidade
        </Link>
      </p>
    </div>
  )
}


