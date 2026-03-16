'use client'

import { SessionProvider } from "next-auth/react"
import PageTransition from "@/src/components/PageTransition"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PageTransition />
      {children}
    </SessionProvider>
  )
}
