import {
  format,
  formatDistanceToNowStrict,
  isPast,
  isValid,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns"
import { he } from "date-fns/locale"

const DATE_FNS_LOCALES: Record<string, Locale> = { he }

/**
 * Format an ISO date string for display, localized to the given language.
 * e.g. "Saturday, April 18, 2026" (en) or "שבת, 18 אפריל 2026" (he)
 */
export function formatEventDate(iso: string, lang = "en"): string {
  if (!iso) return "Date TBD"
  const d = parseISO(iso)
  if (!isValid(d)) return "Date TBD"
  const locale = DATE_FNS_LOCALES[lang]
  if (locale) {
    return format(d, "EEEE, d MMMM yyyy", { locale })
  }
  return format(d, "EEEE, MMMM d, yyyy")
}

/**
 * Format the time portion, localized to the given language.
 * Hebrew uses 24h clock; English uses 12h AM/PM.
 * e.g. "7:00 PM" (en) or "19:00" (he)
 */
export function formatEventTime(iso: string, lang = "en"): string {
  if (!iso) return "Time TBD"
  const d = parseISO(iso)
  if (!isValid(d)) return "Time TBD"
  return lang === "he" ? format(d, "HH:mm") : format(d, "h:mm a")
}

/**
 * Short format for compact display.
 * e.g. "Apr 18, 2026"
 */
export function formatEventDateShort(iso: string): string {
  if (!iso) return "TBD"
  const d = parseISO(iso)
  if (!isValid(d)) return "TBD"
  return format(d, "MMM d, yyyy")
}

/**
 * Countdown info for event.
 */
export interface CountdownInfo {
  isPast: boolean
  label: string
  days: number
  hours: number
  minutes: number
}

export function getCountdown(iso: string): CountdownInfo | null {
  if (!iso) return null
  const d = parseISO(iso)
  if (!isValid(d)) return null

  if (isPast(d)) {
    return { isPast: true, label: "Event has passed", days: 0, hours: 0, minutes: 0 }
  }

  const now = new Date()
  const days = differenceInDays(d, now)
  const hours = differenceInHours(d, now) % 24
  const minutes = differenceInMinutes(d, now) % 60

  const label = formatDistanceToNowStrict(d, { addSuffix: true })

  return { isPast: false, label, days, hours, minutes }
}

/**
 * Build Google Calendar URL.
 */
export function googleCalendarUrl(opts: {
  title: string
  date: string
  location: string
  description: string
}): string {
  const d = parseISO(opts.date)
  if (!isValid(d)) return "#"
  // Google format: 20260418T190000/20260418T220000
  const startStr = format(d, "yyyyMMdd'T'HHmmss")
  // Assume 3 hour event
  const end = new Date(d.getTime() + 3 * 60 * 60 * 1000)
  const endStr = format(end, "yyyyMMdd'T'HHmmss")
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${startStr}/${endStr}`,
    location: opts.location,
    details: opts.description,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Build Outlook.com Calendar URL.
 */
export function outlookCalendarUrl(opts: {
  title: string
  date: string
  location: string
  description: string
}): string {
  const d = parseISO(opts.date)
  if (!isValid(d)) return "#"
  const startStr = d.toISOString()
  const end = new Date(d.getTime() + 3 * 60 * 60 * 1000)
  const endStr = end.toISOString()
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: opts.title,
    startdt: startStr,
    enddt: endStr,
    location: opts.location,
    body: opts.description,
  })
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}

/**
 * Generate .ics file content for Apple Calendar / other apps.
 */
export function generateICSContent(opts: {
  title: string
  date: string
  location: string
  description: string
}): string {
  const d = parseISO(opts.date)
  if (!isValid(d)) return ""
  const startStr = format(d, "yyyyMMdd'T'HHmmss")
  const end = new Date(d.getTime() + 3 * 60 * 60 * 1000)
  const endStr = format(end, "yyyyMMdd'T'HHmmss")
  const now = format(new Date(), "yyyyMMdd'T'HHmmss")

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Event RSVP//EN",
    "BEGIN:VEVENT",
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${opts.title}`,
    `LOCATION:${opts.location}`,
    `DESCRIPTION:${opts.description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

/**
 * Build Google Maps URL from a location string.
 */
export function googleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

/**
 * Build Waze URL from a location string.
 */
export function wazeUrl(location: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(location)}`
}

/**
 * Build Apple Maps URL from a location string.
 */
export function appleMapsUrl(location: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(location)}`
}
