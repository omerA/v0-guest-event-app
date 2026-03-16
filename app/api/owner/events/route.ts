import { NextResponse } from "next/server"
import { requireOwnerSession } from "@/lib/owner-auth"
import { db } from "@/lib/db"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60)
}

export async function GET() {
  try {
    const session = await requireOwnerSession()
    const events = await db.event.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, date: true, location: true, createdAt: true },
    })
    return NextResponse.json({ events })
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireOwnerSession()
    const { name } = await request.json()
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Event name is required (min 2 chars)" }, { status: 400 })
    }

    // Generate unique slug scoped to owner
    const trimmed = name.trim()
    const base = slugify(trimmed)
    let slug = base
    let counter = 1
    while (await db.event.findUnique({ where: { id: slug } })) {
      slug = `${base}-${counter++}`
    }

    const event = await db.event.create({
      data: {
        id: slug,
        ownerId: session.userId,
        name: trimmed,
        date: "",
        timezone: "UTC",
        location: "TBD",
        description: "Event description here.",
        heroMediaUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80",
        heroMediaType: "image",
        fontFamily: "playfair",
        pages: {
          create: [
            {
              id: `${slug}-page-1`,
              title: "Your Name",
              subtitle: "Let us know who you are",
              backgroundId: "gradient-champagne",
              order: 0,
              questions: {
                create: [
                  {
                    id: `${slug}-q-name`,
                    type: "text",
                    label: "What is your full name?",
                    required: true,
                    order: 0,
                  },
                ],
              },
            },
            {
              id: `${slug}-page-2`,
              title: "Your Attendance",
              subtitle: "Will you be joining us?",
              backgroundId: "gradient-forest",
              order: 1,
              questions: {
                create: [
                  {
                    id: `${slug}-q-attendance`,
                    type: "yes-no",
                    label: "Will you attend the event?",
                    required: true,
                    order: 0,
                  },
                ],
              },
            },
          ],
        },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof Response) return error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
