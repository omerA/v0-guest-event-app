import { NextResponse } from "next/server"
import { renameEvent } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const { currentEventId, newName } = await request.json()

    if (!currentEventId || typeof currentEventId !== "string") {
      return NextResponse.json({ error: "currentEventId is required" }, { status: 400 })
    }
    if (!newName || typeof newName !== "string" || newName.trim().length < 2) {
      return NextResponse.json({ error: "newName is required (min 2 chars)" }, { status: 400 })
    }

    const result = await renameEvent(currentEventId, newName.trim())
    if (!result) {
      return NextResponse.json({ error: "Event not found or new name is already taken" }, { status: 409 })
    }

    return NextResponse.json({ newEventId: result.newId })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
