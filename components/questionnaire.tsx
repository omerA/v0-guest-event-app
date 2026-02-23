"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Loader2, Send, CalendarDays, MapPin } from "lucide-react"
import type { Question } from "@/lib/store"

interface QuestionnaireProps {
  questions: Question[]
  event: {
    name: string
    date: string
    location: string
    description: string
  }
}

export function Questionnaire({ questions, event }: QuestionnaireProps) {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function updateResponse(questionId: string, value: string) {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
    setError("")
  }

  async function handleSubmit() {
    // Validate required fields
    const missing = questions.filter(
      (q) => q.required && (!responses[q.id] || !responses[q.id].trim())
    )
    if (missing.length > 0) {
      setError(`Please answer all required questions`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to submit")
        return
      }

      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-lg border-0 shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Thank you!</h2>
            <p className="mt-2 text-muted-foreground">
              Your RSVP has been recorded. We look forward to seeing you at {event.name}.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">{event.name}</CardTitle>
        <CardDescription className="flex flex-col gap-1.5 mt-1">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {event.date}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {event.location}
          </span>
        </CardDescription>
        <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-6 pt-6">
        {questions.map((question, index) => (
          <div key={question.id} className="flex flex-col gap-2.5">
            <Label className="text-sm font-medium text-foreground">
              {index + 1}. {question.text}
              {question.required && <span className="ml-1 text-destructive">*</span>}
            </Label>

            {question.type === "text" && (
              question.id === "q5" ? (
                <Textarea
                  placeholder="Type your answer..."
                  value={responses[question.id] || ""}
                  onChange={(e) => updateResponse(question.id, e.target.value)}
                  className="min-h-20 resize-none"
                />
              ) : (
                <Input
                  placeholder="Type your answer..."
                  value={responses[question.id] || ""}
                  onChange={(e) => updateResponse(question.id, e.target.value)}
                />
              )
            )}

            {question.type === "radio" && question.options && (
              <RadioGroup
                value={responses[question.id] || ""}
                onValueChange={(value) => updateResponse(question.id, value)}
                className="flex flex-col gap-2.5"
              >
                {question.options.map((option) => (
                  <div key={option} className="flex items-center gap-2.5">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <Label
                      htmlFor={`${question.id}-${option}`}
                      className="text-sm font-normal text-foreground cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "select" && question.options && (
              <Select
                value={responses[question.id] || ""}
                onValueChange={(value) => updateResponse(question.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  {question.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-2">
        {error && (
          <p className="text-sm text-destructive text-center w-full">{error}</p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-11 w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit RSVP
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
