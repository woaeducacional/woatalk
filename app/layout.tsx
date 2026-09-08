import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Providers } from './providers'
import { BottomNav } from '@/src/components/BottomNav'
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
          <BottomNav />
        </Providers>
      </body>

      <GoogleAnalytics gaId="G-R61NM6CLNH" />
    </html>
  )
}
