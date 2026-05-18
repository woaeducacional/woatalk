import { ChatGroupCard } from './ChatGroupCard'
import type { ChatGroup } from '@/src/services/chat.service'

const GROUPS: ChatGroup[] = [
  { id: 'viagens',     name: 'Viagens',     emoji: '✈️',  color: '#00D4FF', description: 'Fale sobre destinos, dicas e experiências de viagem' },
  { id: 'trabalho',    name: 'Trabalho',    emoji: '💼',  color: '#FFD700', description: 'Conversas sobre carreira e profissão em inglês' },
  { id: 'cotidiano',   name: 'Cotidiano',   emoji: '☀️',  color: '#00FF88', description: 'O dia a dia em inglês' },
  { id: 'english_tips',name: 'English Tips',emoji: '📚',  color: '#FF6B9D', description: 'Dicas para aprender inglês mais rápido' },
]

export function ChatGroupGrid() {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <p className="text-sm font-black tracking-widest text-white/80">💬 GRUPOS DE CONVERSAÇÃO</p>
        <p className="text-[10px] text-cyan-400/40 tracking-widest mt-0.5">ESCOLHA UM TEMA E PRATIQUE COM A COMUNIDADE</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {GROUPS.map(group => (
          <ChatGroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  )
}
