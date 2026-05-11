'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CourseCard from '@/src/components/CourseCard'

interface Course {
  id: string
  title: string
  description: string
  cover_url: string
  module_count: number
  watched_count: number
}

export default function WOAPlayPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/woaplay')
        .then((r) => {
          if (r.status === 403) throw new Error('premium')
          if (!r.ok) throw new Error('fetch')
          return r.json()
        })
        .then((d) => setCourses(d.courses ?? []))
        .catch((e) => {
          if (e.message === 'premium') router.push('/premium')
          else setError('Erro ao carregar conteúdo.')
        })
        .finally(() => setIsLoading(false))
    }
  }, [status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060A14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/50 text-xs tracking-widest font-bold">CARREGANDO CURSOS...</p>
        </div>
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
        style={{ background: 'rgba(6,10,20,0.9)' }}
      >
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="WOA" width={36} height={36} className="rounded-full border-2 border-cyan-400/40 object-cover" />
          <div>
            <p className="text-white font-black tracking-[0.18em] text-sm leading-none" style={{ textShadow: '0 0 12px rgba(0,212,255,0.4)' }}>
              WOA<span style={{ color: '#00D4FF' }}>PLAY</span>
            </p>
            <p className="text-cyan-400/40 text-[9px] tracking-[0.15em] font-bold leading-none mt-0.5">CONTEÚDO EM VÍDEO</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-1.5 text-[10px] font-black tracking-widest rounded-full transition-all hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
        >
          ← VOLTAR
        </Link>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-black tracking-[0.08em] text-white"
            style={{ textShadow: '0 0 30px rgba(0,212,255,0.3)' }}
          >
            Todos os Cursos
          </h1>
          <p className="text-white/30 text-sm mt-1">
            {courses.length} {courses.length === 1 ? 'curso disponível' : 'cursos disponíveis'}
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-red-400 font-bold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        {courses.length === 0 && !error ? (
          <div className="text-center py-20">
            <span className="text-6xl">🎬</span>
            <p className="mt-4 text-white/40 text-sm">Nenhum curso disponível ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
