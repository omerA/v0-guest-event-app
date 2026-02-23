import { NextResponse } from "next/server"
import { verifyOTP, createSession, hasGuestResponded } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 })
    }

    const digits = phone.replace(/\D/g, "")
    const isValid = verifyOTP(digits, code)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })
    }

    const sessionId = createSession(digits)
    const alreadyResponded = hasGuestResponded(digits)

    const response = NextResponse.json({
      success: true,
      alreadyResponded,
    })

    // Set session cookie
    response.cookies.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
