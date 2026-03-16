const features = [
  {
    icon: "🎨",
    title: "Beautiful event pages",
    description: "Customise fonts, hero images or videos, and colour themes to match any event style.",
  },
  {
    icon: "📝",
    title: "Custom RSVP forms",
    description:
      "Multi-page forms with text, multiple choice, number fields, and more — built visually, no code needed.",
  },
  {
    icon: "📱",
    title: "Phone OTP verification",
    description: "Guests verify by phone number — no passwords or accounts needed. Fewer no-shows, less friction.",
  },
  {
    icon: "👥",
    title: "Guest list & analytics",
    description: "See every response in real time with a searchable guest table and at-a-glance attendance stats.",
  },
  {
    icon: "🔔",
    title: "SMS & email notifications",
    description: "Send blast messages or automated reminders to all your guests — keeping everyone in the loop.",
    badge: "v2.0",
  },
  {
    icon: "📋",
    title: "Invitee management",
    description: "Upload your guest list and send personalised invite links so every attendee feels special.",
    badge: "v2.0",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30 dark:bg-muted/10 border-y border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Everything you need to run a flawless event
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From the invite page to the guest list, every detail is covered.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              {feature.badge && (
                <span className="absolute top-4 right-4 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {feature.badge}
                </span>
              )}
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
