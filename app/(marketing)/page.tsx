import { MarketingNav } from "@/components/marketing/nav"
import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { SocialProof } from "@/components/marketing/social-proof"
import { CtaBanner } from "@/components/marketing/cta-banner"
import { Footer } from "@/components/marketing/footer"

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <SocialProof />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
