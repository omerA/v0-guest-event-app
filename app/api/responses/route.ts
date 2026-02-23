import { NextResponse } from "next/server"
import { getSessionData, saveGuestResponse, getGuestByPhone } from "@/lib/store"

function getSessionFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }
  return null
}

export async function POST(request: Request) {
  try {
    const token = getSessionFromRequest(request)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const session = getSessionData(token)
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 })

    const { responses } = await request.json()
    if (!responses || typeof responses !== "object") {
      return NextResponse.json({ error: "Responses are required" }, { status: 400 })
    }

    const guest = saveGuestResponse(session.eventId, session.phone, responses)
    return NextResponse.json({ success: true, guest })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const token = getSessionFromRequest(request)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const session = getSessionData(token)
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 })

    const guest = getGuestByPhone(session.eventId, session.phone)
    return NextResponse.json({ guest })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
