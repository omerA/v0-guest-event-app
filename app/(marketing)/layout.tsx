import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EventRSVP — Beautiful event pages for every occasion",
  description:
    "Create stunning event pages in minutes. Collect RSVPs with custom forms, verify guests by phone, and track every response — all in one place.",
  openGraph: {
    title: "EventRSVP — Beautiful event pages for every occasion",
    description:
      "Create stunning event pages in minutes. Collect RSVPs with custom forms, verify guests by phone, and track every response — all in one place.",
    type: "website",
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
