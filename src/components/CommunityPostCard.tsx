'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { UserNameLink } from './UserNameLink'

type PostType = 'badge_earned' | 'streak_milestone' | 'journey_completed' | 'block_completed' | 'xp_milestone'

const COMMENT_PHRASES: Record<string, string> = {
  congrats:   'Congratulations! 🎉',
  amazing:    'Amazing work! Keep it up!',
  onfire:     "You're on fire! Keep going! 🔥",
  inspiring:  "You're an inspiration! ⭐",
}
const COMMENT_KEYS = Object.keys(COMMENT_PHRASES)

const POST_CONFIG: Record<PostType, { icon: string; color: string; label: string }> = {
  badge_earned:       { icon: '🏅', color: '#A855F7', label: 'BADGE' },
  streak_milestone:   { icon: '🔥', color: '#FF6B35', label: 'STREAK' },
  journey_completed:  { icon: '🌊', color: '#00D4FF', label: 'JORNADA' },
  block_completed:    { icon: '✅', color: '#22c55e', label: 'BLOCO' },
  xp_milestone:       { icon: '⚡', color: '#FFD700', label: 'XP' },
}

function formatPayload(type: PostType, payload: Record<string, unknown>): string {
  switch (type) {
    case 'badge_earned':      return `Conquistou o badge "${payload.badge}"!`
    case 'streak_milestone':  return `Atingiu ${payload.streak} dias de streak!`
    case 'journey_completed': return `Completou a Jornada ${payload.phaseId}!`
    case 'block_completed':   return `Completou o Bloco ${(payload.missionGroupId as number) + 1} da Jornada ${payload.phaseId}!`
    case 'xp_milestone':      return `Alcançou ${Number(payload.xp).toLocaleString('pt-BR')} XP!`
    default: return ''
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

interface CommunityPost {
  id: string
  post_type: PostType
  payload: Record<string, unknown>
  created_at: string
  users: { id: string; name: string }
  reactions: { reaction: string; user_id: string }[]
  comments: { phrase: string; user_id: string; user_name?: string }[]
}

interface Props {
  post: CommunityPost
  onDelete?: (id: string) => void
  currentUserId?: string
}

export function CommunityPostCard({ post, onDelete, currentUserId }: Props) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const config = POST_CONFIG[post.post_type]

  const [reactions, setReactions] = useState(post.reactions)
  const [comments, setComments] = useState(post.comments)
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  // ── heart reaction ──
  const heartCount = reactions.length
  const hasHeart = reactions.some(r => r.user_id === currentUserId)

  const toggleHeart = async () => {
    if (!currentUserId || loading) return
    setLoading(true)
    try {
      if (hasHeart) {
        await fetch(`/api/community/posts/${post.id}/react?reaction=heart`, { method: 'DELETE' })
        setReactions(prev => prev.filter(r => r.user_id !== currentUserId))
      } else {
        await fetch(`/api/community/posts/${post.id}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction: 'heart' }),
        })
        setReactions(prev => [...prev, { reaction: 'heart', user_id: currentUserId }])
      }
    } catch { }
    setLoading(false)
  }

  // ── phrase comments ──
  const userPhrases = new Set(comments.filter(c => c.user_id === currentUserId).map(c => c.phrase))

  const selectPhrase = async (key: string) => {
    if (!currentUserId || loading) return
    setPickerOpen(false)
    setLoading(true)
    const hasIt = userPhrases.has(key)
    try {
      if (hasIt) {
        await fetch(`/api/community/posts/${post.id}/comment?phrase=${key}`, { method: 'DELETE' })
        setComments(prev => prev.filter(c => !(c.user_id === currentUserId && c.phrase === key)))
      } else {
        await fetch(`/api/community/posts/${post.id}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phrase: key }),
        })
        const userName = session?.user?.name ?? undefined
        setComments(prev => [...prev, { phrase: key, user_id: currentUserId, user_name: userName }])
      }
    } catch { }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Excluir este post?')) return
    await fetch(`/api/community/posts/${post.id}`, { method: 'DELETE' })
    onDelete?.(post.id)
  }

  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-md relative transition-all hover:scale-[1.01]"
      style={{
        background: 'rgba(5,14,26,0.70)',
        border: `1px solid ${config.color}35`,
        boxShadow: `0 4px 24px ${config.color}10`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: `${config.color}20`, border: `1px solid ${config.color}50` }}
          >
            {config.icon}
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-wide">
              <UserNameLink
                userId={post.users?.id ?? ''}
                name={post.users?.name ?? 'Jogador'}
                className="text-white"
              />
            </p>
            <p className="text-[11px] tracking-widest" style={{ color: `${config.color}90` }}>
              {config.label} • {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors px-2 py-1 rounded"
          >
            ✕
          </button>
        )}
      </div>

      {/* Body */}
      <p className="text-base text-blue-100/90 mb-4" style={{ textShadow: `0 0 8px ${config.color}20` }}>
        {formatPayload(post.post_type, post.payload)}
      </p>

      {/* Heart + comment button row */}
      <div className="flex items-center gap-2 mb-3" ref={pickerRef}>
        {/* Heart */}
        <button
          onClick={toggleHeart}
          disabled={loading || !currentUserId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all hover:scale-110"
          style={{
            background: hasHeart ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hasHeart ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <span>❤️</span>
          {heartCount > 0 && <span className="text-xs font-bold text-white/80">{heartCount}</span>}
        </button>

        {/* Add comment toggle */}
        {currentUserId && (
          <div className="relative">
            <button
              onClick={() => setPickerOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: pickerOpen ? `${config.color}18` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${pickerOpen ? config.color + '60' : 'rgba(255,255,255,0.1)'}`,
                color: pickerOpen ? config.color : 'rgba(255,255,255,0.5)',
              }}
            >
              <span>💬</span>
              <span>{comments.length > 0 ? comments.length : 'Comentar'}</span>
            </button>

            {/* Phrase picker dropdown */}
            {pickerOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-60 rounded-xl overflow-hidden z-20 shadow-2xl"
                style={{ background: 'rgba(8,20,38,0.97)', border: `1px solid ${config.color}40` }}
              >
                {COMMENT_KEYS.map(key => {
                  const active = userPhrases.has(key)
                  return (
                    <button
                      key={key}
                      onClick={() => selectPhrase(key)}
                      className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/5 flex items-center justify-between"
                      style={{
                        color: active ? config.color : 'rgba(255,255,255,0.7)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <span className={active ? 'font-bold' : ''}>{COMMENT_PHRASES[key]}</span>
                      {active && <span className="text-[11px] ml-2 opacity-70">✓ remover</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing comments list */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {comments.map((c, i) => {
            const firstName = (c.user_name ?? 'Alguém').split(' ').slice(0, 2).join(' ')
            const isOwn = c.user_id === currentUserId
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                style={{ background: isOwn ? `${config.color}12` : 'rgba(255,255,255,0.03)' }}
              >
                <span className="font-bold" style={{ color: isOwn ? config.color : 'rgba(255,255,255,0.55)' }}>
                  {firstName}
                </span>
                <span className="text-white/40">·</span>
                <span style={{ color: isOwn ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)' }}>
                  {COMMENT_PHRASES[c.phrase]}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

