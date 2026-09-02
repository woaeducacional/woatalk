'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function BottomNav() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [lastPhaseId, setLastPhaseId] = useState<number | null>(null)
  const [phaseResolved, setPhaseResolved] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    fetch('/api/activity-progress/last-phase')
      .then((response) => (response.ok ? response.json() : { phaseId: null }))
      .then((data) => {
        if (cancelled) return

        if (typeof data?.phaseId === 'number' && data.phaseId > 0) {
          setLastPhaseId(data.phaseId)
        }

        setPhaseResolved(true)
      })
      .catch(() => {
        if (!cancelled) setPhaseResolved(true)
      })

    return () => {
      cancelled = true
    }
  }, [status])

  const lastJourneyPath = lastPhaseId
    ? `/challenge/${lastPhaseId}`
    : phaseResolved
      ? '/challenge/1'
      : '/dashboard'

  const navItems = useMemo(
    () => [
      { label: 'Início', href: '/dashboard', icon: '🏠' },
      { label: 'Jornada', href: lastJourneyPath, icon: '🗺️' },
      { label: 'Missões', href: '/dashboard#fases', icon: '⚔️' },
      { label: 'Comunidade', href: '/community', icon: '👥' },
      { label: 'Loja', href: '/premium', icon: '🛒' },
      { label: 'Perfil', href: '/profile', icon: '👤' },
    ],
    [lastJourneyPath]
  )

  if (!session) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around px-1 py-2 border-t"
      style={{
        background: 'rgba(5,14,26,0.97)',
        borderColor: 'rgba(0,212,255,0.15)',
        backdropFilter: 'blur(16px)',
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
      }}
    >
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.label === 'Jornada' && pathname.startsWith('/challenge')) ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all active:scale-90"
            style={{ minWidth: 44 }}
          >
            <span
              className="text-xl leading-none"
              style={{ filter: active ? 'drop-shadow(0 0 6px #00D4FF)' : 'none' }}
            >
              {item.icon}
            </span>
            <span
              className="text-[9px] font-bold tracking-wide"
              style={{ color: active ? '#00D4FF' : 'rgba(255,255,255,0.35)' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
