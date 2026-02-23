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
  question: Question
  backgroundId: string // references BACKGROUND_GALLERY
}

export interface EventConfig {
  name: string
  date: string
  location: string
  description: string
  heroVideoUrl: string
  fontFamily: FontFamily
  pages: EventPage[]
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

export interface OTPEntry {
  code: string
  expiresAt: number
  phone: string
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
] as const

// ---- Font Options ----
export const FONT_OPTIONS: { id: FontFamily; label: string; cssFamily: string }[] = [
  { id: "playfair", label: "Playfair Display", cssFamily: "'Playfair Display', serif" },
  { id: "cormorant", label: "Cormorant Garamond", cssFamily: "'Cormorant Garamond', serif" },
  { id: "dm-serif", label: "DM Serif Display", cssFamily: "'DM Serif Display', serif" },
  { id: "libre-baskerville", label: "Libre Baskerville", cssFamily: "'Libre Baskerville', serif" },
  { id: "crimson-pro", label: "Crimson Pro", cssFamily: "'Crimson Pro', serif" },
]

// ---- Default Event Configuration ----
const defaultEventConfig: EventConfig = {
  name: "Annual Gathering 2026",
  date: "Saturday, April 18th, 2026",
  location: "The Grand Hall, 123 Event Street",
  description: "Join us for an evening of celebration, great food, and wonderful company. An unforgettable night awaits.",
  heroVideoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
  fontFamily: "playfair",
  pages: [
    {
      id: "page-1",
      title: "Your Name",
      subtitle: "Let us know who you are",
      question: {
        id: "q-name",
        type: "text",
        label: "What is your full name?",
        required: true,
      },
      backgroundId: "gradient-champagne",
    },
    {
      id: "page-2",
      title: "Your Attendance",
      subtitle: "Will you be joining us?",
      question: {
        id: "q-attendance",
        type: "yes-no",
        label: "Will you attend the event?",
        required: true,
      },
      backgroundId: "gradient-forest",
    },
    {
      id: "page-3",
      title: "Dietary Preference",
      subtitle: "Help us prepare for you",
      question: {
        id: "q-dietary",
        type: "single-choice",
        label: "Do you have any dietary preferences?",
        options: ["No Preference", "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher"],
        required: true,
      },
      backgroundId: "gradient-rose",
    },
    {
      id: "page-4",
      title: "Plus Ones",
      subtitle: "Bringing anyone along?",
      question: {
        id: "q-guests",
        type: "guest-count",
        label: "How many additional guests are coming with you?",
        required: false,
      },
      backgroundId: "gradient-ocean",
    },
    {
      id: "page-5",
      title: "Special Requests",
      subtitle: "Anything else we should know?",
      question: {
        id: "q-notes",
        type: "text",
        label: "Any special requests or notes?",
        required: false,
      },
      backgroundId: "gradient-midnight",
    },
  ],
}

// ---- In-memory stores ----
const otpStore = new Map<string, OTPEntry>()
const guestStore = new Map<string, Guest>()
const sessionStore = new Map<string, string>()
let eventConfig: EventConfig = JSON.parse(JSON.stringify(defaultEventConfig))

// ---- OTP functions ----
export function generateOTP(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
    phone,
  })
  return code
}

export function verifyOTP(phone: string, code: string): boolean {
  const entry = otpStore.get(phone)
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone)
    return false
  }
  if (entry.code !== code) return false
  otpStore.delete(phone)
  return true
}

// ---- Session functions ----
export function createSession(phone: string): string {
  const sessionId = crypto.randomUUID()
  sessionStore.set(sessionId, phone)
  return sessionId
}

export function getSessionPhone(sessionId: string): string | null {
  return sessionStore.get(sessionId) ?? null
}

// ---- Guest functions ----
export function saveGuestResponse(
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
  guestStore.set(phone, guest)
  return guest
}

export function getGuestByPhone(phone: string): Guest | null {
  return guestStore.get(phone) ?? null
}

export function getAllGuests(): Guest[] {
  return Array.from(guestStore.values())
}

export function hasGuestResponded(phone: string): boolean {
  return guestStore.has(phone)
}

// ---- Event config functions ----
export function getEventConfig(): EventConfig {
  return eventConfig
}

export function updateEventConfig(updates: Partial<EventConfig>): EventConfig {
  eventConfig = { ...eventConfig, ...updates }
  return eventConfig
}

export function getBackgroundById(id: string) {
  return BACKGROUND_GALLERY.find((bg) => bg.id === id) ?? BACKGROUND_GALLERY[0]
}
