import { NextResponse } from "next/server"
import { verifyOTP, createSession, hasGuestResponded } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 })
    }

    const digits = phone.replace(/\D/g, "")
    console.log("[v0] verify-code: phone=", phone, "digits=", digits, "code=", code, "type=", typeof code)
    const isValid = verifyOTP(digits, code)
    console.log("[v0] verify-code: isValid=", isValid)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })
    }

    const sessionId = createSession(digits)
    const alreadyResponded = hasGuestResponded(digits)

    return NextResponse.json({
      success: true,
      alreadyResponded,
      sessionId,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
