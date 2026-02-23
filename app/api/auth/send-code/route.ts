import { NextResponse } from "next/server"
import { generateOTP } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Strip non-digit characters for validation
    const digits = phone.replace(/\D/g, "")
    if (digits.length < 7 || digits.length > 15) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    const code = generateOTP(digits)

    // In production, send via SMS provider (Twilio, etc.)
    // For demo, we return the code so the UI can display it
    console.log(`[OTP] Code for ${digits}: ${code}`)

    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      // Remove this in production - only for demo
      _demo_code: code,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
