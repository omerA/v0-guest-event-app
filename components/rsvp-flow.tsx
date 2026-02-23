"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, ArrowRight, Send, Check, Loader2 } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { QuestionRenderer } from "@/components/question-renderers"
import type { GuestCountValue } from "@/components/question-renderers"
import type { EventPage } from "@/lib/store"
import { getBackgroundStyle } from "@/lib/backgrounds"

type ResponseValue = string | string[] | number | boolean | GuestCountValue

interface RsvpFlowProps {
  pages: EventPage[]
  fontClass: string
  eventName: string
}

type FlowStep = "phone" | "otp" | "questions" | "complete"

export function RsvpFlow({ pages, fontClass, eventName }: RsvpFlowProps) {
  const [step, setStep] = useState<FlowStep>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [demoCode, setDemoCode] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const totalPages = pages.length

  const handleSendCode = useCallback(async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send code")
        return
      }
      if (data._demo_code) setDemoCode(data._demo_code)
      setStep("otp")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [phone])

  const handleVerifyCode = useCallback(async (codeOverride?: string) => {
    const codeToVerify = codeOverride || otp
    if (codeToVerify.length < 6) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: codeToVerify }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Invalid code")
        return
      }
      if (data.sessionId) {
        setSessionToken(data.sessionId)
      }
      if (data.alreadyResponded) {
        setStep("complete")
      } else {
        setStep("questions")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [phone, otp])

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ responses }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to submit")
        return
      }
      setStep("complete")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [responses, sessionToken])

  const currentQuestions = pages[currentPage]?.questions ?? []

  const canProceed = currentQuestions.every((q) => {
    if (!q.required) return true
    const answer = responses[q.id]
    return (
      answer !== undefined &&
      answer !== "" &&
      !(Array.isArray(answer) && answer.length === 0)
    )
  })

  function handleNext() {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1)
    } else {
      handleSubmit()
    }
  }

  function handleBack() {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1)
    }
  }

  // Background for current step
  function getStepBackground(): React.CSSProperties {
    if (step === "phone" || step === "otp") {
      return { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }
    }
    if (step === "complete") {
      return { background: "linear-gradient(135deg, #134e5e 0%, #3a8f6a 50%, #71b280 100%)" }
    }
    if (step === "questions" && pages[currentPage]) {
      return getBackgroundStyle(pages[currentPage].backgroundId, pages[currentPage].backgroundImageUrl)
    }
    return { background: "#1a1a2e" }
  }

  return (
    <div
      className="flex h-dvh w-full flex-col items-center justify-center overflow-hidden transition-all duration-700"
      style={getStepBackground()}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full w-full max-w-xl flex-col items-center justify-between px-6 py-8 sm:py-12">
        {/* Progress indicator */}
        {step === "questions" && (
          <div className="flex w-full items-center gap-2">
            {pages.map((_, i) => (
              <div
                key={pages[i].id}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= currentPage ? "bg-white/80" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}

        {step !== "questions" && <div />}

        {/* Main content area */}
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-8">
          {/* Phone step */}
          {step === "phone" && (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm tracking-[0.2em] font-medium text-white/50 uppercase">
                  RSVP for
                </p>
                <h1 className={`text-3xl font-bold text-white sm:text-4xl text-balance ${fontClass}`}>
                  {eventName}
                </h1>
                <p className="mt-2 text-base text-white/60">
                  Enter your phone number to get started
                </p>
              </div>

              <div className="flex w-full max-w-sm flex-col gap-4">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-2xl border-2 border-white/20 bg-white/10 px-6 py-5 text-center text-xl text-white placeholder-white/30 outline-none backdrop-blur-sm transition-colors focus:border-white/50 focus:bg-white/15"
                  autoComplete="tel"
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                />
                {error && <p className="text-center text-sm text-red-300">{error}</p>}
                <button
                  onClick={handleSendCode}
                  disabled={loading || !phone.trim()}
                  className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Code"}
                </button>
              </div>
            </>
          )}

          {/* OTP step */}
          {step === "otp" && (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <h2 className={`text-2xl font-bold text-white sm:text-3xl ${fontClass}`}>
                  Enter Your Code
                </h2>
                <p className="text-base text-white/60">
                  {"We sent a 6-digit code to your phone"}
                </p>
                {demoCode && (
                  <div className="mt-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
                    <p className="text-xs text-white/50">Demo code</p>
                    <p className="text-2xl font-bold tracking-[0.3em] text-white">{demoCode}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  onComplete={(value) => handleVerifyCode(value)}
                  containerClassName="gap-3"
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="!h-14 !w-12 !rounded-xl !border-2 !border-white/20 bg-white/10 text-xl text-white backdrop-blur-sm sm:!h-16 sm:!w-14"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {error && <p className="text-center text-sm text-red-300">{error}</p>}
                <button
                  onClick={() => handleVerifyCode()}
                  disabled={loading || otp.length < 6}
                  className="flex min-h-[56px] w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                </button>
                <button
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); setDemoCode("") }}
                  className="text-sm text-white/50 transition-colors hover:text-white/80"
                >
                  Use a different number
                </button>
              </div>
            </>
          )}

          {/* Question step */}
          {step === "questions" && pages[currentPage] && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className={`text-3xl font-bold text-white sm:text-4xl text-balance ${fontClass}`}>
                  {pages[currentPage].title}
                </h2>
                {pages[currentPage].subtitle && (
                  <p className="text-base text-white/60">{pages[currentPage].subtitle}</p>
                )}
              </div>

              <div className="flex w-full flex-col items-center gap-6">
                {currentQuestions.map((q) => (
                  <div key={q.id} className="flex w-full flex-col items-center gap-3">
                    <p className="text-lg text-white/80 text-center">
                      {q.label}
                      {!q.required && (
                        <span className="ml-2 text-sm text-white/40">(optional)</span>
                      )}
                    </p>
                    <QuestionRenderer
                      question={q}
                      value={responses[q.id]}
                      onChange={(val) =>
                        setResponses((prev) => ({
                          ...prev,
                          [q.id]: val,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              {error && <p className="text-center text-sm text-red-300">{error}</p>}
            </>
          )}

          {/* Complete step */}
          {step === "complete" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/15 backdrop-blur-sm">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className={`text-3xl font-bold text-white sm:text-4xl ${fontClass}`}>
                Thank You
              </h2>
              <p className="max-w-sm text-base leading-relaxed text-white/70">
                Your response has been recorded. We look forward to seeing you at the event.
              </p>
              <a
                href="/"
                className="mt-4 inline-flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Back to Event
              </a>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {step === "questions" && (
          <div className="flex w-full items-center justify-between pt-4">
            <button
              onClick={handleBack}
              disabled={currentPage === 0}
              className="flex h-14 items-center gap-2 rounded-2xl border-2 border-white/15 bg-white/5 px-6 text-base font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 active:scale-[0.97] disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            {currentPage < totalPages - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex h-14 items-center gap-2 rounded-2xl bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-40"
              >
                Next
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed || loading}
                className="flex h-14 items-center gap-2 rounded-2xl bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Submit
                    <Send className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {step !== "questions" && <div />}
      </div>
    </div>
  )
}
