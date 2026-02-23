import { NextResponse } from "next/server"
import { generateOTP, getEventConfig } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const { phone, eventId } = await request.json()

    if (!eventId || !getEventConfig(eventId)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const digits = phone.replace(/\D/g, "")
    if (digits.length < 7 || digits.length > 15) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    const code = generateOTP(digits)
    console.log(`[OTP] Code for ${digits}: ${code}`)

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      _demo_code: code,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
