import { redirect } from "next/navigation"
import Link from "next/link"
import { getOwnerSession } from "@/lib/owner-auth"
import { signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { CalendarDays, LogOut } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getOwnerSession()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
            <CalendarDays className="h-5 w-5 text-primary" />
            Event Manager
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{session.email}</span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <Button type="submit" variant="ghost" size="sm" className="gap-1.5">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
