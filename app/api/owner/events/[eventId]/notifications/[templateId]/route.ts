import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireEventOwnership } from "@/lib/owner-auth"
import { enqueueNotificationJobs } from "@/lib/jobs"

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  channel: z.enum(["sms", "email"]).optional(),
  type: z.enum(["blast", "reminder"]).optional(),
  subject: z.string().nullable().optional(),
  body: z.string().min(1).optional(),
  daysBeforeEvent: z.number().int().min(1).max(90).nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; templateId: string }> }
) {
  try {
    const { eventId, templateId } = await params
    await requireEventOwnership(eventId)

    const template = await db.notificationTemplate.findFirst({
      where: { id: templateId, eventId },
      include: {
        scheduledJobs: {
          select: { status: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Compute status counts
    const statusCounts = template.scheduledJobs.reduce<Record<string, number>>(
      (acc, job) => {
        acc[job.status] = (acc[job.status] ?? 0) + 1
        return acc
      },
      {}
    )

    const { scheduledJobs: _, ...rest } = template
    void _
    return NextResponse.json({ template: { ...rest, statusCounts } })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; templateId: string }> }
) {
  try {
    const { eventId, templateId } = await params
    await requireEventOwnership(eventId)

    const existing = await db.notificationTemplate.findFirst({
      where: { id: templateId, eventId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const daysChanged =
      data.daysBeforeEvent !== undefined &&
      data.daysBeforeEvent !== existing.daysBeforeEvent

    const template = await db.notificationTemplate.update({
      where: { id: templateId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.daysBeforeEvent !== undefined && {
          daysBeforeEvent: data.daysBeforeEvent,
        }),
      },
    })

    if (daysChanged) {
      // Cancel existing pending jobs
      await db.scheduledNotificationJob.deleteMany({
        where: { templateId, status: "pending" },
      })
      // Re-enqueue
      await enqueueNotificationJobs(templateId)
    }

    return NextResponse.json({ template })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; templateId: string }> }
) {
  try {
    const { eventId, templateId } = await params
    await requireEventOwnership(eventId)

    const existing = await db.notificationTemplate.findFirst({
      where: { id: templateId, eventId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await db.notificationTemplate.delete({ where: { id: templateId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
