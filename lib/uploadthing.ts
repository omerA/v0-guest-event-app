import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

function generateAdminToken(secret: string): string {
  return createHmac("sha256", secret).update("admin").digest("base64url")
}

async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SERVER_MISCONFIGURATION")
  if (!token) throw new Error("UNAUTHORIZED")
  const expected = generateAdminToken(secret)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("UNAUTHORIZED")
}

export const ourFileRouter = {
  heroImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      await verifyAdmin()
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  heroVideo: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async () => {
      await verifyAdmin()
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  pageBackground: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      await verifyAdmin()
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
