import { NextResponse } from "next/server"
import { getAllGuests, getQuestions } from "@/lib/store"

// Simple admin access - in production, add proper auth
export async function GET() {
  const guests = getAllGuests()
  const questions = getQuestions()

  return NextResponse.json({ guests, questions })
}
