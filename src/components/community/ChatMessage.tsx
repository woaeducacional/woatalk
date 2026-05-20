import Image from 'next/image'
import type { ChatMessage as ChatMessageType } from '@/src/services/chat.service'

interface ChatMessageProps {
  message: ChatMessageType
  isOwn: boolean
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const initials = message.user_name.slice(0, 2).toUpperCase()

  return (
    <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-black" style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
        {message.user_avatar ? (
          <Image src={message.user_avatar} alt={message.user_name} width={32} height={32} className="object-cover w-full h-full" />
        ) : (
          initials
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] font-semibold mb-1" style={{ color: 'rgba(0,0,0,0.45)' }}>
          {isOwn ? 'Você' : message.user_name}
        </span>
        <div
          className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
          style={
            isOwn
              ? { background: 'rgba(0,180,220,0.18)', border: '1px solid rgba(0,180,220,0.35)', color: '#005F7A', borderBottomRightRadius: 4 }
              : { background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.80)', borderBottomLeftRadius: 4 }
          }
        >
          {message.content}
        </div>
        <span className="text-[10px] mt-1" style={{ color: 'rgba(0,0,0,0.30)' }}>
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}
