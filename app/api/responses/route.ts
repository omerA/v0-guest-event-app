import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionPhone, saveGuestResponse, getGuestByPhone } from "@/lib/store"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const phone = getSessionPhone(sessionId)
    if (!phone) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { responses } = await request.json()
    if (!responses || typeof responses !== "object") {
      return NextResponse.json({ error: "Responses are required" }, { status: 400 })
    }

    const guest = saveGuestResponse(phone, responses)

    return NextResponse.json({ success: true, guest })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const phone = getSessionPhone(sessionId)
    if (!phone) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const guest = getGuestByPhone(phone)
    return NextResponse.json({ guest })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
