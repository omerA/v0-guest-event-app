import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { listMedia, deleteMedia } from "@/lib/media"

export async function GET() {
  try {
    await verifyAdmin()
    const files = await listMedia()
    return NextResponse.json({ files })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error"
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await verifyAdmin()
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 })
    await deleteMedia(key)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error"
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
