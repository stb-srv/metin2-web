import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { cmsDb } from "@/lib/cms-db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Metin2 Account",
      credentials: {
        identifier: { label: "Benutzername oder E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Benutzername/E-Mail und Passwort sind erforderlich")
        }

        const identifier = credentials.identifier.trim()

        // Suche via E-Mail ODER Benutzername (name)
        const user = await cmsDb.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { name: identifier }
            ]
          }
        })

        if (!user) {
          throw new Error("Ungültiger Benutzername/E-Mail oder Passwort")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error("Ungültiger Benutzername/E-Mail oder Passwort")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role,
          accountId: user.accountId || 0
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accountId = user.accountId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.accountId = token.accountId as number
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
}
