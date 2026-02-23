"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Users, RefreshCw, Loader2, ClipboardList, ArrowLeft } from "lucide-react"
import type { Guest, Question } from "@/lib/store"

export function AdminDashboard() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)

    try {
      const res = await fetch("/api/admin/guests")
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests)
        setQuestions(data.questions)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const attendingCount = guests.filter(
    (g) => g.responses["q2"] === "Yes, I will attend"
  ).length

  const declinedCount = guests.filter(
    (g) => g.responses["q2"] === "No, I cannot attend"
  ).length

  const maybeCount = guests.filter(
    (g) => g.responses["q2"] === "Maybe, I'm not sure yet"
  ).length

  function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
    if (status === "Yes, I will attend") return "default"
    if (status === "No, I cannot attend") return "destructive"
    return "secondary"
  }

  function getStatusLabel(status: string): string {
    if (status === "Yes, I will attend") return "Attending"
    if (status === "No, I cannot attend") return "Declined"
    if (status === "Maybe, I'm not sure yet") return "Maybe"
    return "Unknown"
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
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col gap-1 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Responses</p>
            <p className="text-2xl font-bold text-foreground">{guests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col gap-1 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Attending</p>
            <p className="text-2xl font-bold text-primary">{attendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col gap-1 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Declined</p>
            <p className="text-2xl font-bold text-destructive">{declinedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col gap-1 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Maybe</p>
            <p className="text-2xl font-bold text-muted-foreground">{maybeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Guest responses table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              Guest Responses
            </CardTitle>
            <CardDescription>
              {guests.length === 0
                ? "No responses yet"
                : `${guests.length} ${guests.length === 1 ? "response" : "responses"} received`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="pt-0">
          {guests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No responses yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share the event link with your guests to start collecting RSVPs.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    {questions
                      .filter((q) => q.id !== "q1" && q.id !== "q2")
                      .map((q) => (
                        <TableHead key={q.id}>{q.text}</TableHead>
                      ))}
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium text-foreground">{guest.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {guest.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(guest.responses["q2"] || "")}>
                          {getStatusLabel(guest.responses["q2"] || "")}
                        </Badge>
                      </TableCell>
                      {questions
                        .filter((q) => q.id !== "q1" && q.id !== "q2")
                        .map((q) => (
                          <TableCell key={q.id} className="text-muted-foreground">
                            {guest.responses[q.id] || "-"}
                          </TableCell>
                        ))}
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(guest.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
