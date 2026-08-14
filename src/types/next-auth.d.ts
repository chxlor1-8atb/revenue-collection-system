import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
      collectorId: number | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    collectorId?: number | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    collectorId: number | null
  }
}
