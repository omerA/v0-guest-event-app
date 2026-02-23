// In-memory data store (resets on server restart)
// In production, replace with a database integration

export type QuestionType = "text" | "select" | "radio"

export interface Question {
  id: string
  text: string
  type: QuestionType
  options?: string[]
  required: boolean
}

export interface Guest {
  id: string
  phone: string
  name: string
  responses: Record<string, string>
  submittedAt: string
}

export interface OTPEntry {
  code: string
  expiresAt: number
  phone: string
}

// Default event questions
const defaultQuestions: Question[] = [
  {
    id: "q1",
    text: "What is your full name?",
    type: "text",
    required: true,
  },
  {
    id: "q2",
    text: "Will you be attending the event?",
    type: "radio",
    options: ["Yes, I will attend", "No, I cannot attend", "Maybe, I'm not sure yet"],
    required: true,
  },
  {
    id: "q3",
    text: "Do you have any dietary preferences?",
    type: "select",
    options: ["No preference", "Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher"],
    required: true,
  },
  {
    id: "q4",
    text: "How many additional guests will you bring?",
    type: "select",
    options: ["0", "1", "2", "3", "4+"],
    required: true,
  },
  {
    id: "q5",
    text: "Any special requests or notes for the organizer?",
    type: "text",
    required: false,
  },
]

// In-memory stores
const otpStore = new Map<string, OTPEntry>()
const guestStore = new Map<string, Guest>()
const sessionStore = new Map<string, string>() // sessionId -> phone
let questions: Question[] = [...defaultQuestions]

// Event config
let eventConfig = {
  name: "Annual Gathering 2026",
  date: "Saturday, April 18th, 2026",
  location: "The Grand Hall, 123 Event Street",
  description: "Join us for an evening of celebration, great food, and wonderful company.",
}

// OTP functions
export function generateOTP(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
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

// Session functions
export function createSession(phone: string): string {
  const sessionId = crypto.randomUUID()
  sessionStore.set(sessionId, phone)
  return sessionId
}

export function getSessionPhone(sessionId: string): string | null {
  return sessionStore.get(sessionId) ?? null
}

// Guest functions
export function saveGuestResponse(phone: string, responses: Record<string, string>): Guest {
  const name = responses["q1"] || "Unknown"
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

// Questions functions
export function getQuestions(): Question[] {
  return questions
}

export function getEventConfig() {
  return eventConfig
}
