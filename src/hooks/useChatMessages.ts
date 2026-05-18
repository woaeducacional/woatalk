'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChatMessage, ChatGroup } from '@/src/services/chat.service'

interface UseChatMessagesReturn {
  group: ChatGroup | null
  messages: ChatMessage[]
  loading: boolean
  sending: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
}

export function useChatMessages(groupId: string): UseChatMessagesReturn {
  const [group, setGroup] = useState<ChatGroup | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/chat/${groupId}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao carregar mensagens')
        return
      }
      const data = await res.json()
      setGroup(data.group)
      setMessages(data.messages)
    } catch {
      setError('Erro de conexão')
    }
  }, [groupId])

  useEffect(() => {
    setLoading(true)
    loadMessages().finally(() => setLoading(false))

    // Poll for new messages every 5 seconds
    intervalRef.current = setInterval(loadMessages, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadMessages])

  const sendMessage = useCallback(async (content: string) => {
    setSending(true)
    try {
      const res = await fetch(`/api/community/chat/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao enviar mensagem')
        return
      }
      // Reload messages right away after sending
      await loadMessages()
    } catch {
      setError('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }, [groupId, loadMessages])

  return { group, messages, loading, sending, error, sendMessage }
}
