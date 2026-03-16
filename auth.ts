import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google,
    GitHub,
    MicrosoftEntraId,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize({ email, password }) {
        const user = await db.user.findUnique({ where: { email: String(email) } })
        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(String(password), user.passwordHash)
        return valid ? user : null
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      session.user.ownerSlug = (user as any).ownerSlug
      session.user.role = (user as any).role
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Generate ownerSlug for OAuth sign-ups (credentials flow sets it at signup)
      if (!(user as any).ownerSlug) {
        const base = user
          .email!.split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
        let slug = base
        let i = 1
        while (await db.user.findUnique({ where: { ownerSlug: slug } })) {
          slug = `${base}-${i++}`
        }
        await db.user.update({ where: { id: user.id }, data: { ownerSlug: slug } })
      }
    },
  },
  pages: { signIn: "/login" },
})
