// Internationalization utilities and translations

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", rtl: false },
  { code: "he", label: "Hebrew", nativeLabel: "עברית", rtl: true },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"]

export const RTL_LANGUAGES = new Set<string>(SUPPORTED_LANGUAGES.filter((l) => l.rtl).map((l) => l.code))

export function isRtl(lang: string): boolean {
  return RTL_LANGUAGES.has(lang)
}

export function getTextDirection(lang: string): "rtl" | "ltr" {
  return isRtl(lang) ? "rtl" : "ltr"
}

export function getLanguageLabel(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code)
  return lang ? lang.nativeLabel : code
}

// ---- Static UI Translations ----

const uiTranslations: Record<string, Record<string, string>> = {
  en: {
    // RSVP Flow - Phone step
    rsvpFor: "RSVP for",
    enterPhonePrompt: "Enter your phone number to get started",
    sendCode: "Send Code",
    // RSVP Flow - OTP step
    enterYourCode: "Enter Your Code",
    weSentCode: "We sent a 6-digit code to your phone",
    demoCode: "Demo code",
    useDifferentNumber: "Use a different number",
    verify: "Verify",
    // RSVP Flow - Questions step
    optional: "(optional)",
    back: "Back",
    next: "Next",
    submit: "Submit",
    // RSVP Flow - Complete step
    thankYou: "Thank You",
    responseRecorded: "Your response has been recorded. We look forward to seeing you at the event.",
    responseUpdated: "Your response has been updated. We look forward to seeing you at the event.",
    addToCalendar: "Add to your calendar",
    googleCalendar: "Google Calendar",
    outlookCalendar: "Outlook Calendar",
    appleCalendar: "Apple Calendar (.ics)",
    backToEvent: "Back to Event",
    // Video Hero
    youAreInvited: "You are invited",
    rsvpNow: "RSVP Now",
    scrollForDetails: "Scroll for details",
    days: "Days",
    hours: "Hours",
    min: "Min",
    sec: "Sec",
    // Event Details
    eventDetails: "Event Details",
    everythingYouNeedToKnow: "Everything You Need to Know",
    date: "Date",
    time: "Time",
    venue: "Venue",
    dresscode: "Dress Code",
    reserveYourSpot: "Reserve Your Spot",
    // Errors
    somethingWentWrong: "Something went wrong. Please try again.",
    failedToSendCode: "Failed to send code",
    invalidCode: "Invalid code",
    failedToSubmit: "Failed to submit",
    // Question Renderers
    typeYourAnswer: "Type your answer here...",
    yes: "Yes",
    no: "No",
    adults: "Adults",
    children: "Children",
    babies: "Babies",
    ageAdults: "18+",
    ageChildren: "3 - 17",
    ageBabies: "0 - 2",
    noAdditionalGuests: "No additional guests",
    additionalGuest: "additional guest",
    additionalGuests: "additional guests",
    guests: "guests",
    // Language switcher
    language: "Language",
  },
  he: {
    // RSVP Flow - Phone step
    rsvpFor: "אישור הגעה ל",
    enterPhonePrompt: "הזינו את מספר הטלפון שלכם להתחלה",
    sendCode: "שלח קוד",
    // RSVP Flow - OTP step
    enterYourCode: "הזינו את הקוד שלכם",
    weSentCode: "שלחנו קוד בן 6 ספרות לטלפון שלכם",
    demoCode: "קוד הדגמה",
    useDifferentNumber: "השתמש במספר אחר",
    verify: "אמת",
    // RSVP Flow - Questions step
    optional: "(אופציונלי)",
    back: "חזור",
    next: "הבא",
    submit: "שלח",
    // RSVP Flow - Complete step
    thankYou: "תודה רבה",
    responseRecorded: "תגובתכם נרשמה. מצפים לראותכם באירוע.",
    responseUpdated: "תגובתכם עודכנה. מצפים לראותכם באירוע.",
    addToCalendar: "הוסיפו ליומן שלכם",
    googleCalendar: "יומן Google",
    outlookCalendar: "יומן Outlook",
    appleCalendar: "יומן Apple (.ics)",
    backToEvent: "חזרה לאירוע",
    // Video Hero
    youAreInvited: "את/ה מוזמן/ת",
    rsvpNow: "אשרו הגעה",
    scrollForDetails: "גלול לפרטים",
    days: "ימים",
    hours: "שעות",
    min: "דק'",
    sec: "שנ'",
    // Event Details
    eventDetails: "פרטי האירוע",
    everythingYouNeedToKnow: "כל מה שצריך לדעת",
    date: "תאריך",
    time: "שעה",
    venue: "מיקום",
    dresscode: "קוד לבוש",
    reserveYourSpot: "שמרו את מקומכם",
    // Errors
    somethingWentWrong: "משהו השתבש. אנא נסו שוב.",
    failedToSendCode: "שליחת הקוד נכשלה",
    invalidCode: "קוד שגוי",
    failedToSubmit: "שליחת הטופס נכשלה",
    // Question Renderers
    typeYourAnswer: "הקלידו את תשובתכם כאן...",
    yes: "כן",
    no: "לא",
    adults: "מבוגרים",
    children: "ילדים",
    babies: "תינוקות",
    ageAdults: "18+",
    ageChildren: "3 - 17",
    ageBabies: "0 - 2",
    noAdditionalGuests: "אין אורחים נוספים",
    additionalGuest: "אורח/ת נוסף/ת",
    additionalGuests: "אורחים נוספים",
    guests: "אורחים",
    // Language switcher
    language: "שפה",
  },
}

/** Get a translated string for a UI key. Falls back to English, then the key itself. */
export function t(lang: string, key: string): string {
  return uiTranslations[lang]?.[key] ?? uiTranslations["en"]?.[key] ?? key
}

/** Get the translated version of user-generated content (e.g. event name, question label).
 *  Falls back to the default (English) value if the translation for lang is missing. */
export function getTranslation(
  defaultValue: string,
  translations: Record<string, string> | null | undefined,
  lang: string
): string {
  if (translations && translations[lang]) {
    return translations[lang]
  }
  return defaultValue
}

/** Get the translated options array for choice questions.
 *  Falls back to the default options array if translation is missing. */
export function getTranslatedOptions(
  defaultOptions: string[],
  optionsTranslations: Record<string, string[]> | null | undefined,
  lang: string
): string[] {
  if (optionsTranslations && optionsTranslations[lang] && optionsTranslations[lang].length === defaultOptions.length) {
    return optionsTranslations[lang]
  }
  return defaultOptions
}
