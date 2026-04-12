import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { signInSchema } from '@/lib/validation'
import { getUserByEmail } from '@/lib/db'
import { comparePasswords } from '@/lib/password'

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

export const { handlers, signIn, signOut, auth } = NextAuth({
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

          const user = await getUserByEmail(email)
          if (!user || !user.password_hash) {
            return null
          }

          const passwordMatch = await comparePasswords(password, user.password_hash)
          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
          }
        } catch (error) {
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
