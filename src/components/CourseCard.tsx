'use client'

import Image from 'next/image'
import Link from 'next/link'

interface CourseCardProps {
  id: string
  title: string
  description: string
  cover_url: string
  module_count: number
  watched_count: number
}

export default function CourseCard({ id, title, description, cover_url, module_count, watched_count }: CourseCardProps) {
  const progress = module_count > 0 ? Math.round((watched_count / module_count) * 100) : 0
  const isComplete = watched_count > 0 && watched_count === module_count

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      style={{
        background: 'linear-gradient(145deg, #0B1629, #060E1C)',
        border: '1px solid rgba(0,212,255,0.15)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Capa */}
      <div className="relative w-full aspect-video overflow-hidden">
        {cover_url ? (
          <Image
            src={cover_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #001A60, #003899)' }}
          >
            <span className="text-5xl">🎬</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,14,28,0.85) 0%, transparent 60%)' }} />

        {/* Completed badge */}
        {isComplete && (
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest"
            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)', color: '#22c55e' }}
          >
            ✓ CONCLUÍDO
          </div>
        )}

        {/* Module count */}
        <div className="absolute bottom-3 left-3">
          <span
            className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
          >
            {module_count} {module_count === 1 ? 'MÓDULO' : 'MÓDULOS'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-white font-black text-sm leading-tight tracking-wide line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{description}</p>
        )}

        {/* Progress bar */}
        {module_count > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-cyan-400/50 font-bold tracking-[0.15em]">PROGRESSO</span>
              <span className="text-[9px] font-black" style={{ color: isComplete ? '#22c55e' : '#00D4FF' }}>
                {watched_count}/{module_count}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: isComplete
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #00AAFF, #00D4FF)',
                  boxShadow: isComplete ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(0,212,255,0.4)',
                }}
              />
            </div>
          </div>
        )}

        <Link
          href={`/woaplay/${id}`}
          className="block w-full text-center py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #0055FF, #00AAFF)',
            boxShadow: '0 0 18px rgba(0,150,255,0.3)',
            color: '#fff',
          }}
        >
          ACESSAR CONTEÚDO →
        </Link>
      </div>
    </div>
  )
}
