import Link from "next/link"
import { CalendarDays, MapPin, Clock, Users } from "lucide-react"

interface EventDetailsProps {
  eventId: string
  eventName: string
  eventDate: string
  eventLocation: string
  eventDescription: string
  fontClass: string
}

export function EventDetails({
  eventId,
  eventName,
  eventDate,
  eventLocation,
  eventDescription,
  fontClass,
}: EventDetailsProps) {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center bg-[#0f0f13] px-6 py-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm tracking-[0.25em] font-medium text-white/40 uppercase">
            Event Details
          </p>
          <h2
            className={`text-3xl font-semibold tracking-tight text-white sm:text-5xl text-balance ${fontClass}`}
          >
            Everything You Need to Know
          </h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
          <DetailCard
            icon={<CalendarDays className="h-6 w-6" />}
            title="Date"
            value={eventDate}
          />
          <DetailCard
            icon={<MapPin className="h-6 w-6" />}
            title="Venue"
            value={eventLocation}
          />
          <DetailCard
            icon={<Clock className="h-6 w-6" />}
            title="Time"
            value="7:00 PM onwards"
          />
          <DetailCard
            icon={<Users className="h-6 w-6" />}
            title="Dress Code"
            value="Semi-formal"
          />
        </div>

        <p className="max-w-lg text-base leading-relaxed text-white/50 text-pretty">
          {eventDescription}
        </p>

        <Link
          href={`/event/${eventId}/rsvp`}
          className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-10 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/30"
        >
          Reserve Your Spot
        </Link>
      </div>
    </section>
  )
}

function DetailCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 backdrop-blur-sm">
      <div className="text-white/40">{icon}</div>
      <p className="text-xs tracking-[0.2em] font-medium text-white/35 uppercase">{title}</p>
      <p className="text-lg font-medium text-white/90">{value}</p>
    </div>
  )
}
