export function SocialProof() {
  return (
    <section className="py-24 sm:py-32 bg-primary/5 dark:bg-primary/10 border-y border-primary/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: tagline */}
          <div className="space-y-6">
            <p className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.15] tracking-tight">
              &ldquo;From invite to RSVP in under <span className="text-primary">2 minutes.</span>&rdquo;
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Guests arrive at your event page, verify their phone in seconds, answer your custom questions, and
              they&apos;re done. No friction, no forgotten passwords, no app downloads.
            </p>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-foreground">2 min</span>
                <span className="text-muted-foreground">average RSVP time</span>
              </div>
              <div className="w-px bg-border hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-foreground">98%</span>
                <span className="text-muted-foreground">OTP delivery rate</span>
              </div>
              <div className="w-px bg-border hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-foreground">0</span>
                <span className="text-muted-foreground">accounts needed</span>
              </div>
            </div>
          </div>

          {/* Right: sample event card */}
          <div className="relative">
            <div className="absolute -inset-3 bg-primary/8 rounded-3xl blur-xl dark:bg-primary/15" />
            <div className="relative bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              {/* Image area */}
              <div className="relative h-44 bg-gradient-to-br from-purple-500/30 via-primary/25 to-emerald-400/20 dark:from-purple-600/40 dark:via-primary/30 dark:to-emerald-500/20 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="text-5xl mb-2">🌸</div>
                  <p className="text-sm font-medium text-foreground/80">Spring Garden Party</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-card-foreground">Spring Garden Party 2026</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Sunday, April 20 · 3:00 PM — The Botanical Gardens
                  </p>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>RSVPs</span>
                    <span>78 / 100</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>

                {/* RSVP steps */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Enter phone", done: true },
                    { label: "Verify OTP", done: true },
                    { label: "Submit form", done: false },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-lg px-2 py-2 text-xs font-medium border ${
                        s.done
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      {s.done && (
                        <svg
                          className="w-3 h-3 mx-auto mb-0.5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {!s.done && (
                        <svg
                          className="w-3 h-3 mx-auto mb-0.5 text-muted-foreground/50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
