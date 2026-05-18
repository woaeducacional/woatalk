'use client'

import { useState, useRef } from 'react'

interface ChatMessageInputProps {
  onSend: (content: string) => Promise<void>
  sending: boolean
  groupColor: string
}

export function ChatMessageInput({ onSend, sending, groupColor }: ChatMessageInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setText('')
    await onSend(trimmed)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const remaining = 500 - text.length
  const isOverLimit = remaining < 0

  return (
    <div
      className="shrink-0 px-4 py-3 flex gap-3 items-end"
      style={{ background: 'rgba(5,14,26,0.92)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva sua mensagem... (Enter para enviar)"
          rows={1}
          maxLength={520}
          className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${isOverLimit ? '#FF6B6B' : 'rgba(255,255,255,0.12)'}`,
            color: 'rgba(255,255,255,0.85)',
            minHeight: 44,
            maxHeight: 120,
          }}
        />
        {text.length > 400 && (
          <span
            className="absolute bottom-2 right-3 text-[10px] font-bold"
            style={{ color: isOverLimit ? '#FF6B6B' : 'rgba(255,255,255,0.3)' }}
          >
            {remaining}
          </span>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={!text.trim() || sending || isOverLimit}
        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: `${groupColor}25`, border: `1px solid ${groupColor}50` }}
      >
        {sending ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        ) : (
          '➤'
        )}
      </button>
    </div>
  )
}
