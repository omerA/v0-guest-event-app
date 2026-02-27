// Data store — backed by PostgreSQL via Prisma
// See prisma/schema.prisma for the database schema

import { createHmac } from "crypto"
import { db, type TxClient } from "./db"

// ---- Domain types ----

export type QuestionType = "text" | "single-choice" | "multi-choice" | "number" | "yes-no" | "guest-count"

export type FontFamily = "playfair" | "cormorant" | "dm-serif" | "libre-baskerville" | "crimson-pro"

export interface Question {
  id: string
  type: QuestionType
  label: string
  labelTranslations?: Record<string, string>
  description?: string
  descriptionTranslations?: Record<string, string>
  options?: string[]
  optionsTranslations?: Record<string, string[]>
  min?: number
  max?: number
  required: boolean
}

export interface EventPage {
  id: string
  title: string
  titleTranslations?: Record<string, string>
  subtitle?: string
  subtitleTranslations?: Record<string, string>
  questions: Question[]
  backgroundId: string
  backgroundImageUrl?: string
}

export type HeroMediaType = "video" | "image"

export interface EventConfig {
  id: string
  name: string
  nameTranslations?: Record<string, string>
  date: string
  location: string
  locationTranslations?: Record<string, string>
  description: string
  descriptionTranslations?: Record<string, string>
  heroMediaUrl: string
  heroMediaType: HeroMediaType
  fontFamily: FontFamily
  supportedLanguages: string[]
  defaultLanguage: string
  pages: EventPage[]
  createdAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResponseValue = string | string[] | number | boolean | Record<string, any>

export interface Guest {
  id: string
  phone: string
  name: string
  responses: Record<string, ResponseValue>
  submittedAt: string
}

// ---- Background Gallery ----
export const BACKGROUND_GALLERY = [
  { id: "none", label: "No Background", type: "none" as const, value: "" },
  {
    id: "gradient-warm",
    label: "Warm Sunset",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #a85a3b 0%, #c4956a 50%, #d4a574 100%)",
  },
  {
    id: "gradient-ocean",
    label: "Ocean Deep",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #0c3547 0%, #1a6b7a 50%, #2d9ea3 100%)",
  },
  {
    id: "gradient-forest",
    label: "Forest",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #134e5e 0%, #3a8f6a 50%, #71b280 100%)",
  },
  {
    id: "gradient-rose",
    label: "Rose Gold",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #8e5c5c 0%, #c9958e 50%, #e8c4a2 100%)",
  },
  {
    id: "gradient-midnight",
    label: "Midnight",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
  {
    id: "gradient-champagne",
    label: "Champagne",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #b39a7a 0%, #d4b896 50%, #f5e6d3 100%)",
  },
  {
    id: "gradient-noir",
    label: "Noir",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  {
    id: "gradient-sage",
    label: "Sage",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #4a6741 0%, #7a9e6e 50%, #a8c49a 100%)",
  },
  {
    id: "gradient-dusk",
    label: "Dusk",
    type: "gradient" as const,
    value: "linear-gradient(135deg, #2c1654 0%, #6b3a7d 50%, #c06c84 100%)",
  },
  {
    id: "img-flowers",
    label: "Flowers",
    type: "image" as const,
    value: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=1200&q=80",
  },
  {
    id: "img-mountains",
    label: "Mountains",
    type: "image" as const,
    value: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  },
  {
    id: "img-candles",
    label: "Candles",
    type: "image" as const,
    value: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
  },
  {
    id: "img-ballroom",
    label: "Ballroom",
    type: "image" as const,
    value: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
  },
] as const

// ---- Font Options ----
export const FONT_OPTIONS: { id: FontFamily; label: string; cssFamily: string }[] = [
  { id: "playfair", label: "Playfair Display", cssFamily: "'Playfair Display', serif" },
  { id: "cormorant", label: "Cormorant Garamond", cssFamily: "'Cormorant Garamond', serif" },
  { id: "dm-serif", label: "DM Serif Display", cssFamily: "'DM Serif Display', serif" },
  { id: "libre-baskerville", label: "Libre Baskerville", cssFamily: "'Libre Baskerville', serif" },
  { id: "crimson-pro", label: "Crimson Pro", cssFamily: "'Crimson Pro', serif" },
]

// ---- Slug generation ----
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60)
}

// ---- Session functions (stateless, HMAC-signed tokens) ----
// Token format: base64url(eventId:phone.hmac)

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set")
  return secret
}

function hmacSign(data: string): string {
  return createHmac("sha256", getSessionSecret()).update(data).digest("hex")
}

export function createSession(eventId: string, phone: string): string {
  const data = `${eventId}:${phone}`
  const sig = hmacSign(data)
  const payload = `${data}.${sig}`
  return Buffer.from(payload).toString("base64url")
}

