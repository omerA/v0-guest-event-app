import twilio from "twilio"

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required")
  }
  return twilio(accountSid, authToken)
}

function getVerifyServiceSid(): string {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID
  if (!serviceSid) throw new Error("TWILIO_VERIFY_SERVICE_SID environment variable is required")
  return serviceSid
}

export async function sendOTP(phone: string): Promise<void> {
  await getTwilioClient()
    .verify.v2.services(getVerifyServiceSid())
    .verifications.create({ to: `+${phone}`, channel: "sms" })
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const check = await getTwilioClient()
    .verify.v2.services(getVerifyServiceSid())
    .verificationChecks.create({ to: `+${phone}`, code })

  return check.status === "approved"
}
