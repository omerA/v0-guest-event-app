import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "events@example.com",
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })
}
