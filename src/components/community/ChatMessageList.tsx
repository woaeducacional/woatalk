'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatDateDivider } from './ChatDateDivider'
import type { ChatMessage as ChatMessageType } from '@/src/services/chat.service'

interface ChatMessageListProps {
  messages: ChatMessageType[]
  currentUserId: string | null
}

function toDateKey(isoString: string): string {
  return isoString.slice(0, 10) // 'YYYY-MM-DD'
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ChatMessageList({ messages, currentUserId }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-50">
        <span className="text-4xl">💬</span>
        <p className="text-sm text-white/40">Seja o primeiro a mandar uma mensagem!</p>
      </div>
    )
  }

  const items: JSX.Element[] = []
  let lastDateKey = ''

  for (const msg of messages) {
    const dateKey = toDateKey(msg.created_at)
    if (dateKey !== lastDateKey) {
      items.push(<ChatDateDivider key={`divider-${dateKey}`} date={formatDate(msg.created_at)} />)
      lastDateKey = dateKey
    }
    items.push(
      <ChatMessage
        key={msg.id}
        message={msg}
        isOwn={msg.user_id === currentUserId}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {items}
      <div ref={bottomRef} />
    </div>
  )
}
