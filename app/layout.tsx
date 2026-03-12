import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'WOA Talk - Aprenda inglês em uma jornada épica',
  description: 'Aprenda inglês em uma jornada épica',
  icons: {
    icon: '/images/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
