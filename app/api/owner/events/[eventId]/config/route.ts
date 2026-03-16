import { NextResponse } from "next/server"
import { requireEventOwnership } from "@/lib/owner-auth"
import { updateEventConfig } from "@/lib/store"

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
