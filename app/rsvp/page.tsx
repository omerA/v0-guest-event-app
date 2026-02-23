import { redirect } from "next/navigation"
import { getAllEvents } from "@/lib/store"

export default function LegacyRsvpPage() {
  const events = getAllEvents()

  if (events.length > 0) {
    redirect(`/event/${events[0].id}/rsvp`)
  }

  redirect("/admin")
}
