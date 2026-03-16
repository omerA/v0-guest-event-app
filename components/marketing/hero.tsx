import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function EventMockup() {
  return (
    <div className="relative mx-auto max-w-sm w-full">
      {/* Glow backdrop */}
      <div className="absolute -inset-4 bg-primary/10 dark:bg-primary/20 rounded-3xl blur-2xl" />

      {/* Card */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Hero image placeholder */}
        <div className="h-40 bg-gradient-to-br from-primary/30 via-primary/20 to-emerald-400/20 dark:from-primary/40 dark:via-primary/25 dark:to-emerald-500/20 flex items-end p-5">
          <div className="space-y-1">
            <Badge variant="secondary" className="text-xs font-medium">
              Saturday, June 14 · 7:00 PM
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground leading-snug">Annual Summer Gala 2026</h3>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              The Grand Ballroom, New York
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Join us for an unforgettable evening of celebration, great food, and wonderful company.
          </p>

          {/* Guest count */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["bg-emerald-400", "bg-blue-400", "bg-purple-400", "bg-amber-400"].map((color, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border-2 border-card ${color}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">142 guests confirmed</span>
          </div>

          {/* CTA button */}
          <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2.5 text-sm font-medium transition-colors">
            RSVP Now
          </button>
        </div>
      </div>

      {/* Floating notification */}
      <div className="absolute -right-4 -bottom-4 bg-card border border-border rounded-xl shadow-lg px-3.5 py-2.5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-base">🎉</div>
        <div>
          <p className="text-xs font-semibold text-foreground">New RSVP!</p>
          <p className="text-xs text-muted-foreground">Sarah just confirmed</p>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.45_0.12_160_/_0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.55_0.14_160_/_0.12),transparent)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Now in v2.0 — SMS notifications &amp; more
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Beautiful RSVP <span className="text-primary">experiences</span> for any event
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Create stunning event pages in minutes. Collect RSVPs with custom forms, verify guests by phone, and
                track every response — all in one place.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="text-base gap-2">
                <Link href="/signup">
                  Create your first event
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="#">See a live demo</Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Free to start
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                No credit card
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Setup in minutes
              </div>
            </div>
          </div>

          {/* Right: mockup */}
          <div className="lg:flex lg:justify-end">
            <EventMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
