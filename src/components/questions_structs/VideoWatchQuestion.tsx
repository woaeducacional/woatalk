'use client'

import { useEffect, useRef, useState } from 'react'

// Declarar tipos globais para YouTube API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface VideoWatchQuestionProps {
  /**
   * URL ou ID do vídeo do YouTube
   * Exemplo: "3SUcWS3WHPY" ou "https://www.youtube.com/watch?v=3SUcWS3WHPY"
   */
  videoUrl: string

  /**
   * Título do vídeo/pergunta
   * Exemplo: "Talking About Hobbies"
   */
  title?: string

  /**
   * Descrição/instruções
   * Exemplo: "Assista atentamente à mensagem"
   */
  description?: string

  /**
   * Callback quando o vídeo termina
   */
  onComplete: (xpEarned: number) => void

  /**
   * XP a ser ganho ao completar
   * @default 10
   */
  xpReward?: number

  /**
   * Emoji para o título
   * @default "🎯"
   */
  icon?: string
}

/**
 * Componente genérico para questões de "Assistir Vídeo"
 *
 * Uso:
 * ```tsx
 * <VideoWatchQuestion
 *   videoUrl="3SUcWS3WHPY"
 *   title="Hobbies"
 *   description="Listen carefully..."
 *   onComplete={(xp) => handleComplete(xp)}
 * />
 * ```
 *
 * Características:
 * - Suporta YouTube IFrame API
 * - Detecta automaticamente quando o vídeo termina
 * - Estado visual do progresso
 * - Botão desabilitado até o vídeo terminar
 */
export function VideoWatchQuestion({
  videoUrl,
  title = 'Video Insight',
  description = 'Assista atentamente',
  onComplete,
  xpReward = 10,
  icon = '🎯',
}: VideoWatchQuestionProps) {
  const [fadeIn, setFadeIn] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const playerRef = useRef<any>(null)
  const completedRef = useRef<boolean>(false)

  // Extrair videoId se estiver em formato de URL
  const getVideoId = (url: string): string => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1]?.split('&')[0] || url
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || url
    }
    return url // Assumir que é um videoId direto
  }

  const videoId = getVideoId(videoUrl)

  // Inicializar fadeIn
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Carregar YouTube API e criar player
  useEffect(() => {
    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return
      if (playerRef.current) return // evitar duplicatas
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          playsinline: 1,  // essencial para iOS não mostrar tela preta
          rel: 0,
        },
        events: {
          onStateChange: onPlayerStateChange,
        },
      })
    }

    if (typeof window === 'undefined') return

    if (window.YT && window.YT.Player) {
      // API já carregada (ex: outro player na página antes)
      createPlayer()
    } else {
      // Registrar callback que a API chama ao terminar de carregar
      const prevCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.()
        createPlayer()
      }

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
      }
    }
  }, [videoId])

  // Handler de mudança de estado do vídeo
  const onPlayerStateChange = (event: any) => {
    // 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
    if (event.data === 0 && !completedRef.current) {
      // Vídeo terminou
      completedRef.current = true
      setVideoCompleted(true)
    }
  }

  const handleComplete = () => {
    onComplete(xpReward)
  }

  return (
    <div className="space-y-8">
      {/* Prompt inicial */}
      <div
        className="text-center space-y-4 p-6 rounded-2xl"
        style={{
          background: 'rgba(0,102,255,0.1)',
          border: '1px solid rgba(0,212,255,0.2)',
          opacity: fadeIn ? 1 : 0,
          transition: 'opacity 0.8s ease-in',
        }}
      >
        <h2 className="text-2xl font-bold text-cyan-300">{icon} {title}</h2>
        <p className="text-lg text-blue-200/80">{title}</p>
        <p className="text-base text-blue-200/60 italic mt-4">{description}</p>
        <p className="text-sm text-blue-200/50 mt-2">
          Preste atenção à mensagem, ainda não tente entender os detalhes.
        </p>
      </div>

      {/* Video player */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#000' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <div id="youtube-player" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Botão de avançar após vídeo */}
      <button
        onClick={handleComplete}
        disabled={!videoCompleted}
        className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: videoCompleted
            ? 'linear-gradient(135deg, #003AB0, #0066FF)'
            : 'linear-gradient(135deg, #374151, #4b5563)',
        }}
      >
        {videoCompleted ? `✅ CONTINUAR (+${xpReward} XP)` : 'Assistindo vídeo...'}
      </button>
    </div>
  )
}
