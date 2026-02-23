import { NextResponse } from "next/server"
import { getAllGuests, getEventConfig } from "@/lib/store"

export async function GET() {
  const guests = getAllGuests()
  const config = getEventConfig()

  return NextResponse.json({
    guests,
    pages: config.pages,
    fontFamily: config.fontFamily,
  })
}
