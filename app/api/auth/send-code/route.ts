import { NextResponse } from "next/server"
import { getEventConfig } from "@/lib/store"
import { sendOTP } from "@/lib/otp"

export async function POST(request: Request) {
  try {
    const { phone, eventId } = await request.json()

    if (!eventId || !(await getEventConfig(eventId))) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const digits = phone.replace(/\D/g, "")
    if (digits.length < 7 || digits.length > 15) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    await sendOTP(digits)

    return NextResponse.json({ success: true, message: "Verification code sent" })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
