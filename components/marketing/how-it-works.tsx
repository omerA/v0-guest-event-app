const steps = [
  {
    number: "01",
    title: "Create your event",
    description:
      "Set up your event page in minutes — add a hero image, pick a theme, write your description, and build custom RSVP questions.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Share the link",
    description:
      "Send your unique event URL to guests via WhatsApp, email, or any channel you like. No app download needed on their end.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Track RSVPs",
    description:
      "Watch responses roll in from your real-time dashboard. Search the guest list, export data, and send reminders with one click.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Up and running in three steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No complicated setup. No integrations to wire up. Just a beautiful event page, ready in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden lg:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
            aria-hidden
          />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, idx) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
              >
                {/* Step number bubble */}
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary bg-background text-primary font-bold text-sm mb-5 shadow-sm">
                  {step.number}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center lg:justify-start text-primary">
                    {step.icon}
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
                </div>

                {/* Mobile connector */}
                {idx < steps.length - 1 && <div className="lg:hidden mt-8 w-px h-8 bg-border mx-auto" aria-hidden />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