export function getSessionData(sessionToken: string): { eventId: string; phone: string } | null {
  try {
    const payload = Buffer.from(sessionToken, "base64url").toString()
    const dotIndex = payload.lastIndexOf(".")
    if (dotIndex === -1) return null
    const data = payload.slice(0, dotIndex)
    const sig = payload.slice(dotIndex + 1)
    if (sig !== hmacSign(data)) return null
    const colonIndex = data.indexOf(":")
    if (colonIndex === -1) return null
    return {
      eventId: data.slice(0, colonIndex),
      phone: data.slice(colonIndex + 1),
    }
  } catch {
    return null
  }
}

// ---- Prisma → Domain type mappers ----

type PrismaQuestion = {
  id: string
  type: string
  label: string
  labelTranslations: unknown
  description: string | null
  descriptionTranslations: unknown
  options: unknown
  optionsTranslations: unknown
  min: number | null
  max: number | null
  required: boolean
  order: number
  pageId: string
}

type PrismaPage = {
  id: string
  title: string
  titleTranslations: unknown
  subtitle: string | null
  subtitleTranslations: unknown
  backgroundId: string
  backgroundImageUrl: string | null
  order: number
  questions: PrismaQuestion[]
}

type PrismaGuest = {
  id: string
  eventId: string
  phone: string
  name: string
  responses: unknown
  submittedAt: Date
}

type PrismaEvent = {
  id: string
  name: string
  nameTranslations: unknown
  date: string
  location: string
  locationTranslations: unknown
  description: string
  descriptionTranslations: unknown
  heroMediaUrl: string
  heroMediaType: string
  fontFamily: string
  supportedLanguages: string[]
  defaultLanguage: string
  createdAt: Date
  pages: PrismaPage[]
}

function asTranslationMap(val: unknown): Record<string, string> | undefined {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, string>
  }
  return undefined
}

function asOptionsTranslationMap(val: unknown): Record<string, string[]> | undefined {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as Record<string, string[]>
  }
  return undefined
}

function mapQuestion(q: PrismaQuestion): Question {
  return {
    id: q.id,
    type: q.type as QuestionType,
    label: q.label,
    labelTranslations: asTranslationMap(q.labelTranslations),
    description: q.description ?? undefined,
    descriptionTranslations: asTranslationMap(q.descriptionTranslations),
    options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
    optionsTranslations: asOptionsTranslationMap(q.optionsTranslations),
    min: q.min ?? undefined,
    max: q.max ?? undefined,
    required: q.required,
  }
}

function mapPage(p: PrismaPage): EventPage {
  return {
    id: p.id,
    title: p.title,
    titleTranslations: asTranslationMap(p.titleTranslations),
    subtitle: p.subtitle ?? undefined,
    subtitleTranslations: asTranslationMap(p.subtitleTranslations),
    backgroundId: p.backgroundId,
    backgroundImageUrl: p.backgroundImageUrl ?? undefined,
    questions: [...p.questions].sort((a, b) => a.order - b.order).map(mapQuestion),
  }
}

function mapEvent(e: PrismaEvent): EventConfig {
  return {
    id: e.id,
    name: e.name,
    nameTranslations: asTranslationMap(e.nameTranslations),
    date: e.date,
    location: e.location,
    locationTranslations: asTranslationMap(e.locationTranslations),
    description: e.description,
    descriptionTranslations: asTranslationMap(e.descriptionTranslations),
    heroMediaUrl: e.heroMediaUrl,
    heroMediaType: e.heroMediaType as HeroMediaType,
    fontFamily: e.fontFamily as FontFamily,
    supportedLanguages: e.supportedLanguages ?? ["en"],
    defaultLanguage: e.defaultLanguage ?? "en",
    createdAt: e.createdAt.toISOString(),
    pages: [...e.pages].sort((a, b) => a.order - b.order).map(mapPage),
  }
}

const pageInclude = {
  pages: {
    include: { questions: true },
  },
}

// ---- Event CRUD ----

export async function getAllEvents(): Promise<EventConfig[]> {
  const events = await db.event.findMany({
    include: pageInclude,
    orderBy: { createdAt: "desc" },
  })
  return (events as PrismaEvent[]).map(mapEvent)
}

export async function getEventConfig(eventId: string): Promise<EventConfig | null> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: pageInclude,
  })
  return event ? mapEvent(event as PrismaEvent) : null
}

