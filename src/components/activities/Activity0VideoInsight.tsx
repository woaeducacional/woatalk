'use client'

import { useEffect, useState } from 'react'

interface Activity0VideoInsightProps {
  onComplete: (xp: number) => void
}

export function Activity0VideoInsight({ onComplete }: Activity0VideoInsightProps) {
  const [videoWatched, setVideoWatched] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleVideoWatched = () => {
    setVideoWatched(true)
    setTimeout(() => setShowPrompt(true), 300)
  }

  const handleContinue = () => {
    onComplete(10) // 10 XP por assistir ao vídeo
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
        <h2 className="text-2xl font-bold text-cyan-300">🎯 Video Insight</h2>
        <p className="text-lg text-blue-200/80">Talking About Hobbies</p>
        <p className="text-base text-blue-200/60 italic mt-4">Assista atentamente</p>
        <p className="text-sm text-blue-200/50 mt-2">
          Preste atenção atenção à mensagem, ainda não tente entender os detalhes.
        </p>
      </div>

      {/* Video player */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#000' }}>
        <iframe
          width="100%"
          height="450"
          src="https://www.youtube.com/embed/3SUcWS3WHPY?rel=0"
          title="Video Insight Challenge - Talking About Hobbies"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleVideoWatched}
        />
      </div>

      {/* Mensagem pós-vídeo */}
      {showPrompt && (
        <button
          onClick={handleContinue}
          className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #003AB0, #0066FF)',
            animation: 'fadeIn 0.6s ease-in',
          }}
        >
          ✅ CONTINUAR (+10 XP)
        </button>
      )}

      {/* Fallback se vídeo falhar */}
      {videoWatched && !showPrompt && (
        <div className="space-y-4">
          <p className="text-base text-red-300/80 text-center">
            ⚠️ Pode haver problema com o carregamento do vídeo. Você pode prosseguir mesmo assim.
          </p>
          <button
            onClick={handleContinue}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
            }}
          >
            ✅ CONTINUAR MESMO ASSIM (+10 XP)
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
