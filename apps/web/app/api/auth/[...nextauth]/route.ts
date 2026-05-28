import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { cmsDb } from '@/lib/cms-db'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await cmsDb.user.findFirst({
          where: { email: credentials.email },
        })

        if (!user) return null

        const passwordValid = await bcrypt.compare(credentials.password, user.password)
        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          accountId: user.accountId ?? 0,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.accountId = user.accountId
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role as string
      session.user.accountId = token.accountId as number
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
