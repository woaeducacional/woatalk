'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface JourneyCoverImageProps {
  phaseId: number
  onDismiss: () => void
}

export function JourneyCoverImage({ phaseId, onDismiss }: JourneyCoverImageProps) {
  const [show, setShow] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  const handleClick = () => {
    setFadeOut(true)
    setTimeout(() => {
      setShow(false)
      onDismiss()
    }, 800) // tempo de fadeout
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
      {/* Moldura com estilo do site */}
      <div
        className="relative mx-4 rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full cursor-pointer"
        style={{
          border: '3px solid #00D4FF',
          boxShadow: '0 0 60px rgba(0,212,255,0.4), inset 0 0 40px rgba(0,212,255,0.08)',
          height: 'auto',
          minHeight: '480px',
        }}
        onClick={handleClick}
      >
        {/* Imagem de capa */}
        <Image
          src="/images/capa.png"
          alt="Capa da Jornada"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
