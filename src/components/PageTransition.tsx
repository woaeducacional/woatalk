'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && link.href && !link.target) {
        setIsLoading(true)
        setIsFading(false)
        // Inicia fade-out após 700ms
        setTimeout(() => {
          setIsFading(true)
        }, 700)
        // Fecha completamente após 900ms
        setTimeout(() => {
          setIsLoading(false)
        }, 900)
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-black z-50 backdrop-blur-sm transition-all duration-300 ${
        isFading ? 'opacity-0' : 'opacity-50'
      }`}
    >
      <div 
        className={`flex flex-col items-center gap-6 transition-all duration-300 ${
          isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Spinner grande */}
        <div className="relative w-24 h-24">
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white animate-spin"
            style={{
              animationDuration: '0.8s',
            }}
          ></div>
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-b-secondary-500 opacity-50 animate-spin"
            style={{
              animationDuration: '1.2s',
              animationDirection: 'reverse',
            }}
          ></div>
        </div>
        <p className="text-white font-semibold text-lg">Entrando na Jornada...</p>
      </div>
    </div>
  )
}
