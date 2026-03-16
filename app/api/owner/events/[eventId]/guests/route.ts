import { NextResponse } from "next/server"
import { requireEventOwnership } from "@/lib/owner-auth"
import { getAllGuests, getEventConfig } from "@/lib/store"

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    await requireEventOwnership(eventId)
    const config = await getEventConfig(eventId)
    if (!config) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    const guests = await getAllGuests(eventId)
    return NextResponse.json({ guests, pages: config.pages })
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
