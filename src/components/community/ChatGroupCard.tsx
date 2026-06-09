'use client'

import { useState } from 'react'
import type { ChatGroup } from '@/src/services/chat.service'
import Link from 'next/link'
import { TopicPracticeDialog } from './TopicPracticeDialog'

interface ChatGroupCardProps {
  group: ChatGroup
}

export function ChatGroupCard({ group }: ChatGroupCardProps) {
  const [showTutor, setShowTutor] = useState(false)

  return (
    <>
      <div
        className="relative h-full rounded-2xl p-5 flex flex-col gap-2 transition-all hover:scale-[1.02] hover:brightness-110"
        style={{
          background: 'rgba(5,14,26,0.80)',
          border: `1px solid ${group.color}40`,
          boxShadow: `0 0 18px ${group.color}18`,
        }}
      >
        {/* ── Área clicável principal → chat da comunidade ── */}
        <Link href={`/community/chat/${group.id}`} className="flex flex-col gap-2 flex-1">
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
        </Link>

        {/* ── Botão do Tutor de Pronúncia (coruja) ── */}
        <button
          onClick={() => setShowTutor(true)}
          className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl self-start transition-all hover:scale-105 active:scale-95"
          style={{
            background: `${group.color}15`,
            border: `1px solid ${group.color}35`,
          }}
          title="Praticar pronúncia com a Coruja Tutora"
        >
          <img
            src="/images/aguia-corretora.png"
            alt="Tutor"
            className="w-4 h-4 object-contain"
            style={{ filter: `drop-shadow(0 0 4px ${group.color})` }}
          />
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: group.color }}>
            Tutor
          </span>
        </button>
      </div>

      {/* ── Modal de prática ── */}
      {showTutor && (
        <TopicPracticeDialog
          group={group}
          onClose={() => setShowTutor(false)}
        />
      )}
    </>
  )
}
