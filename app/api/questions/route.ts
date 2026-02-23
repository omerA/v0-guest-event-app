import { NextResponse } from "next/server"
import { getEventConfig } from "@/lib/store"

export async function GET() {
  const config = getEventConfig()
  return NextResponse.json({
    event: {
      name: config.name,
      date: config.date,
      location: config.location,
      description: config.description,
      heroVideoUrl: config.heroVideoUrl,
      fontFamily: config.fontFamily,
    },
    pages: config.pages,
  })
}
