import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET(request: Request) {
  try {
    await verifyAdmin()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const track = searchParams.get("track")
    const key = process.env.UNSPLASH_ACCESS_KEY

    if (!key) {
      return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY not configured" }, { status: 503 })
    }

    // Unsplash download-tracking endpoint (must be called when a photo is used)
    if (track) {
      await fetch(track, { headers: { Authorization: `Client-ID ${key}` } })
      return NextResponse.json({ success: true })
    }

    if (!query?.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: "Unsplash API error" }, { status: 502 })
    }

    const data = (await res.json()) as {
      results: {
        id: string
        urls: { regular: string; small: string }
        user: { name: string; links: { html: string } }
        links: { download_location: string }
      }[]
    }

    const results = data.results.map((photo) => ({
      id: photo.id,
      url: `${photo.urls.regular}&w=1920&q=80`,
      thumbnail: photo.urls.small,
      photographer: photo.user.name,
      photographerUrl: `${photo.user.links.html}?utm_source=rsvp_app&utm_medium=referral`,
      downloadLocation: photo.links.download_location,
    }))

    return NextResponse.json({ results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error"
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
