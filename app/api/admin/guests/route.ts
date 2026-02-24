import { NextResponse } from "next/server"
import { getAllGuests, getEventConfig } from "@/lib/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId")
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

  const config = await getEventConfig(eventId)
  if (!config) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const guests = await getAllGuests(eventId)
  return NextResponse.json({
    guests,
    pages: config.pages,
    fontFamily: config.fontFamily,
  })
}
