import { getEventConfig } from "@/lib/store"
import { getFontClass } from "@/lib/fonts"
import { RsvpFlow } from "@/components/rsvp-flow"

export const metadata = {
  title: "RSVP",
  description: "Confirm your attendance and preferences",
}

export default function RsvpPage() {
  const config = getEventConfig()
  const fontClass = getFontClass(config.fontFamily)

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <RsvpFlow
        pages={config.pages}
        fontClass={fontClass}
        eventName={config.name}
      />
    </main>
  )
}
