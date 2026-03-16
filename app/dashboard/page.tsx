'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/src/components/ui/Button'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [atlanticCheckpoint, setAtlanticCheckpoint] = useState(0)
  const [xpTotal, setXpTotal] = useState(0)
  const [coinsBalance, setCoinsBalance] = useState(0)

  useEffect(() => {
    fetch('/api/progress/2')
      .then(r => r.ok ? r.json() : { checkpoint: 0 })
      .then(d => setAtlanticCheckpoint(d.checkpoint ?? 0))
      .catch(() => {})
    fetch('/api/user/stats')
      .then(r => r.ok ? r.json() : { xp_total: 0, coins_balance: 0 })
      .then(d => {
        setXpTotal(d.xp_total ?? 0)
        setCoinsBalance(d.coins_balance ?? 0)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/logo.png" 
              alt="WOA Talk Logo" 
              width={60} 
              height={60}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WOA Talk</h1>
              <p className="text-sm text-gray-600">Sua Jornada Épica no Inglês</p>
            </div>
          </div>
          <Button
            onClick={() => signOut({ redirect: true }) as any}
            className="text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Sair
          </Button>
        </div>
      </header>

      {/* Stats Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Seu Progresso</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {/* XP */}
            <div className="bg-white border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all">
              <p className="text-sm font-semibold text-blue-600 mb-2">XP TOTAL</p>
              <p className="text-4xl font-bold text-blue-600">{xpTotal.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-600 mt-2">Próximo nível em {Math.max(0, 250 - (xpTotal % 250))} XP</p>
            </div>

            {/* Streaks */}
            <div className="bg-white border-2 border-orange-200 rounded-lg p-6 hover:shadow-lg transition-all">
              <p className="text-sm font-semibold text-orange-600 mb-2">STREAK (DIAS)</p>
              <p className="text-4xl font-bold text-orange-600">0</p>
              <p className="text-xs text-gray-600 mt-2">Mantenha a consistência!</p>
            </div>

            {/* Badges */}
            <div className="bg-white border-2 border-purple-200 rounded-lg p-6 hover:shadow-lg transition-all">
              <p className="text-sm font-semibold text-purple-600 mb-2">BADGES</p>
              <p className="text-4xl font-bold text-purple-600">0</p>
              <p className="text-xs text-gray-600 mt-2">Conquistas desbloqueadas</p>
            </div>

            {/* WOA Coins */}
            <div className="bg-white border-2 border-yellow-200 rounded-lg p-6 hover:shadow-lg transition-all flex items-center gap-0">
              {/* Left half */}
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-sm font-semibold text-yellow-600 mb-2">WOA COINS</p>
                <p className="text-4xl font-bold text-yellow-600">{coinsBalance}</p>
                <p className="text-xs text-gray-600 mt-2">Ganhe 1 coin a cada checkpoint</p>
              </div>
              {/* Right half */}
              <div className="flex-1 flex items-center justify-center">
                <Image src="/images/woa_coin.png" alt="WOA Coin" width={72} height={72} className="object-contain drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-blue-50 to-orange-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Bem-vindo, {session?.user?.name}!
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Você está pronto para começar sua jornada épica pelas profundezas do oceano até a superfície, aprendendo inglês através de desafios viciantes e gamificados.
              </p>
              <Link
                href="/journey"
                className="inline-block text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all hover:opacity-90"
                style={{ backgroundColor: '#0043BB' }}
              >
                Iniciar Jornada Épica
              </Link>
            </div>
            <div className="text-6xl text-center animate-bounce">🌊</div>
          </div>
        </div>
      </section>

      {/* Lessons Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Lições Recentes</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Lesson Card - Pacific Ocean — BLOQUEADO */}
            <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden opacity-60">
              <div className="h-32 bg-gradient-to-r from-gray-400 to-gray-300 flex items-center justify-center">
                <Image src="/images/icon_pacifico.png" alt="Pacific Ocean" width={80} height={80} className="object-contain" />
              </div>
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-2">Pacific Ocean</h4>
                <p className="text-sm text-gray-600 mb-4">4.280m de profundidade</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full" style={{ width: '0%', backgroundColor: '#d1d5db' }}></div>
                </div>
                <p className="text-xs text-gray-600 mb-4">Bloqueado</p>
                <button disabled className="w-full text-gray-500 font-semibold px-4 py-2 rounded-lg bg-gray-100 cursor-not-allowed">
                  Bloqueado
                </button>
              </div>
            </div>

            {/* Lesson Card - Atlantic Ocean — ATUAL */}
            <div className="bg-white border-2 border-blue-600 rounded-lg overflow-hidden hover:shadow-lg transition-all ring-2 ring-blue-300">
              <div className="h-32 bg-gradient-to-r from-blue-800 to-blue-600 flex items-center justify-center">
                <Image src="/images/icon_atlantico.png" alt="Atlantic Ocean" width={80} height={80} className="object-contain" />
              </div>
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-1">Atlantic Ocean</h4>
                <p className="text-sm text-gray-600 mb-1">3.339m de profundidade</p>

                {/* Checkpoint & depth info */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: '#0043BB' }}>
                    Checkpoint {atlanticCheckpoint}/10
                  </span>
                  <span className="text-xs text-gray-500">
                    🌊 {Math.round(3339 * (1 - atlanticCheckpoint / 10))}m
                  </span>
                </div>

                {/* Segmented 10-part progress bar */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex-1 h-2 bg-gray-200 rounded-sm overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: i < atlanticCheckpoint ? '100%' : '0%',
                          backgroundColor: '#0043BB',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-600 mb-4">Fase Atual</p>
                <Link
                  href="/challenge/2"
                  className="block text-center text-white font-semibold px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#CC4A00' }}
                >
                  Continuar
                </Link>
              </div>
            </div>

            {/* Lesson Card - Indian Ocean — BLOQUEADO */}
            <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden opacity-60">
              <div className="h-32 bg-gradient-to-r from-gray-400 to-gray-300 flex items-center justify-center">
                <Image src="/images/icon_indico.png" alt="Indian Ocean" width={80} height={80} className="object-contain" />
              </div>
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-2">Indian Ocean</h4>
                <p className="text-sm text-gray-600 mb-4">3.970m de profundidade</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full" style={{ width: '0%', backgroundColor: '#d1d5db' }}></div>
                </div>
                <p className="text-xs text-gray-600 mb-4">Bloqueado</p>
                <button disabled className="w-full text-gray-500 font-semibold px-4 py-2 rounded-lg bg-gray-100 cursor-not-allowed">
                  Bloqueado
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Method Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Método WOA</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <p className="text-4xl mb-3">📚</p>
              <h4 className="font-bold text-gray-900 mb-2">Discover</h4>
              <p className="text-gray-600 text-sm">Explore conceitos e ouça exemplos reais para criar curiosidade e compreensão inicial.</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
              <p className="text-4xl mb-3">⚡</p>
              <h4 className="font-bold text-gray-900 mb-2">Practice</h4>
              <p className="text-gray-600 text-sm">Pratique através de diversos tipos de exercícios: arrastar, completar, escutar e falar.</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <p className="text-4xl mb-3">👑</p>
              <h4 className="font-bold text-gray-900 mb-2">Command</h4>
              <p className="text-gray-600 text-sm">Domine o conteúdo com desafios avançados e aplique em contextos reais.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Bem-vindo de volta!</h3>
          <p className="text-lg mb-6 opacity-90">
            Continuar sua jornada e desbloquear novos oceanos e desafios
          </p>
          <Link
            href="/journey"
            className="inline-block text-white font-semibold px-8 py-4 rounded-lg text-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          >
            Ir ao Mapa da Jornada →
          </Link>
        </div>
      </section>
    </main>
  )
}
