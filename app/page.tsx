'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/logo.png" 
              alt="WOA Talk Logo" 
              width={60} 
              height={60}
              className="rounded-lg"
            />
            <h1 className="text-2xl font-bold text-gray-900">WOA Talk</h1>
          </div>
          <div className="flex gap-4 items-center">
            <Link 
              href="/auth/signin"
              className="text-gray-700 font-medium hover:text-primary-600 transition px-4 py-2"
            >
              Entrar
            </Link>
            <Link 
              href="/auth/signup"
              className="text-white px-6 py-2 rounded-lg font-medium transition hover:opacity-90"
              style={{ backgroundColor: '#CC4A00' }}
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side */}
            <div className="space-y-8">
              <div>
                <h2 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                  Sua Jornada Épica no <span className="text-secondary-600">Inglês</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Aprenda inglês através de uma aventura imersiva pelas profundezas do oceano até a superfície.
                  Uma experiência gamificada, interativa e viciante.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Gamificado</h3>
                    <p className="text-gray-600">XP, Streaks, Badges e WOA Coins para manter sua motivação</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-secondary-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Método WOA</h3>
                    <p className="text-gray-600">Descubra, pratique e domine o inglês em 3 passos</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Comunidade</h3>
                    <p className="text-gray-600">Conecte-se com outros aprendizes ao redor do mundo</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-secondary-600 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Progressão</h3>
                    <p className="text-gray-600">20 fases oceânicas que evoluem com seu aprendizado</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  href="/auth/signup"
                  className="text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center shadow-md hover:opacity-90"
                  style={{ backgroundColor: '#0043BB' }}
                >
                  Iniciar Jornada Épica
                </Link>
                <Link 
                  href="/auth/signin"
                  className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all text-center"
                >
                  Já tenho Conta
                </Link>
              </div>
            </div>

            {/* Right side - Visual */}
            <div className="hidden md:flex justify-center">
              <div className="relative w-full max-w-md space-y-6">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8 border border-primary-200">
                  <h4 className="font-bold text-primary-900 text-lg mb-3">
                    Foco
                  </h4>
                  <p className="text-primary-700">
                    Dicas personalizadas baseadas em seu estilo de aprendizado
                  </p>
                </div>
                <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-8 border border-secondary-200 ml-8">
                  <h4 className="font-bold text-secondary-900 text-lg mb-3">
                    Velocidade
                  </h4>
                  <p className="text-secondary-700">
                    Avanço acelerado com desafios diários e recompensas
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-300">
                  <h4 className="font-bold text-gray-900 text-lg mb-3">
                    Flexibilidade
                  </h4>
                  <p className="text-gray-700">
                    Aprenda no seu ritmo, quando e onde quiser
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary-50 border-t border-b border-primary-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary-600">20</p>
              <p className="text-gray-700 mt-2 font-medium">Fases Oceânicas</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-secondary-600">100+</p>
              <p className="text-gray-700 mt-2 font-medium">Desafios</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-primary-600">Gratuito</p>
              <p className="text-gray-700 mt-2 font-medium">Para Todos</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-secondary-600">24/7</p>
              <p className="text-gray-700 mt-2 font-medium">Acesso Total</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>WOA Talk © 2026 - Sua Jornada Épica no Inglês</p>
        </div>
      </footer>
    </main>
  )
}