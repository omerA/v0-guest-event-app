import { AdminDashboard } from "@/components/admin-dashboard"
import { Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Admin - Event Responses",
  description: "View and manage guest RSVP responses",
}

export default function AdminPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">
              Event Dashboard
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Guest view
          </Link>
        </header>

        <AdminDashboard />
      </div>
    </main>
  )
}
