"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import type { HeroMediaType } from "@/lib/store"
import { formatEventDate, getCountdown } from "@/lib/date-utils"
import { useLanguage } from "@/components/language-provider"
import { LanguageSwitcher } from "@/components/language-provider"
import { t, getTranslation } from "@/lib/i18n"

interface VideoHeroProps {
  eventId: string
  eventName: string
  eventNameTranslations?: Record<string, string>
  eventDate: string
  eventLocation: string
  eventLocationTranslations?: Record<string, string>
  eventDescription: string
  eventDescriptionTranslations?: Record<string, string>
  mediaUrl: string
  mediaType: HeroMediaType
  fontClass: string
}

export function VideoHero({
  eventId,
  eventName,
  eventNameTranslations,
  eventDate,
  eventLocation,
  eventLocationTranslations,
  eventDescription,
  eventDescriptionTranslations,
  mediaUrl,
  mediaType,
  fontClass,
}: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // For images, start pre-loaded; for video, wait for onLoadedData
  const [loaded, setLoaded] = useState(mediaType !== "video")
  const [countdown, setCountdown] = useState<ReturnType<typeof getCountdown>>(null)
  const { language } = useLanguage()

  useEffect(() => {
    if (mediaType !== "video") return
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {})
  }, [mediaType])

  // Countdown runs client-side only to avoid hydration mismatch
  useEffect(() => {
    const update = () => setCountdown(getCountdown(eventDate))
    // Defer initial update to avoid calling setState synchronously in effect body
    const initTimer = setTimeout(update, 0)
    const interval = setInterval(update, 60_000)
    return () => {
      clearTimeout(initTimer)
      clearInterval(interval)
    }
  }, [eventDate])

  const displayName = getTranslation(eventName, eventNameTranslations, language)
  const displayLocation = getTranslation(eventLocation, eventLocationTranslations, language)
  const displayDescription = getTranslation(eventDescription, eventDescriptionTranslations, language)

  return (
    <section className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden">
      {/* Media Background */}
      {mediaType === "video" ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
          src={mediaUrl}
          muted
          autoPlay
          loop
          playsInline
          onLoadedData={() => setLoaded(true)}
        />
      ) : (
        <img
          src={mediaUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
        />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Language Switcher (top right) */}
      <div className="absolute top-6 end-6 z-20">
        <LanguageSwitcher />
      </div>

      {/* Content */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <p className="text-sm tracking-[0.3em] font-medium text-white/70 uppercase">{t(language, "youAreInvited")}</p>

        <h1
          className={`text-5xl leading-tight font-bold tracking-tight text-white sm:text-7xl sm:leading-tight text-balance ${fontClass}`}
        >
          {displayName}
        </h1>

        <div className="flex flex-col items-center gap-1 text-lg text-white/80">
          <span>{formatEventDate(eventDate)}</span>
          <span className="text-white/50">|</span>
          <span>{displayLocation}</span>
        </div>

        {/* Countdown (client-only to avoid hydration mismatch) */}
        {countdown && !countdown.isPast && (
          <div className="flex items-center gap-4">
            {[
              { value: countdown.days, label: t(language, "days") },
              { value: countdown.hours, label: t(language, "hours") },
              { value: countdown.minutes, label: t(language, "min") },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center gap-0.5">
                <span className="text-3xl font-bold tabular-nums text-white sm:text-4xl">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] tracking-[0.2em] font-medium text-white/40 uppercase">{unit.label}</span>
              </div>
            ))}
          </div>
        )}

        <p className="max-w-md text-base leading-relaxed text-white/65 text-pretty">{displayDescription}</p>

        <Link
          href={`/event/${eventId}/rsvp`}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95"
        >
          {t(language, "rsvpNow")}
        </Link>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 animate-bounce flex-col items-center gap-1">
        <span className="text-xs tracking-widest text-white/40 uppercase">{t(language, "scrollForDetails")}</span>
        <ChevronDown className="h-4 w-4 text-white/40" />
      </div>
    </section>
  )
}
