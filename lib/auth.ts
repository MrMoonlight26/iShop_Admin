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
      async authorize(credentials, req) {
        // If the backend already set HttpOnly cookies (ACCESS_TOKEN), accept that as authenticated in dev mode.
        try {
          const cookieHeader = (req && (req as any).headers && (req as any).headers.cookie) || ''
          if (cookieHeader && /(?:^|;\s*)ACCESS_TOKEN=/.test(cookieHeader)) {
            return { id: 'cookie-user', email: 'admin@example.com', name: 'Admin', role: 'admin' }
          }
        } catch (e) {}

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
      if (session?.user && token) {
        const t: any = token as any
        const u: any = session.user as any
        u.role = t.role
        u.id = t.sub
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
  return await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
}
