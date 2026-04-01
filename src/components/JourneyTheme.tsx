'use client'

import { useEffect, useState } from 'react'

interface JourneyThemeProps {
  phaseId: number
  phaseName: string
  onDismiss: () => void
}

const PHASE_THEMES: Record<number, { pt: string; en: string; description: string }> = {
  1: {
    pt: 'O Alfabeto',
    en: 'The Alphabet',
    description: 'Conheça as letras e sons fundamentais do inglês. | Learn the letters and fundamental sounds of English.'
  },
  2: {
    pt: 'Apresente-se',
    en: 'Introduce Yourself',
    description: 'Aprenda a se apresentar e falar sobre si mesmo. | Learn to introduce yourself and talk about yourself.'
  },
  3: {
    pt: 'Falando sobre Coisas',
    en: 'Talking About Things',
    description: 'Desenvolva vocabulário para descrever objetos e pessoas. | Build vocabulary to describe objects and people.'
  },
  4: {
    pt: 'Contando até 20',
    en: 'Counting Up to 20',
    description: 'Domine os números e expressões numéricas. | Master numbers and numerical expressions.'
  },
  5: {
    pt: 'De 20 a 1000',
    en: 'Counting from 20 to 1000',
    description: 'Expanda seu conhecimento numérico para valores maiores. | Expand your numerical knowledge for larger values.'
  },
}

export function JourneyTheme({ phaseId, phaseName, onDismiss }: JourneyThemeProps) {
  const [show, setShow] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50)
    return () => clearTimeout(t)
  }, [])

  const theme = PHASE_THEMES[phaseId] || {
    pt: phaseName,
    en: phaseName,
    description: 'Explore um novo tema da jornada. | Explore a new theme in your journey.',
  }

  const handleClick = () => {
    setFadeOut(true)
    setTimeout(() => {
      setShow(false)
      onDismiss()
    }, 800)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      {/* Conteúdo do tema */}
      <div
        className="relative mx-4 max-w-2xl w-full cursor-pointer"
        onClick={handleClick}
      >
        {/* Título */}
        <div
          className="text-center space-y-4"
          style={{
            opacity: fadeOut ? 0 : 1,
            transform: fadeOut ? 'translateY(20px)' : 'translateY(0)',
            transition: 'all 0.8s ease-out',
          }}
        >
          {/* Títulos bilíngues */}
          <div className="space-y-2">
            <h1
              className="text-5xl sm:text-6xl font-black tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #0066FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(0,212,255,0.3)',
              }}
            >
              {theme.pt}
            </h1>
            <p className="text-xl sm:text-2xl text-cyan-300/70 font-light tracking-wide">
              {theme.en}
            </p>
          </div>

          {/* Descrição bilíngue */}
          <div className="mt-8 space-y-3 rounded-2xl px-6 sm:px-8 py-6 backdrop-blur-md" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
            <p className="text-base sm:text-lg text-blue-200/80 leading-relaxed font-light">
              {theme.description.split('|')[0]}
            </p>
            <p className="text-base sm:text-lg text-blue-200/70 leading-relaxed font-light italic">
              {theme.description.split('|')[1]}
            </p>
          </div>

          {/* Instrução de clique */}
          <p
            className="text-sm sm:text-base text-cyan-400/60 tracking-widest font-bold mt-8"
            style={{
              opacity: fadeOut ? 0 : 1,
              transition: 'opacity 0.6s ease-out',
            }}
          >
            CLIQUE PARA CONTINUAR
          </p>
        </div>
      </div>
    </div>
  )
}
