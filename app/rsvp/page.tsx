import { redirect } from "next/navigation"
import { getAllEvents } from "@/lib/store"

export const dynamic = "force-dynamic"

export default async function LegacyRsvpPage() {
  const events = await getAllEvents()

  if (events.length > 0) {
    redirect(`/event/${events[0].id}/rsvp`)
  }

  redirect("/admin")
}
