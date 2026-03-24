'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { playEagle } from '@/lib/sounds'

interface EagleTipProps {
  /** Unique key stored in localStorage to track if this tip was dismissed */
  storageKey: string
  /** The message lines to show in the speech bubble */
  lines: string[]
  /** Text for the dismiss button (default: "VAMOS COMEÇAR") */
  buttonLabel?: string
  /** Optional callback when dismissed */
  onDismiss?: () => void
  /**
   * Controlled mode — when provided, this value drives visibility directly
   * (bypasses localStorage auto-show logic). Still sets localStorage on dismiss.
   */
  show?: boolean
}

export function EagleTip({ storageKey, lines, buttonLabel = 'VAMOS COMEÇAR', onDismiss, show }: EagleTipProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Controlled mode: show prop drives visibility
    if (show !== undefined) {
      if (show) playEagle()
      setVisible(show)
      return
    }
    // Auto-show mode: driven by localStorage
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      setVisible(true)
      playEagle()
    }
  }, [storageKey, show])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
    onDismiss?.()
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <div className="flex items-end max-w-xl w-full">

        {/* Speech bubble */}
        <div
          className="relative w-56 flex-shrink-0 rounded-2xl rounded-br-none p-6"
          style={{
            background: 'rgba(5,14,26,0.97)',
            border: '1px solid rgba(0,212,255,0.35)',
            boxShadow: '0 0 40px rgba(0,212,255,0.18)',
          }}
        >
          {/* Bubble tail pointing right toward eagle */}
          <div
            className="absolute -right-[10px] bottom-8 w-0 h-0"
            style={{
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderLeft: '10px solid rgba(0,212,255,0.35)',
            }}
          />
          <div
            className="absolute -right-[8px] bottom-[33px] w-0 h-0"
            style={{
              borderTop: '9px solid transparent',
              borderBottom: '9px solid transparent',
              borderLeft: '9px solid rgba(5,14,26,0.97)',
            }}
          />

          {/* Text */}
          <div className="space-y-2 mb-5">
            {lines.map((line, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed"
                style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)' }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Button */}
          <button
            onClick={dismiss}
            className="w-full text-xs font-black tracking-widest py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg,#0043BB,#00D4FF)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(0,212,255,0.35)',
            }}
          >
            {buttonLabel}
          </button>
        </div>

        {/* Eagle — right side, large */}
        <div
          className="relative flex-shrink-0 w-80 h-80 drop-shadow-2xl"
          style={{ animation: 'bob 3s ease-in-out infinite', marginBottom: '-16px' }}
        >
          <Image
            src="/images/aguia_mergulhadora.png"
            alt="Águia Mergulhadora"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
