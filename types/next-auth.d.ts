import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      ownerSlug: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    ownerSlug?: string | null
    role?: string
    passwordHash?: string | null
  }
}