export async function createEvent(name: string): Promise<EventConfig> {
  let slug = slugify(name)
  let counter = 1
  while (await db.event.findUnique({ where: { id: slug } })) {
    slug = `${slugify(name)}-${counter++}`
  }

  const event = await db.event.create({
    data: {
      id: slug,
      name,
      date: "",
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
                { id: `${slug}-q-name`, type: "text", label: "What is your full name?", required: true, order: 0 },
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
    include: pageInclude,
  })

  return mapEvent(event as PrismaEvent)
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const existing = await db.event.findUnique({ where: { id: eventId } })
  if (!existing) return false
  await db.event.delete({ where: { id: eventId } })
  return true
}

export async function updateEventConfig(eventId: string, updates: Partial<EventConfig>): Promise<EventConfig | null> {
  const existing = await db.event.findUnique({ where: { id: eventId } })
  if (!existing) return null

  const { pages, id: _id, createdAt: _createdAt, ...scalarUpdates } = updates

  await db.$transaction(async (tx: TxClient) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        ...(scalarUpdates.name !== undefined && { name: scalarUpdates.name }),
        ...(scalarUpdates.nameTranslations !== undefined && {
          nameTranslations: scalarUpdates.nameTranslations ?? undefined,
        }),
        ...(scalarUpdates.date !== undefined && { date: scalarUpdates.date }),
        ...(scalarUpdates.location !== undefined && { location: scalarUpdates.location }),
        ...(scalarUpdates.locationTranslations !== undefined && {
          locationTranslations: scalarUpdates.locationTranslations ?? undefined,
        }),
        ...(scalarUpdates.description !== undefined && { description: scalarUpdates.description }),
        ...(scalarUpdates.descriptionTranslations !== undefined && {
          descriptionTranslations: scalarUpdates.descriptionTranslations ?? undefined,
        }),
        ...(scalarUpdates.heroMediaUrl !== undefined && { heroMediaUrl: scalarUpdates.heroMediaUrl }),
        ...(scalarUpdates.heroMediaType !== undefined && { heroMediaType: scalarUpdates.heroMediaType }),
        ...(scalarUpdates.fontFamily !== undefined && { fontFamily: scalarUpdates.fontFamily }),
        ...(scalarUpdates.supportedLanguages !== undefined && { supportedLanguages: scalarUpdates.supportedLanguages }),
        ...(scalarUpdates.defaultLanguage !== undefined && { defaultLanguage: scalarUpdates.defaultLanguage }),
      },
    })

    if (pages !== undefined) {
      await tx.question.deleteMany({ where: { page: { eventId } } })
      await tx.eventPage.deleteMany({ where: { eventId } })

      for (let pi = 0; pi < pages.length; pi++) {
        const page = pages[pi]
        await tx.eventPage.create({
          data: {
            id: page.id,
            eventId,
            title: page.title,
            titleTranslations: page.titleTranslations ?? undefined,
            subtitle: page.subtitle ?? null,
            subtitleTranslations: page.subtitleTranslations ?? undefined,
            backgroundId: page.backgroundId,
            backgroundImageUrl: page.backgroundImageUrl ?? null,
            order: pi,
            questions: {
              create: page.questions.map((q, qi) => ({
                id: q.id,
                type: q.type,
                label: q.label,
                labelTranslations: q.labelTranslations ?? undefined,
                description: q.description ?? null,
                descriptionTranslations: q.descriptionTranslations ?? undefined,
                options: q.options ?? undefined,
                optionsTranslations: q.optionsTranslations ?? undefined,
                min: q.min ?? null,
                max: q.max ?? null,
                required: q.required,
                order: qi,
              })),
            },
          },
        })
      }
    }
  })

  const updated = await db.event.findUnique({ where: { id: eventId }, include: pageInclude })
  return updated ? mapEvent(updated as PrismaEvent) : null
}

// ---- Guest functions ----

export async function saveGuestResponse(
  eventId: string,
  phone: string,
  responses: Record<string, ResponseValue>
): Promise<Guest> {
  const nameAnswer = responses["q-name"]
  const name = typeof nameAnswer === "string" ? nameAnswer : "Unknown"

  const guest = await db.guest.upsert({
    where: { eventId_phone: { eventId, phone } },
    create: { eventId, phone, name, responses },
    update: { name, responses, submittedAt: new Date() },
  })

  return {
    id: guest.id,
    phone: guest.phone,
    name: guest.name,
    responses: guest.responses as Record<string, ResponseValue>,
    submittedAt: guest.submittedAt.toISOString(),
  }
}

export async function getGuestByPhone(eventId: string, phone: string): Promise<Guest | null> {
  const guest = await db.guest.findUnique({ where: { eventId_phone: { eventId, phone } } })
  if (!guest) return null
  return {
    id: guest.id,
    phone: guest.phone,
    name: guest.name,
    responses: guest.responses as Record<string, ResponseValue>,
    submittedAt: guest.submittedAt.toISOString(),
  }
}

export async function getAllGuests(eventId: string): Promise<Guest[]> {
  const guests = await db.guest.findMany({ where: { eventId }, orderBy: { submittedAt: "desc" } })
  return (guests as PrismaGuest[]).map((g) => ({
    id: g.id,
    phone: g.phone,
    name: g.name,
    responses: g.responses as Record<string, ResponseValue>,
    submittedAt: g.submittedAt.toISOString(),
  }))
}

export async function hasGuestResponded(eventId: string, phone: string): Promise<boolean> {
  const count = await db.guest.count({ where: { eventId, phone } })
  return count > 0
}

// ---- Background helper ----

export function getBackgroundById(id: string) {
  return BACKGROUND_GALLERY.find((bg) => bg.id === id) ?? BACKGROUND_GALLERY[0]
}
