import { db } from "@/lib/db"
import { requireEventOwnership } from "@/lib/owner-auth"
import { NotificationsClient } from "./notifications-client"

interface PageProps {
  params: Promise<{ eventId: string }>
}

export default async function NotificationsPage({ params }: PageProps) {
  const { eventId } = await params
  await requireEventOwnership(eventId)

  const [templates, event] = await Promise.all([
    db.notificationTemplate.findMany({
      where: { eventId },
      include: {
        _count: { select: { scheduledJobs: true } },
        scheduledJobs: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        date: true,
        _count: { select: { guests: true, invitees: true } },
      },
    }),
  ])

  if (!event) {
    return <div className="p-8 text-center text-muted-foreground">Event not found.</div>
  }

  const templatesWithCounts = templates.map((t) => {
    const statusCounts = t.scheduledJobs.reduce<Record<string, number>>((acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1
      return acc
    }, {})
    const { scheduledJobs: _, ...rest } = t
    void _
    return { ...rest, statusCounts }
  })

  return (
    <NotificationsClient
      eventId={eventId}
      eventName={event.name}
      recipientCount={event._count.guests + event._count.invitees}
      initialTemplates={templatesWithCounts}
    />
  )
}
