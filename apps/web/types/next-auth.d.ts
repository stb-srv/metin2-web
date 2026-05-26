import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      accountId: number
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    accountId: number
  }

  interface JWT {
    role: string
    accountId: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    accountId: number
  }
}

declare module "bcryptjs" {
  export function hash(s: string, salt: number | string): Promise<string>;
  export function hashSync(s: string, salt: number | string): string;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function compareSync(s: string, hash: string): boolean;
  export function genSalt(rounds?: number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
}
