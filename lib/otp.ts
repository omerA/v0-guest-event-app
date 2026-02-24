import { createHash, randomInt } from "crypto"
import twilio from "twilio"
import { db } from "./db"

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required")
  }
  return twilio(accountSid, authToken)
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

export async function sendOTP(phone: string, eventId: string): Promise<void> {
  const code = String(randomInt(100000, 1000000))
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Invalidate any prior unused codes for this phone + event
  await db.otpCode.updateMany({
    where: { phone, eventId, used: false },
    data: { used: true },
  })

  await db.otpCode.create({
    data: { phone, eventId, codeHash, expiresAt },
  })

  const from = process.env.TWILIO_PHONE_NUMBER
  if (!from) throw new Error("TWILIO_PHONE_NUMBER environment variable is required")

  await getTwilioClient().messages.create({
    body: `Your verification code is ${code}. It expires in 5 minutes.`,
    from,
    to: `+${phone}`,
  })
}

export async function verifyOTP(phone: string, eventId: string, code: string): Promise<boolean> {
  const codeHash = hashCode(code)

  const record = await db.otpCode.findFirst({
    where: {
      phone,
      eventId,
      codeHash,
      used: false,
      expiresAt: { gt: new Date() },
    },
  })

  if (!record) return false

  await db.otpCode.update({
    where: { id: record.id },
    data: { used: true },
  })

  return true
}
