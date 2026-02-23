import { notFound } from "next/navigation"
import { getEventConfig } from "@/lib/store"
import { getFontClass } from "@/lib/fonts"
import { RsvpFlow } from "@/components/rsvp-flow"

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const config = getEventConfig(eventId)
  if (!config) return { title: "Event Not Found" }
  return {
    title: `RSVP - ${config.name}`,
    description: `Confirm your attendance for ${config.name}`,
  }
}

export default async function RsvpPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const config = getEventConfig(eventId)
  if (!config) notFound()

  const fontClass = getFontClass(config.fontFamily)

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <RsvpFlow
        eventId={config.id}
        pages={config.pages}
        fontClass={fontClass}
        eventName={config.name}
        eventDate={config.date}
        eventLocation={config.location}
        eventDescription={config.description}
      />
    </main>
  )
}
