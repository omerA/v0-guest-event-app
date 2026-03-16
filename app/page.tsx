import { redirect } from "next/navigation"
import { getOwnerSession } from "@/lib/owner-auth"
import MarketingPage from "./(marketing)/page"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const session = await getOwnerSession()
  if (session) redirect("/dashboard")
  // No session — show the marketing homepage (Track B)
  return <MarketingPage />
}
