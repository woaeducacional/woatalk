'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/src/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-950 to-blue-900">
        <p className="text-blue-300">Carregando...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900">
      <header className="border-b border-blue-700 bg-blue-950 bg-opacity-50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-100">🌊 WOA Talk</h1>
          <Button
            onClick={() => signOut({ redirect: true }) as any}
            variant="outline"
          >
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Bem-vindo, {session?.user?.name}!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-300 mb-4">
              Você está autenticado e pronto para começar sua jornada épica.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-900">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-blue-400 text-sm mb-2">XP Total</p>
                    <p className="text-3xl font-bold text-blue-100">0</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-900">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-orange-400 text-sm mb-2">WOA Coins</p>
                    <p className="text-3xl font-bold text-orange-100">0</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-900">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-blue-400 text-sm mb-2">Fase Atual</p>
                    <p className="text-3xl font-bold text-blue-100">1</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🌊 Oceano Pacífico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-300">
              Você está nas profundezas do oceano. Comece a explorar a primeira fase e aprenda inglês através de uma jornada épica.
            </p>
            <Button className="mt-4" variant="secondary">Começar Jornada</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
