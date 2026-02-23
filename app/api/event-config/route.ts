import { NextResponse } from "next/server"
import { getEventConfig, updateEventConfig } from "@/lib/store"

export async function GET() {
  return NextResponse.json(getEventConfig())
}

export async function PUT(request: Request) {
  try {
    const updates = await request.json()
    const updated = updateEventConfig(updates)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
