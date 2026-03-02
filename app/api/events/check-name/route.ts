import { NextResponse } from "next/server"
import { checkEventNameAvailability } from "@/lib/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")
  const currentEventId = searchParams.get("currentEventId")

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "name is required (min 2 chars)" }, { status: 400 })
  }
  if (!currentEventId) {
    return NextResponse.json({ error: "currentEventId is required" }, { status: 400 })
  }

  const result = await checkEventNameAvailability(name.trim(), currentEventId)
  return NextResponse.json(result)
}
