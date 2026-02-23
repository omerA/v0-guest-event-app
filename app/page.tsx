import { getEventConfig } from "@/lib/store"
import { getFontClass } from "@/lib/fonts"
import { VideoHero } from "@/components/video-hero"
import { EventDetails } from "@/components/event-details"

export default function HomePage() {
  const config = getEventConfig()
  const fontClass = getFontClass(config.fontFamily)

  return (
    <main>
      <VideoHero
        eventName={config.name}
        eventDate={config.date}
        eventLocation={config.location}
        eventDescription={config.description}
        videoUrl={config.heroVideoUrl}
        fontClass={fontClass}
      />
      <EventDetails
        eventName={config.name}
        eventDate={config.date}
        eventLocation={config.location}
        eventDescription={config.description}
        fontClass={fontClass}
      />
    </main>
  )
}
