"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Users, RefreshCw } from "lucide-react"
import type { Guest, EventPage } from "@/lib/store"

export default function GuestsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [guests, setGuests] = useState<Guest[]>([])
  const [pages, setPages] = useState<EventPage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/events/${eventId}/guests`)
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests)
        setPages(data.pages)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchGuests() }, [fetchGuests])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchGuests()
    setRefreshing(false)
  }

  const allQuestions = pages.flatMap((p) => p.questions)

  function formatVal(val: unknown): string {
    if (val === undefined || val === null) return "-"
    if (typeof val === "boolean") return val ? "Yes" : "No"
    if (Array.isArray(val)) return val.join(", ")
    if (typeof val === "object") {
      const gc = val as { adults?: number; children?: number; babies?: number }
      const parts: string[] = []
      if (gc.adults) parts.push(`${gc.adults} adult${gc.adults !== 1 ? "s" : ""}`)
      if (gc.children) parts.push(`${gc.children} child${gc.children !== 1 ? "ren" : ""}`)
      if (gc.babies) parts.push(`${gc.babies} bab${gc.babies !== 1 ? "ies" : "y"}`)
      return parts.length > 0 ? parts.join(", ") : "None"
    }
    return String(val)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Guest Responses
            </CardTitle>
            <CardDescription>
              {guests.length === 0
                ? "No responses yet"
                : `${guests.length} ${guests.length === 1 ? "response" : "responses"} received`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="pt-0">
          {guests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">No responses yet</p>
              <p className="text-sm text-muted-foreground">Share the event link with your guests to start collecting RSVPs.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Phone</th>
                    {allQuestions.map((q) => (
                      <th key={q.id} className="pb-2 pr-4 text-left font-medium text-muted-foreground">
                        {q.label}
                      </th>
                    ))}
                    <th className="pb-2 text-left font-medium text-muted-foreground">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{guest.phone}</td>
                      {allQuestions.map((q) => (
                        <td key={q.id} className="py-2 pr-4 text-muted-foreground">
                          {formatVal(guest.responses[q.id])}
                        </td>
                      ))}
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(guest.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
