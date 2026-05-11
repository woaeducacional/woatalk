'use client'

import { useState } from 'react'
import { extractYouTubeId } from '@/lib/woaplay'

interface ModulePlayerProps {
  url: string
  title?: string
}

export default function ModulePlayer({ url, title }: ModulePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const videoId = extractYouTubeId(url)

  // autoplay=1 ao clicar no play — assim o vídeo inicia sem mostrar os controles do YT
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&controls=0&disablekb=1&autoplay=1`
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div className="w-full space-y-2" onContextMenu={(e) => e.preventDefault()}>
      {title && (
        <h2 className="text-white font-black text-lg tracking-wide">{title}</h2>
      )}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{
          paddingBottom: '56.25%',
          background: '#000',
          boxShadow: '0 0 40px rgba(0,0,0,0.6)',
          border: '1px solid rgba(0,212,255,0.15)',
        }}
      >
        {playing ? (
          <iframe
            src={embedUrl}
            title={title ?? 'WOAPlay Vídeo'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          /* Thumbnail overlay — cobre o iframe antes do play */
          <div
            className="absolute inset-0 cursor-pointer group"
            onClick={() => setPlaying(true)}
            style={{
              backgroundImage: `url(${thumbUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Escurecimento no hover */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all" />
            {/* Botão play customizado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: 'rgba(0,212,255,0.9)', boxShadow: '0 0 30px rgba(0,212,255,0.5)' }}
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
