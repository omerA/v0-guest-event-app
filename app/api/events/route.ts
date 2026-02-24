import { NextResponse } from "next/server"
import { getAllEvents, createEvent, deleteEvent } from "@/lib/store"

export async function GET() {
  const events = await getAllEvents()
  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      location: e.location,
      createdAt: e.createdAt,
    })),
  })
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Event name is required (min 2 chars)" }, { status: 400 })
    }
    const event = await createEvent(name.trim())
    return NextResponse.json({ event }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }
    const ok = await deleteEvent(eventId)
    if (!ok) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
