import { PrismaClient } from "@prisma/client"

// Prevent multiple Prisma client instances in development (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

// Prisma interactive transaction client type (omits top-level lifecycle methods)
export type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
