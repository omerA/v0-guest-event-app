"use client"

import { useState, useEffect } from "react"
import { PhoneAuth } from "@/components/phone-auth"
import { Questionnaire } from "@/components/questionnaire"
import { AlreadyResponded } from "@/components/already-responded"
import { EventHeader } from "@/components/event-header"
import { Loader2 } from "lucide-react"
import type { Question } from "@/lib/store"

type Step = "loading" | "auth" | "questionnaire" | "already-responded"

interface EventData {
  name: string
  date: string
  location: string
  description: string
}

export default function Home() {
  const [step, setStep] = useState<Step>("loading")
  const [event, setEvent] = useState<EventData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch("/api/questions")
        const data = await res.json()
        setEvent(data.event)
        setQuestions(data.questions)
        setStep("auth")
      } catch {
        setStep("auth")
      }
    }
    loadEvent()
  }, [])

  function handleAuthenticated(alreadyResponded: boolean) {
    if (alreadyResponded) {
      setStep("already-responded")
    } else {
      setStep("questionnaire")
    }
  }

  const eventName = event?.name || "Event"

  return (
    <main className="flex min-h-svh flex-col items-center bg-background px-4 pb-12">
      <div className="w-full max-w-lg">
        <EventHeader eventName={eventName} />
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center">
        {step === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading event details...</p>
          </div>
        )}

        {step === "auth" && (
          <PhoneAuth onAuthenticated={handleAuthenticated} eventName={eventName} />
        )}

        {step === "questionnaire" && event && (
          <Questionnaire questions={questions} event={event} />
        )}

        {step === "already-responded" && (
          <AlreadyResponded eventName={eventName} />
        )}
      </div>

      <footer className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          {"Event organizer? "}
          <a href="/admin" className="text-primary underline-offset-4 hover:underline">
            View responses
          </a>
        </p>
      </footer>
    </main>
  )
}
