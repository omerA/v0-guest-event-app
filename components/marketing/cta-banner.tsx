import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaBanner() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-primary px-8 py-16 sm:px-16 sm:py-20 text-center">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />

          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground tracking-tight">
              Ready to create your event?
            </h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Join organisers who trust EventRSVP to manage their guests. Set up your first event page in under five
              minutes.
            </p>

            <div className="pt-2">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-base px-8 gap-2 bg-white text-primary hover:bg-white/90 dark:bg-primary-foreground dark:text-primary dark:hover:bg-primary-foreground/90"
              >
                <Link href="/signup">
                  Get started free
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/60">
              No credit card required &bull; Free to start &bull; Setup in minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
