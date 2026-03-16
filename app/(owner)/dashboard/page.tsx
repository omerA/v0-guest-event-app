import Link from "next/link"
import { getOwnerSession } from "@/lib/owner-auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, MapPin, Users } from "lucide-react"
import { formatEventDateShort } from "@/lib/date-utils"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getOwnerSession()
  if (!session) redirect("/login")

  const events = await db.event.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { guests: true } } },
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Events</h1>
          <p className="text-sm text-muted-foreground">Manage your events and collect RSVPs</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No events yet</p>
              <p className="text-sm text-muted-foreground">Create your first event to start collecting RSVPs</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/events/new" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{event.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {event.date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatEventDateShort(event.date)}</span>
                    </div>
                  )}
                  {event.location && event.location !== "TBD" && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {event._count.guests} {event._count.guests === 1 ? "response" : "responses"}
                    </span>
                  </div>
                  <CardDescription className="mt-1 font-mono text-[10px]">/event/{event.id}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
