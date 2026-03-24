'use client'

import { useEffect, useState } from 'react'

const RESTORE_MS = 8 * 60 * 60 * 1000

interface EnergyBarProps {
  /** Controlled mode: pass current charges (0-3) directly */
  charges?: number
  /** Controlled mode: pass slot timestamps to show countdown */
  slots?: (string | null)[]
  /** Increment to trigger a re-fetch in uncontrolled mode */
  refreshKey?: number
}

function timeUntilRestore(slotTs: string): string {
  const restoreAt = new Date(slotTs).getTime() + RESTORE_MS
  const diff = Math.max(0, restoreAt - Date.now())
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function EnergyBar({ charges: externalCharges, slots: externalSlots, refreshKey = 0 }: EnergyBarProps) {
  const [charges, setCharges] = useState<number>(externalCharges ?? 3)
  const [slots, setSlots] = useState<(string | null)[]>(externalSlots ?? [null, null, null])
  const [tick, setTick] = useState(0)

  // Controlled mode: sync from props
  useEffect(() => {
    if (externalCharges !== undefined) setCharges(externalCharges)
    if (externalSlots !== undefined) setSlots(externalSlots)
  }, [externalCharges, externalSlots])

  // Uncontrolled mode: fetch from API
  useEffect(() => {
    if (externalCharges !== undefined) return
    fetch('/api/user/energy')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setCharges(d.charges ?? 3)
        setSlots(d.slots ?? [null, null, null])
      })
      .catch(() => {})
  }, [externalCharges, refreshKey])

  // Tick every minute to update countdown labels
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void tick

  return (
    <div className="flex items-center gap-1.5" title={`${charges}/3 cargas de energia`}>
      {slots.map((slot, i) => {
        const isFull = slot === null
        const countdown = !isFull && slot ? timeUntilRestore(slot) : null
        return (
          <div key={i} className="relative group flex-shrink-0">
            {/* Icon */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isFull
                  ? 'rgba(255,160,0,0.2)'
                  : 'rgba(255,255,255,0.05)',
                border: isFull
                  ? '1.5px solid rgba(255,160,0,0.6)'
                  : '1.5px solid rgba(255,255,255,0.15)',
                boxShadow: isFull ? '0 0 8px rgba(255,160,0,0.3)' : 'none',
              }}
            >
              <span className="text-xs leading-none select-none">
                {isFull ? '⚡' : '🩶'}
              </span>
            </div>

            {/* Countdown tooltip */}
            {countdown && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded text-[9px] font-black tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                style={{
                  background: 'rgba(5,14,26,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {countdown}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
