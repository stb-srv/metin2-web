import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { cmsDb } from "@/lib/cms-db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Metin2 Account",
      credentials: {
        email: { label: "E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("E-Mail und Passwort sind erforderlich")
        }

        // 1. Suche User in cmsDb.user (WHERE email = credentials.email)
        const user = await cmsDb.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error("Ungültige E-Mail-Adresse oder Passwort")
        }

        // 2. Prüfe bcrypt.compare(credentials.password, user.password)
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error("Ungültige E-Mail-Adresse oder Passwort")
        }

        // 3. Gib { id, email, name, role, accountId } zurück
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
    // JWT Callback: accountId + role in Token schreiben
    async jwt({ token, user }) {
      if (user) {
        token.accountId = user.accountId
        token.role = user.role
      }
      return token
    },
    // Session Callback: accountId + role aus Token in session.user schreiben
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
