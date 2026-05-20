'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { use } from 'react'
import { useChatMessages } from '@/src/hooks/useChatMessages'
import { ChatMessageList } from '@/src/components/community/ChatMessageList'
import { ChatMessageInput } from '@/src/components/community/ChatMessageInput'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default function ChatGroupPage({ params }: PageProps) {
  const { groupId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { group, messages, loading, sending, error, sendMessage } = useChatMessages(groupId)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    fetch('/api/user/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setCurrentUserId(d.id) })
      .catch(() => {})
  }, [])

  if (status === 'loading' || loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error && !group) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#050E1A' }}>
        <p className="text-red-400 text-sm">{error}</p>
        <Link href="/community" className="text-xs text-cyan-400 underline">← Voltar</Link>
      </div>
    )
  }

  const groupColor = group?.color ?? '#00D4FF'

  return (
    <main className="h-screen flex flex-col relative overflow-hidden" style={{ background: '#050E1A' }}>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image src="/images/fundo_do_mar.png" alt="" fill className="object-cover object-bottom" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.95) 0%, rgba(5,14,26,0.82) 40%, rgba(5,14,26,0.95) 100%)' }} />
      </div>

      {/* Header */}
      <header
        className="relative z-10 shrink-0 flex items-center gap-4 px-5 py-4"
        style={{ background: 'rgba(5,14,26,0.90)', borderBottom: `1px solid ${groupColor}30` }}
      >
        <Link
          href="/community"
          className="text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg transition-all hover:scale-105 shrink-0"
          style={{ border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF', background: 'rgba(0,212,255,0.08)' }}
        >
          ← COMUNIDADE
        </Link>

        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl leading-none shrink-0">{group?.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-widest truncate" style={{ color: groupColor }}>
              {group?.name?.toUpperCase()}
            </p>
            <p className="text-[10px] text-white/30 tracking-wide truncate">{group?.description}</p>
          </div>
        </div>
      </header>

      {/* Message list — white card, 80% width */}
      <div className="relative z-10 flex-1 flex flex-col items-center min-h-0 py-4 px-4">
        <div className="w-4/5 flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'white' }}>
          <ChatMessageList messages={messages} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Input — 80% width, sticks to bottom */}
      <div className="relative z-10 flex justify-center px-4 pb-4">
        <div className="w-4/5">
          <ChatMessageInput
            onSend={sendMessage}
            sending={sending}
            groupColor={groupColor}
          />
        </div>
      </div>
    </main>
  )
}
