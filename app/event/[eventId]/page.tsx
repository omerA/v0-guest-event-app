import { notFound } from "next/navigation"
import { getEventConfig } from "@/lib/store"
import { getFontClass } from "@/lib/fonts"
import { VideoHero } from "@/components/video-hero"
import { EventDetails } from "@/components/event-details"

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const config = await getEventConfig(eventId)
  if (!config) return { title: "Event Not Found" }
  return {
    title: config.name,
    description: config.description,
  }
}

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const config = await getEventConfig(eventId)
  if (!config) notFound()

  const fontClass = getFontClass(config.fontFamily)

  return (
    <main>
      <VideoHero
        eventId={config.id}
        eventName={config.name}
        eventNameTranslations={config.nameTranslations}
        eventDate={config.date}
        eventLocation={config.location}
        eventLocationTranslations={config.locationTranslations}
        eventDescription={config.description}
        eventDescriptionTranslations={config.descriptionTranslations}
        mediaUrl={config.heroMediaUrl}
        mediaType={config.heroMediaType}
        fontClass={fontClass}
      />
      <EventDetails
        eventId={config.id}
        eventName={config.name}
        eventDate={config.date}
        eventLocation={config.location}
        eventLocationTranslations={config.locationTranslations}
        eventDescription={config.description}
        eventDescriptionTranslations={config.descriptionTranslations}
        fontClass={fontClass}
      />
    </main>
  )
}
