import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

function generateAdminToken(secret: string): string {
  return createHmac("sha256", secret).update("admin").digest("base64url")
}

/**
 * Throws "UNAUTHORIZED" or "SERVER_MISCONFIGURATION" if the request does not
 * carry a valid admin_token cookie. Suitable for use in both API routes and
 * Uploadthing middleware.
 */
export async function verifyAdmin(): Promise<void> {
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
