import { NextResponse } from "next/server"
import { getQuestions, getEventConfig } from "@/lib/store"

export async function GET() {
  return NextResponse.json({
    event: getEventConfig(),
    questions: getQuestions(),
  })
}
