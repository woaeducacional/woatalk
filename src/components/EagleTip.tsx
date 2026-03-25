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
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    // Controlled mode: show prop drives visibility
    if (show !== undefined) {
      if (show) playEagle()
      setVisible(show)
      setIsClosing(false)
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
    setIsClosing(true)
    setTimeout(() => {
      localStorage.setItem(storageKey, '1')
      setVisible(false)
      setIsClosing(false)
      onDismiss?.()
    }, 300) // Match the animation duration
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-6"
      style={{
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        animation: isClosing ? 'fadeOut 0.3s ease-out forwards' : 'fadeIn 0.5s ease-out',
      }}
    >
      {/* Mobile: vertical stack — Eagle on top, bubble below */}
      {/* Desktop: horizontal — bubble left, eagle right */}
      <div className="flex flex-col sm:flex-row sm:items-end w-full max-w-sm sm:max-w-xl" style={{
        animation: isClosing ? 'slideOutDown 0.3s ease-in forwards' : 'slideInUp 0.5s ease-out',
      }}>

        {/* Eagle — top on mobile, right on desktop */}
        <div
          className="relative self-center sm:order-2 sm:flex-shrink-0 w-40 h-40 sm:w-80 sm:h-80 drop-shadow-2xl"
          style={{ animation: isClosing ? 'none' : 'bob 3s ease-in-out infinite', marginBottom: '-16px' }}
        >
          <Image
            src="/images/aguia_mergulhadora.png"
            alt="Águia Mergulhadora"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Speech bubble */}
        <div
          className="relative sm:order-1 sm:flex-shrink-0 w-full max-w-xs sm:max-w-none sm:w-56 rounded-2xl sm:rounded-2xl sm:rounded-br-none rounded-t-2xl rounded-b-2xl p-4 sm:p-6 transition-all duration-300"
          style={{
            background: 'rgba(5,14,26,0.97)',
            border: '1px solid rgba(0,212,255,0.35)',
            boxShadow: '0 0 40px rgba(0,212,255,0.18)',
            transform: isClosing ? 'scale(0.95)' : 'scale(1)',
            opacity: isClosing ? 0.8 : 1,
          }}
        >
          {/* Bubble tail — only visible on sm+ (pointing right toward eagle) */}
          <div
            className="hidden sm:block absolute -right-[10px] bottom-8 w-0 h-0"
            style={{
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderLeft: '10px solid rgba(0,212,255,0.35)',
            }}
          />
          <div
            className="hidden sm:block absolute -right-[8px] bottom-[33px] w-0 h-0"
            style={{
              borderTop: '9px solid transparent',
              borderBottom: '9px solid transparent',
              borderLeft: '9px solid rgba(5,14,26,0.97)',
            }}
          />

          {/* Text */}
          <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-5">
            {lines.map((line, i) => (
              <p
                key={i}
                className="text-xs sm:text-sm leading-relaxed sm:leading-relaxed transition-opacity duration-300"
                style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)', opacity: isClosing ? 0.5 : 1 }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Button */}
          <button
            onClick={dismiss}
            className="w-full text-[11px] sm:text-xs font-black tracking-widest py-2 sm:py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg,#0043BB,#00D4FF)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(0,212,255,0.35)',
              opacity: isClosing ? 0.5 : 1,
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(30px);
          }
        }
      `}</style>
    </div>
  )
}
