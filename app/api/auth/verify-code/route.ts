import { NextResponse } from "next/server"
import { verifyOTP, createSession, hasGuestResponded, getEventConfig } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const { phone, code, eventId } = await request.json()

    if (!phone || !code || !eventId) {
      return NextResponse.json({ error: "Phone, code, and eventId are required" }, { status: 400 })
    }

    if (!getEventConfig(eventId)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    const digits = phone.replace(/\D/g, "")
    const isValid = verifyOTP(digits, code)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })
    }

    const sessionId = createSession(eventId, digits)
    const alreadyResponded = hasGuestResponded(eventId, digits)

    return NextResponse.json({
      success: true,
      alreadyResponded,
      sessionId,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
