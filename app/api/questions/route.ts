import { NextResponse } from "next/server"
import { getEventConfig } from "@/lib/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId")
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

  const config = await getEventConfig(eventId)
  if (!config) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  return NextResponse.json({
    event: {
      name: config.name,
      date: config.date,
      location: config.location,
      description: config.description,
      heroMediaUrl: config.heroMediaUrl,
      heroMediaType: config.heroMediaType,
      fontFamily: config.fontFamily,
    },
    pages: config.pages,
  })
}
