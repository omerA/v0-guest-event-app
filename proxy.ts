import { NextRequest, NextResponse } from "next/server"

const encoder = new TextEncoder()

/** Edge-safe base64url from ArrayBuffer (no Buffer dependency) */
function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

async function computeAdminToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ])
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("admin"))
  return toBase64Url(signature)
}

async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  try {
    const expected = await computeAdminToken(secret)
    // Constant-time string comparison
    if (token.length !== expected.length) return false
    let result = 0
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return result === 0
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the login page and auth API through unconditionally
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next()
  }

  const secret = process.env.SESSION_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 503 })
  }

  const token = request.cookies.get("admin_token")?.value

  if (!token || !(await verifyAdminToken(token, secret))) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
