import twilio from "twilio"

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function sendSMS(opts: {
  to: string // E.164 format, e.g. "+15551234567"
  body: string
}): Promise<void> {
  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: opts.to,
    body: opts.body,
  })
}
