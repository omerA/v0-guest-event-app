"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2 } from "lucide-react"
import type { Guest } from "@/lib/store"

interface AlreadyRespondedProps {
  eventName: string
}

export function AlreadyResponded({ eventName }: AlreadyRespondedProps) {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResponse() {
      try {
        const res = await fetch("/api/responses")
        if (res.ok) {
          const data = await res.json()
          setGuest(data.guest)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchResponse()
  }, [])

  if (loading) {
    return (
      <Card className="w-full max-w-lg border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg border-0 shadow-lg">
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {guest ? `Welcome back, ${guest.name}!` : "Already responded!"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {"You've already submitted your RSVP for"} {eventName}. We look forward to seeing you there!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
