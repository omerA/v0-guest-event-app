// In-memory data store (resets on server restart)
// In production, replace with a database integration

export type QuestionType = "text" | "single-choice" | "multi-choice" | "number" | "yes-no" | "guest-count"

export type FontFamily = "playfair" | "cormorant" | "dm-serif" | "libre-baskerville" | "crimson-pro"

export interface Question {
  id: string
  type: QuestionType
  label: string
  description?: string
  options?: string[]
  min?: number
  max?: number
  required: boolean
}

export interface EventPage {
  id: string
  title: string
  subtitle?: string
  questions: Question[]
  backgroundId: string
  backgroundImageUrl?: string
}

export type HeroMediaType = "video" | "image"

export interface EventConfig {
  id: string // URL slug, unique identifier
  name: string
  date: string
  location: string
  description: string
  heroMediaUrl: string
  heroMediaType: HeroMediaType
  fontFamily: FontFamily
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
  { id: "gradient-warm", label: "Warm Sunset", type: "gradient" as const, value: "linear-gradient(135deg, #a85a3b 0%, #c4956a 50%, #d4a574 100%)" },
  { id: "gradient-ocean", label: "Ocean Deep", type: "gradient" as const, value: "linear-gradient(135deg, #0c3547 0%, #1a6b7a 50%, #2d9ea3 100%)" },
  { id: "gradient-forest", label: "Forest", type: "gradient" as const, value: "linear-gradient(135deg, #134e5e 0%, #3a8f6a 50%, #71b280 100%)" },
  { id: "gradient-rose", label: "Rose Gold", type: "gradient" as const, value: "linear-gradient(135deg, #8e5c5c 0%, #c9958e 50%, #e8c4a2 100%)" },
  { id: "gradient-midnight", label: "Midnight", type: "gradient" as const, value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
  { id: "gradient-champagne", label: "Champagne", type: "gradient" as const, value: "linear-gradient(135deg, #b39a7a 0%, #d4b896 50%, #f5e6d3 100%)" },
  { id: "gradient-noir", label: "Noir", type: "gradient" as const, value: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" },
  { id: "gradient-sage", label: "Sage", type: "gradient" as const, value: "linear-gradient(135deg, #4a6741 0%, #7a9e6e 50%, #a8c49a 100%)" },
  { id: "gradient-dusk", label: "Dusk", type: "gradient" as const, value: "linear-gradient(135deg, #2c1654 0%, #6b3a7d 50%, #c06c84 100%)" },
  { id: "img-flowers", label: "Flowers", type: "image" as const, value: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=1200&q=80" },
  { id: "img-mountains", label: "Mountains", type: "image" as const, value: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80" },
  { id: "img-candles", label: "Candles", type: "image" as const, value: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80" },
  { id: "img-ballroom", label: "Ballroom", type: "image" as const, value: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80" },
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

// ---- Default Event Configuration ----
function createDefaultEvent(): EventConfig {
  return {
    id: "annual-gathering-2026",
    name: "Annual Gathering 2026",
    date: "2026-04-18T19:00:00",
    location: "The Grand Hall, 123 Event Street",
    description: "Join us for an evening of celebration, great food, and wonderful company. An unforgettable night awaits.",
    heroMediaUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
    heroMediaType: "video",
    fontFamily: "playfair",
    createdAt: new Date().toISOString(),
    pages: [
      {
        id: "page-1",
        title: "Your Name",
        subtitle: "Let us know who you are",
        questions: [{ id: "q-name", type: "text", label: "What is your full name?", required: true }],
        backgroundId: "gradient-champagne",
      },
      {
        id: "page-2",
        title: "Your Attendance",
        subtitle: "Will you be joining us?",
        questions: [{ id: "q-attendance", type: "yes-no", label: "Will you attend the event?", required: true }],
        backgroundId: "gradient-forest",
      },
      {
        id: "page-3",
        title: "Dietary Preference",
        subtitle: "Help us prepare for you",
        questions: [{ id: "q-dietary", type: "single-choice", label: "Do you have any dietary preferences?", options: ["No Preference", "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher"], required: true }],
        backgroundId: "gradient-rose",
      },
      {
        id: "page-4",
        title: "Plus Ones",
        subtitle: "Bringing anyone along?",
        questions: [{ id: "q-guests", type: "guest-count", label: "How many additional guests are coming with you?", required: false }],
        backgroundId: "gradient-ocean",
      },
      {
        id: "page-5",
        title: "Special Requests",
        subtitle: "Anything else we should know?",
        questions: [{ id: "q-notes", type: "text", label: "Any special requests or notes?", required: false }],
        backgroundId: "gradient-midnight",
      },
    ],
  }
}

// ---- In-memory stores ----
// Map<eventId, EventConfig>
const eventStore = new Map<string, EventConfig>()
// Map<eventId, Map<phone, Guest>>
const guestStoreByEvent = new Map<string, Map<string, Guest>>()

// Seed the default event
const defaultEvent = createDefaultEvent()
eventStore.set(defaultEvent.id, defaultEvent)
guestStoreByEvent.set(defaultEvent.id, new Map())

// Secret used for simple HMAC-like session tokens
const SESSION_SECRET = "event-rsvp-demo-secret-2026"

// ---- OTP functions ----
function getDemoCode(phone: string): string {
  let hash = 0
  for (let i = 0; i < phone.length; i++) {
    hash = ((hash << 5) - hash + phone.charCodeAt(i)) | 0
  }
  return String(Math.abs(hash) % 900000 + 100000)
}

export function generateOTP(phone: string): string {
  return getDemoCode(phone)
}

export function verifyOTP(phone: string, code: string): boolean {
  return code === getDemoCode(phone)
}

// ---- Session functions (stateless, encoded tokens) ----
// Token format: base64url(eventId:phone.sig)
function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

export function createSession(eventId: string, phone: string): string {
  const data = `${eventId}:${phone}`
  const sig = simpleHash(data + SESSION_SECRET)
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
    if (sig !== simpleHash(data + SESSION_SECRET)) return null
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

// ---- Event CRUD functions ----
export function getAllEvents(): EventConfig[] {
  return Array.from(eventStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getEventConfig(eventId: string): EventConfig | null {
  return eventStore.get(eventId) ?? null
}

export function createEvent(name: string): EventConfig {
  let slug = slugify(name)
  // Ensure unique slug
  let counter = 1
  while (eventStore.has(slug)) {
    slug = `${slugify(name)}-${counter++}`
  }
  const event: EventConfig = {
    id: slug,
    name,
    date: "",
    location: "TBD",
    description: "Event description here.",
    heroMediaUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80",
    heroMediaType: "image",
    fontFamily: "playfair",
    createdAt: new Date().toISOString(),
    pages: [
      {
        id: "page-1",
        title: "Your Name",
        subtitle: "Let us know who you are",
        questions: [{ id: "q-name", type: "text", label: "What is your full name?", required: true }],
        backgroundId: "gradient-champagne",
      },
      {
        id: "page-2",
        title: "Your Attendance",
        subtitle: "Will you be joining us?",
        questions: [{ id: "q-attendance", type: "yes-no", label: "Will you attend the event?", required: true }],
        backgroundId: "gradient-forest",
      },
    ],
  }
  eventStore.set(slug, event)
  guestStoreByEvent.set(slug, new Map())
  return event
}

export function deleteEvent(eventId: string): boolean {
  if (!eventStore.has(eventId)) return false
  eventStore.delete(eventId)
  guestStoreByEvent.delete(eventId)
  return true
}

export function updateEventConfig(eventId: string, updates: Partial<EventConfig>): EventConfig | null {
  const existing = eventStore.get(eventId)
  if (!existing) return null
  const updated = { ...existing, ...updates, id: existing.id } // prevent overwriting id
  eventStore.set(eventId, updated)
  return updated
}

// ---- Guest functions (scoped by event) ----
function getEventGuests(eventId: string): Map<string, Guest> {
  let guests = guestStoreByEvent.get(eventId)
  if (!guests) {
    guests = new Map()
    guestStoreByEvent.set(eventId, guests)
  }
  return guests
}

export function saveGuestResponse(
  eventId: string,
  phone: string,
  responses: Record<string, ResponseValue>
): Guest {
  const nameAnswer = responses["q-name"]
  const name = typeof nameAnswer === "string" ? nameAnswer : "Unknown"
  const guest: Guest = {
    id: crypto.randomUUID(),
    phone,
    name,
    responses,
    submittedAt: new Date().toISOString(),
  }
  getEventGuests(eventId).set(phone, guest)
  return guest
}

export function getGuestByPhone(eventId: string, phone: string): Guest | null {
  return getEventGuests(eventId).get(phone) ?? null
}

export function getAllGuests(eventId: string): Guest[] {
  return Array.from(getEventGuests(eventId).values())
}

export function hasGuestResponded(eventId: string, phone: string): boolean {
  return getEventGuests(eventId).has(phone)
}

export function getBackgroundById(id: string) {
  return BACKGROUND_GALLERY.find((bg) => bg.id === id) ?? BACKGROUND_GALLERY[0]
}
