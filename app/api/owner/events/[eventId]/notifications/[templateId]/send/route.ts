import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireEventOwnership } from "@/lib/owner-auth"
import { enqueueNotificationJobs } from "@/lib/jobs"

export async function POST(
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

    const jobsEnqueued = await enqueueNotificationJobs(templateId)

    await db.notificationTemplate.update({
      where: { id: templateId },
      data: { sentAt: new Date() },
    })

    return NextResponse.json({ jobsEnqueued })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
