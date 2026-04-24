'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CommunityPostCard } from '@/src/components/CommunityPostCard'
import { UserNameLink } from '@/src/components/UserNameLink'
import { playClick } from '@/lib/sounds'

interface CommunityPost {
  id: string
  post_type: 'badge_earned' | 'streak_milestone' | 'journey_completed' | 'block_completed' | 'xp_milestone'
  payload: Record<string, unknown>
  created_at: string
  users: { id: string; name: string }
  reactions: { reaction: string; user_id: string }[]
  comments: { phrase: string; user_id: string; user_name?: string }[]
}

interface RankUser {
  id: string
  name: string
  xp_total?: number
  streak_count?: number
}

type MobileTab = 'posts' | 'xp' | 'streak'

function RankingCard({
  title,
  icon,
  color,
  users,
  valueKey,
  suffix,
}: {
  title: string
  icon: string
  color: string
  users: RankUser[]
  valueKey: 'xp_total' | 'streak_count'
  suffix: string
}) {
  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-md sticky top-6"
      style={{ background: 'rgba(5,14,26,0.80)', border: `1px solid ${color}30` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-black tracking-widest" style={{ color }}>{title}</p>
          <p className="text-xs text-white/30 tracking-widest">TOP 10</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {users.length === 0 && (
          <p className="text-sm text-white/30 text-center py-4">Sem dados</p>
        )}
        {users.map((u, i) => {
          const val = u[valueKey] ?? 0
          const medals = ['🥇', '🥈', '🥉']
          const medal = medals[i] ?? null
          return (
            <div key={u.id} className="flex items-center gap-2">
              <span className="text-sm w-6 text-center font-black" style={{ color: i < 3 ? color : 'rgba(255,255,255,0.3)' }}>
                {medal ?? `${i + 1}`}
              </span>
              <div
                className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: i === 0 ? `${color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? color + '30' : 'rgba(255,255,255,0.05)'}` }}
              >
                <span className="text-sm font-semibold text-white/80 truncate max-w-[155px]">
                  <UserNameLink
                    userId={u.id}
                    name={u.name}
                    className="text-white/80 hover:text-cyan-300"
                  />
                </span>
                <span className="text-sm font-black shrink-0" style={{ color }}>
                  {valueKey === 'xp_total' ? Number(val).toLocaleString('pt-BR') : val}{suffix}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [userId, setUserId] = useState<string | undefined>()
  const [xpRanking, setXpRanking] = useState<RankUser[]>([])
  const [streakRanking, setStreakRanking] = useState<RankUser[]>([])
  const [mobileTab, setMobileTab] = useState<MobileTab>('posts')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    fetch('/api/user/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setUserId(d.id) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/community/rankings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setXpRanking(d.xpRanking ?? [])
          setStreakRanking(d.streakRanking ?? [])
        }
      })
      .catch(() => {})
  }, [])

  const loadPosts = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/feed?page=${p}&limit=20`)
      const data = await res.json()
      const newPosts = data.posts ?? []
      if (p === 1) setPosts(newPosts)
      else setPosts(prev => [...prev, ...newPosts])
      setHasMore(newPosts.length === 20)
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { loadPosts(1) }, [loadPosts])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadPosts(next)
  }

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    )
  }

  const feedContent = (
    <div className="space-y-4">
      {posts.map(post => (
        <CommunityPostCard
          key={post.id}
          post={post}
          onDelete={handleDelete}
          currentUserId={userId}
        />
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🌊</p>
          <p className="text-sm text-blue-200/50">Nenhuma conquista ainda. Complete missões para aparecer aqui!</p>
        </div>
      )}

      {!loading && hasMore && posts.length > 0 && (
        <button
          onClick={loadMore}
          className="w-full py-3 rounded-xl text-xs font-black tracking-widest transition-all hover:scale-[1.02]"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}
        >
          CARREGAR MAIS
        </button>
      )}
    </div>
  )

  return (
    <main className="min-h-screen relative" style={{ background: '#050E1A' }}>
      <div className="fixed inset-0 z-0">
        <Image src="/images/fundo_do_mar.png" alt="" fill className="object-cover object-bottom" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.92) 0%, rgba(5,14,26,0.75) 40%, rgba(5,14,26,0.90) 100%)' }} />
      </div>

      <div className="relative z-10 px-4 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-wider" style={{ textShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
              🌊 COMUNIDADE
            </h1>
            <p className="text-[10px] text-cyan-400/50 tracking-widest mt-1">CONQUISTAS DOS EXPLORADORES</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => playClick()}
            className="text-[10px] font-black tracking-widest px-4 py-2 rounded transition-all hover:scale-105"
            style={{ border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF', background: 'rgba(0,212,255,0.08)' }}
          >
            ← DASHBOARD
          </Link>
        </div>

        {/* ── MOBILE: tabs ── */}
        <div className="lg:hidden">
          <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5,14,26,0.6)' }}>
            {([
              { key: 'posts', label: '🌊 Posts' },
              { key: 'xp', label: '⚡ Top XP Semanal' },
              { key: 'streak', label: '🔥 Top Streak' },
            ] as { key: MobileTab; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                className="flex-1 py-2.5 text-xs font-black tracking-wide transition-all"
                style={{
                  background: mobileTab === tab.key ? 'rgba(0,212,255,0.15)' : 'transparent',
                  color: mobileTab === tab.key ? '#00D4FF' : 'rgba(255,255,255,0.4)',
                  borderBottom: mobileTab === tab.key ? '2px solid #00D4FF' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mobileTab === 'posts' && feedContent}
          {mobileTab === 'xp' && (
            <RankingCard title="TOP XP SEMANAL" icon="⚡" color="#FFD700" users={xpRanking} valueKey="xp_total" suffix=" XP" />
          )}
          {mobileTab === 'streak' && (
            <RankingCard title="TOP STREAK" icon="🔥" color="#FF6B35" users={streakRanking} valueKey="streak_count" suffix="d" />
          )}
        </div>

        {/* ── DESKTOP: 3-column ── */}
        <div className="hidden lg:grid lg:grid-cols-[310px_1fr_310px] gap-6">
          {/* Left: XP ranking */}
          <div>
            <RankingCard title="TOP XP SEMANAL" icon="⚡" color="#FFD700" users={xpRanking} valueKey="xp_total" suffix=" XP" />
          </div>

          {/* Center: feed */}
          <div className="min-w-0">
            {feedContent}
          </div>

          {/* Right: Streak ranking */}
          <div>
            <RankingCard title="TOP STREAK" icon="🔥" color="#FF6B35" users={streakRanking} valueKey="streak_count" suffix="d" />
          </div>
        </div>
      </div>
    </main>
  )
}
