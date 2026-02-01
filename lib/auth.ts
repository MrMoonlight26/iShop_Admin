import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'
import bcrypt from 'bcrypt'
import { getToken } from 'next-auth/jwt'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // TODO: Replace with real backend API call
        // Dummy user for dev only
        if (
          credentials.email === 'admin@example.com' &&
          credentials.password === 'admin123'
        ) {
          return { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' }
        }
        return null
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as { role?: string }).role = (token as { role?: string }).role
        (session.user as { id?: string }).id = (token as { sub?: string }).sub
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  secret: process.env.NEXTAUTH_SECRET
}

export async function getReqToken(req: Request) {
  return await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
}
