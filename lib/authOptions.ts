import Credentials from 'next-auth/providers/credentials'
import { signInSchema } from '@/lib/validation'
import { apiService } from '@/lib/api.service'
import type { NextAuthOptions } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id?: string
    role?: string
  }
  interface Session {
    user: User & {
      id?: string
      role?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials)
          const user = await apiService.validateCredentials(email, password)
          if (!user) return null
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
            role: user.role ?? 'user',
          }
        } catch {
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
