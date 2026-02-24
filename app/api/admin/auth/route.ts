import { NextResponse } from "next/server"
import { timingSafeEqual, createHmac } from "crypto"

function generateAdminToken(secret: string): string {
  return createHmac("sha256", secret).update("admin").digest("base64url")
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const adminPassword = process.env.ADMIN_PASSWORD
    const secret = process.env.SESSION_SECRET

    if (!adminPassword || !secret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 503 })
    }

    // Timing-safe comparison to prevent timing attacks
    const providedBuf = Buffer.from(password)
    const expectedBuf = Buffer.from(adminPassword)
    const passwordsMatch = providedBuf.length === expectedBuf.length && timingSafeEqual(providedBuf, expectedBuf)

    if (!passwordsMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    const token = generateAdminToken(secret)

    const response = NextResponse.json({ success: true })
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return response
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return response
}
