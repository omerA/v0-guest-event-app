import { NextResponse } from "next/server"
import { requireEventOwnership } from "@/lib/owner-auth"
import { getEventConfig, updateEventConfig, deleteEvent } from "@/lib/store"

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    await requireEventOwnership(eventId)
    const config = await getEventConfig(eventId)
    if (!config) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    return NextResponse.json(config)
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    await requireEventOwnership(eventId)
    const updates = await req.json()
    const updated = await updateEventConfig(eventId, updates)
    if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params
    await requireEventOwnership(eventId)
    const ok = await deleteEvent(eventId)
    if (!ok) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
