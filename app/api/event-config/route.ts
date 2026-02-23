import { NextResponse } from "next/server"
import { getEventConfig, updateEventConfig } from "@/lib/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("eventId")
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

  const config = getEventConfig(eventId)
  if (!config) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  return NextResponse.json(config)
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

    const updates = await request.json()
    const updated = updateEventConfig(eventId, updates)
    if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
