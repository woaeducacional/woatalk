import { SessionProvider } from 'next-auth/react'
import '@/app/globals.css'

export const metadata = {
  title: 'WOA Talk',
  description: 'Aprenda inglês em uma jornada épica',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
