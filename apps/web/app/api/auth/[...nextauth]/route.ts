import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { cmsDb } from "@/lib/cms-db"
import { gameDb } from "@/lib/game-db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Metin2 Account",
      credentials: {
        username: { label: "Accountname", type: "text" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        // gameDb is read-only.
        const accounts = await gameDb.$queryRaw<any[]>`
          SELECT id, login, password 
          FROM account 
          WHERE login = ${credentials.username}
          LIMIT 1
        `

        const account = accounts[0]
        if (!account) {
          throw new Error("Account nicht gefunden")
        }

        // Note: Real Metin2 uses MySQL PASSWORD() function. 
        // Here we fallback to simple check or bcrypt if CMS hashed it.
        let isValid = false
        if (account.password.startsWith('$2a$') || account.password.startsWith('$2b$')) {
            isValid = await bcrypt.compare(credentials.password, account.password)
        } else {
            isValid = account.password === credentials.password
        }

        if (!isValid) {
          throw new Error("Falsches Passwort")
        }

        // Sync user to CMS DB if missing
        let cmsUser = await cmsDb.user.findUnique({
          where: { accountId: account.id }
        })

        if (!cmsUser) {
          cmsUser = await cmsDb.user.create({
            data: {
              accountId: account.id,
              email: `${account.login}@localhost`, // Mock email
              name: account.login,
              password: account.password,
              role: "USER"
            }
          })
        }

        return {
          id: cmsUser.id,
          name: cmsUser.name,
          email: cmsUser.email,
          role: cmsUser.role,
          accountId: account.id
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
    signIn: "/login"
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
