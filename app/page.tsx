import { redirect } from "next/navigation"
import { getAllEvents } from "@/lib/store"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const events = await getAllEvents()

  if (events.length > 0) {
    redirect(`/event/${events[0].id}`)
  }

  // No events exist - redirect to admin to create one
  redirect("/admin")
}
