"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

interface VideoHeroProps {
  eventName: string
  eventDate: string
  eventLocation: string
  eventDescription: string
  videoUrl: string
  fontClass: string
}

export function VideoHero({
  eventName,
  eventDate,
  eventLocation,
  eventDescription,
  videoUrl,
  fontClass,
}: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {})
  }, [])

  return (
    <section className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
        src={videoUrl}
        muted
        autoPlay
        loop
        playsInline
        onLoadedData={() => setLoaded(true)}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <p className="text-sm tracking-[0.3em] font-medium text-white/70 uppercase">
          You are invited
        </p>

        <h1
          className={`text-5xl leading-tight font-bold tracking-tight text-white sm:text-7xl sm:leading-tight text-balance ${fontClass}`}
        >
          {eventName}
        </h1>

        <div className="flex flex-col items-center gap-1 text-lg text-white/80">
          <span>{eventDate}</span>
          <span className="text-white/50">|</span>
          <span>{eventLocation}</span>
        </div>

        <p className="max-w-md text-base leading-relaxed text-white/65 text-pretty">
          {eventDescription}
        </p>

        <Link
          href="/rsvp"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95"
        >
          RSVP Now
        </Link>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 animate-bounce flex-col items-center gap-1">
        <span className="text-xs tracking-widest text-white/40 uppercase">
          Scroll for details
        </span>
        <ChevronDown className="h-4 w-4 text-white/40" />
      </div>
    </section>
  )
}
