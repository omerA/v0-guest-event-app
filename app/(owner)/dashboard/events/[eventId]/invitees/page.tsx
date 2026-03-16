import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function InviteesPage({ params }: Props) {
  const { eventId } = await params

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/events/${eventId}`} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Invitees</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Coming soon — check back after Track D merges.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
