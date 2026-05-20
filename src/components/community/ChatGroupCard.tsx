import type { ChatGroup } from '@/src/services/chat.service'
import Link from 'next/link'

interface ChatGroupCardProps {
  group: ChatGroup
}

export function ChatGroupCard({ group }: ChatGroupCardProps) {
  return (
    <Link href={`/community/chat/${group.id}`} className="block h-full">
      <div
        className="h-full rounded-2xl p-5 flex flex-col gap-2 cursor-pointer transition-all hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]"
        style={{
          background: 'rgba(5,14,26,0.80)',
          border: `1px solid ${group.color}40`,
          boxShadow: `0 0 18px ${group.color}18`,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{group.emoji}</span>
          <span
            className="text-sm font-black tracking-widest uppercase"
            style={{ color: group.color }}
          >
            {group.name}
          </span>
        </div>
        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
          {group.description}
        </p>
      </div>
    </Link>
  )
}
