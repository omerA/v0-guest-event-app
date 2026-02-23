import { redirect } from "next/navigation"
import { getAllEvents } from "@/lib/store"

export default function HomePage() {
  const events = getAllEvents()

  if (events.length > 0) {
    redirect(`/event/${events[0].id}`)
  }

  // No events exist - redirect to admin to create one
  redirect("/admin")
}
