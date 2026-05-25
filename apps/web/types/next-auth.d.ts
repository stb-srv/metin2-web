import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      accountId: number
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    accountId: number
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: number
    role: string
  }
}
