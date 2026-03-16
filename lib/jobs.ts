import { PgBoss } from "pg-boss"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"

// ─── Singleton PgBoss instance ────────────────────────────────────────────────

const globalForBoss = globalThis as unknown as { pgBoss: PgBoss | undefined }

export const boss: PgBoss =
  globalForBoss.pgBoss ??
  new PgBoss(process.env.DATABASE_URL!)

if (process.env.NODE_ENV !== "production") {
  globalForBoss.pgBoss = boss
}

// ─── Template variable rendering ─────────────────────────────────────────────

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ─── Job handler ─────────────────────────────────────────────────────────────

const QUEUE_NAME = "send-notification"

export async function startWorker(): Promise<void> {
  await boss.start()

  await boss.work<{ jobId: string }>(QUEUE_NAME, async (jobs: Array<{ data: { jobId: string } }>) => {
    for (const job of jobs) {
      const { jobId } = job.data
      await processNotificationJob(jobId)
    }
  })
}

async function processNotificationJob(jobId: string): Promise<void> {
  const notifJob = await db.scheduledNotificationJob.findUnique({
    where: { id: jobId },
    include: {
      template: {
        include: {
          event: {
            include: {
              owner: true,
            },
          },
        },
      },
    },
  })

  if (!notifJob) {
    console.error(`[jobs] ScheduledNotificationJob not found: ${jobId}`)
    return
  }

  if (notifJob.status === "sent") {
    return
  }

  try {
    const { template } = notifJob
    const { event } = template

    // Resolve recipient name
    let guestName = "Guest"
    if (notifJob.guestId) {
      const guest = await db.guest.findUnique({ where: { id: notifJob.guestId } })
      if (guest) guestName = guest.name
    } else if (notifJob.inviteeId) {
      const invitee = await db.invitee.findUnique({ where: { id: notifJob.inviteeId } })
      if (invitee) guestName = invitee.name
    }

    // Build template vars
    const ownerSlug = event.owner?.ownerSlug ?? ""
    const eventSlug = event.slug ?? event.id
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const eventUrl = `${appUrl}/e/${ownerSlug}/${eventSlug}`

    const vars: Record<string, string> = {
      guest_name: guestName,
      event_name: event.name,
      event_date: event.date,
      event_url: eventUrl,
      rsvp_url: eventUrl,
    }

    const renderedBody = renderTemplate(template.body, vars)

    if (template.channel === "sms") {
      await sendSMS({ to: notifJob.recipient, body: renderedBody })
    } else {
      const renderedSubject = template.subject
        ? renderTemplate(template.subject, vars)
        : event.name
      await sendEmail({
        to: notifJob.recipient,
        subject: renderedSubject,
        html: renderedBody,
      })
    }

    await db.scheduledNotificationJob.update({
      where: { id: jobId },
      data: { status: "sent", sentAt: new Date() },
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await db.scheduledNotificationJob.update({
      where: { id: jobId },
      data: { status: "failed", error },
    })
  }
}

// ─── Enqueue notification jobs ────────────────────────────────────────────────

export async function enqueueNotificationJobs(templateId: string): Promise<number> {
  const template = await db.notificationTemplate.findUnique({
    where: { id: templateId },
    include: {
      event: {
        include: {
          guests: true,
          invitees: true,
        },
      },
    },
  })

  if (!template) throw new Error(`Template not found: ${templateId}`)

  const { event } = template

  // Determine scheduled time
  let scheduledAt = new Date()
  if (template.type === "reminder" && template.daysBeforeEvent != null) {
    // Parse event date (stored as string in schema)
    const eventDate = new Date(event.date)
    if (!isNaN(eventDate.getTime())) {
      scheduledAt = new Date(eventDate)
      scheduledAt.setDate(scheduledAt.getDate() - template.daysBeforeEvent)
      // If the scheduled time is in the past, send now
      if (scheduledAt < new Date()) {
        scheduledAt = new Date()
      }
    }
  }

  // Build recipient list — channel determines which field to use
  const isEmail = template.channel === "email"

  const recipientEntries: Array<{
    recipient: string
    guestId?: string
    inviteeId?: string
  }> = []

  // From guests (RSVP'd)
  for (const guest of event.guests) {
    const recipient = isEmail ? null : guest.phone
    if (recipient) {
      recipientEntries.push({ recipient, guestId: guest.id })
    }
  }

  // From invitees
  for (const invitee of event.invitees) {
    const recipient = isEmail ? invitee.email : invitee.phone
    if (recipient) {
      recipientEntries.push({ recipient, inviteeId: invitee.id })
    }
  }

  // Deduplicate by recipient address
  const seen = new Set<string>()
  const unique = recipientEntries.filter(({ recipient }) => {
    if (seen.has(recipient)) return false
    seen.add(recipient)
    return true
  })

  if (unique.length === 0) return 0

  // Create ScheduledNotificationJob rows
  const createdJobs = await Promise.all(
    unique.map(({ recipient, guestId, inviteeId }) =>
      db.scheduledNotificationJob.create({
        data: {
          templateId,
          recipient,
          guestId: guestId ?? null,
          inviteeId: inviteeId ?? null,
          status: "pending",
          scheduledAt,
        },
      })
    )
  )

  // Enqueue each in pg-boss
  const secondsUntil = Math.max(0, Math.floor((scheduledAt.getTime() - Date.now()) / 1000))

  await Promise.all(
    createdJobs.map((job) =>
      boss.send(
        QUEUE_NAME,
        { jobId: job.id },
        secondsUntil > 0 ? { startAfter: secondsUntil } : {}
      )
    )
  )

  return createdJobs.length
}
