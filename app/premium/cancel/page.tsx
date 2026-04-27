'use client'

import { useRouter } from 'next/navigation'
import { playClick } from '@/lib/sounds'

export default function PremiumCancelPage() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #050E1A 0%, #0a1929 50%, #050E1A 100%)' }}
    >
      <div className="text-center space-y-6 px-6 max-w-lg">
        <div className="text-8xl">😕</div>
        <h1 className="text-4xl font-black text-white">Pagamento cancelado</h1>
        <p className="text-blue-200/70 text-lg">
          Sem problema! Você pode ativar o Premium quando quiser.
        </p>
        <button
          onClick={() => { playClick(); router.push('/premium') }}
          className="px-8 py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', color: 'white' }}
        >
          VOLTAR AOS PLANOS
        </button>
      </div>
    </div>
  )
}
