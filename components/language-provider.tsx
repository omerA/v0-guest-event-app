"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { isRtl, getLanguageLabel, SUPPORTED_LANGUAGES } from "@/lib/i18n"

// ---- Language Context ----

interface LanguageContextValue {
  language: string
  setLanguage: (lang: string) => void
  supportedLanguages: string[]
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  supportedLanguages: ["en"],
})

export function useLanguage() {
  return useContext(LanguageContext)
}

// ---- Language Provider ----

interface LanguageProviderProps {
  children: ReactNode
  defaultLanguage: string
  supportedLanguages: string[]
}

export function LanguageProvider({ children, defaultLanguage, supportedLanguages }: LanguageProviderProps) {
  const [language, setLanguageState] = useState(defaultLanguage)

  function setLanguage(lang: string) {
    if (supportedLanguages.includes(lang)) {
      setLanguageState(lang)
    }
  }

  // Apply RTL direction and lang attribute to the document root
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isRtl(language) ? "rtl" : "ltr"
    return () => {
      // Reset to LTR/en when unmounting (e.g. navigating away from event page)
      document.documentElement.lang = "en"
      document.documentElement.dir = "ltr"
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  )
}

// ---- Language Switcher ----

export function LanguageSwitcher() {
  const { language, setLanguage, supportedLanguages } = useLanguage()

  // Don't render if only one language is supported
  if (supportedLanguages.length <= 1) return null

  // Only show languages that are actually configured in SUPPORTED_LANGUAGES
  const availableLanguages = SUPPORTED_LANGUAGES.filter((l) => supportedLanguages.includes(l.code))

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
      {availableLanguages.map((lang) => {
        const isActive = language === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
              isActive ? "bg-white text-black shadow-sm" : "text-white/70 hover:text-white"
            }`}
          >
            {lang.nativeLabel}
          </button>
        )
      })}
    </div>
  )
}

// Re-export for convenience
export { getLanguageLabel }
