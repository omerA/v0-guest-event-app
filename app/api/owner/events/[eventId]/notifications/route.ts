import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireEventOwnership } from "@/lib/owner-auth"
import { enqueueNotificationJobs } from "@/lib/jobs"

const createTemplateSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(["sms", "email"]),
  type: z.enum(["blast", "reminder"]),
  subject: z.string().optional(),
  body: z.string().min(1),
  daysBeforeEvent: z.number().int().min(1).max(90).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    await requireEventOwnership(eventId)

    const templates = await db.notificationTemplate.findMany({
      where: { eventId },
      include: {
        _count: { select: { scheduledJobs: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ templates })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const session = await requireEventOwnership(eventId)

    const body = await req.json()
    const parsed = createTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const template = await db.notificationTemplate.create({
      data: {
        eventId,
        ownerId: session.userId,
        name: data.name,
        channel: data.channel,
        type: data.type,
        subject: data.subject ?? null,
        body: data.body,
        daysBeforeEvent: data.daysBeforeEvent ?? null,
      },
    })

    if (data.type === "reminder") {
      await enqueueNotificationJobs(template.id)
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
