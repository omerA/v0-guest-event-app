"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, ArrowRight, Send, Check, Loader2, CalendarPlus, Download } from "lucide-react"
import { googleCalendarUrl, outlookCalendarUrl, generateICSContent } from "@/lib/date-utils"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { QuestionRenderer } from "@/components/question-renderers"
import type { GuestCountValue } from "@/components/question-renderers"
import type { EventPage } from "@/lib/store"
import { getBackgroundStyle } from "@/lib/backgrounds"
import { useLanguage } from "@/components/language-provider"
import { LanguageSwitcher } from "@/components/language-provider"
import { t, getTranslation } from "@/lib/i18n"
import { PhoneInput } from "@/components/phone-input"

type ResponseValue = string | string[] | number | boolean | GuestCountValue

interface RsvpFlowProps {
  eventId: string
  pages: EventPage[]
  fontClass: string
  eventName: string
  eventNameTranslations?: Record<string, string>
  eventDate: string
  eventLocation: string
  eventDescription: string
}

type FlowStep = "phone" | "otp" | "questions" | "complete"

export function RsvpFlow({
  eventId,
  pages,
  fontClass,
  eventName,
  eventNameTranslations,
  eventDate,
  eventLocation,
  eventDescription,
}: RsvpFlowProps) {
  const [step, setStep] = useState<FlowStep>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [demoCode, setDemoCode] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isUpdate, setIsUpdate] = useState(false)

  const { language } = useLanguage()
  const totalPages = pages.length

  const handleSendCode = useCallback(async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, eventId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t(language, "failedToSendCode"))
        return
      }
      if (data._demo_code) setDemoCode(data._demo_code)
      setStep("otp")
    } catch {
      setError(t(language, "somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }, [phone, language])

  const handleVerifyCode = useCallback(
    async (codeOverride?: string) => {
      const codeToVerify = codeOverride || otp
      if (codeToVerify.length < 6) return
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: codeToVerify, eventId }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || t(language, "invalidCode"))
          return
        }
        const token = data.sessionId
        if (token) setSessionToken(token)
        if (data.alreadyResponded) {
          setIsUpdate(true)
          // Pre-populate with existing responses so the attendee can edit
          const existingRes = await fetch("/api/responses", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (existingRes.ok) {
            const existingData = await existingRes.json()
            if (existingData.guest?.responses) {
              setResponses(existingData.guest.responses as Record<string, ResponseValue>)
            }
          }
          setStep("questions")
        } else {
          setStep("questions")
        }
      } catch {
        setError(t(language, "somethingWentWrong"))
      } finally {
        setLoading(false)
      }
    },
    [phone, otp, language]
  )

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ responses }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t(language, "failedToSubmit"))
        return
      }
      setStep("complete")
    } catch {
      setError(t(language, "somethingWentWrong"))
    } finally {
      setLoading(false)
    }
  }, [responses, sessionToken, language])

  const currentQuestions = pages[currentPage]?.questions ?? []

  const canProceed = currentQuestions.every((q) => {
    if (!q.required) return true
    const answer = responses[q.id]
    return answer !== undefined && answer !== "" && !(Array.isArray(answer) && answer.length === 0)
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

  const displayEventName = getTranslation(eventName, eventNameTranslations, language)

  // Get current page title/subtitle in the current language
  const currentPageTitle = pages[currentPage]
    ? getTranslation(pages[currentPage].title, pages[currentPage].titleTranslations, language)
    : ""
  const currentPageSubtitle = pages[currentPage]?.subtitle
    ? getTranslation(pages[currentPage].subtitle!, pages[currentPage].subtitleTranslations, language)
    : undefined

  return (
    <div
      className="flex h-dvh w-full flex-col items-center justify-center overflow-hidden transition-all duration-700"
      style={getStepBackground()}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Language Switcher (top right) */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

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
                <p className="text-sm tracking-[0.2em] font-medium text-white/50 uppercase">{t(language, "rsvpFor")}</p>
                <h1 className={`text-3xl font-bold text-white sm:text-4xl text-balance ${fontClass}`}>
                  {displayEventName}
                </h1>
                <p className="mt-2 text-base text-white/60">{t(language, "enterPhonePrompt")}</p>
              </div>

              <div className="flex w-full max-w-sm flex-col gap-4">
                <PhoneInput onChange={setPhone} onKeyDown={(e) => e.key === "Enter" && handleSendCode()} />
                {error && <p className="text-center text-sm text-red-300">{error}</p>}
                <button
                  onClick={handleSendCode}
                  disabled={loading || !phone.trim()}
                  className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t(language, "sendCode")}
                </button>
              </div>
            </>
          )}

          {/* OTP step */}
          {step === "otp" && (
            <>
              <div className="flex flex-col items-center gap-3 text-center">
                <h2 className={`text-2xl font-bold text-white sm:text-3xl ${fontClass}`}>
                  {t(language, "enterYourCode")}
                </h2>
                <p className="text-base text-white/60">{t(language, "weSentCode")}</p>
                {demoCode && (
                  <div className="mt-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
                    <p className="text-xs text-white/50">{t(language, "demoCode")}</p>
                    <p className="text-2xl font-bold tracking-[0.3em] text-white">{demoCode}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4" dir="ltr">
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
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t(language, "verify")}
                </button>
                <button
                  onClick={() => {
                    setStep("phone")
                    setOtp("")
                    setError("")
                    setDemoCode("")
                  }}
                  className="text-sm text-white/50 transition-colors hover:text-white/80"
                >
                  {t(language, "useDifferentNumber")}
                </button>
              </div>
            </>
          )}

          {/* Question step */}
          {step === "questions" && pages[currentPage] && (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className={`text-3xl font-bold text-white sm:text-4xl text-balance ${fontClass}`}>
                  {currentPageTitle}
                </h2>
                {currentPageSubtitle && <p className="text-base text-white/60">{currentPageSubtitle}</p>}
              </div>

              <div className="flex w-full flex-col items-center gap-6">
                {currentQuestions.map((q) => {
                  const questionLabel = getTranslation(q.label, q.labelTranslations, language)
                  return (
                    <div key={q.id} className="flex w-full flex-col items-center gap-3">
                      <p className="text-lg text-white/80 text-center">
                        {questionLabel}
                        {!q.required && <span className="ml-2 text-sm text-white/40">{t(language, "optional")}</span>}
                      </p>
                      <QuestionRenderer
                        question={q}
                        value={responses[q.id]}
                        language={language}
                        onChange={(val) =>
                          setResponses((prev) => ({
                            ...prev,
                            [q.id]: val,
                          }))
                        }
                      />
                    </div>
                  )
                })}
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
              <h2 className={`text-3xl font-bold text-white sm:text-4xl ${fontClass}`}>{t(language, "thankYou")}</h2>
              <p className="max-w-sm text-base leading-relaxed text-white/70">
                {isUpdate ? t(language, "responseUpdated") : t(language, "responseRecorded")}
              </p>

              {/* Calendar export */}
              {eventDate && (
                <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                  <p className="text-xs tracking-[0.15em] font-medium text-white/40 uppercase">
                    {t(language, "addToCalendar")}
                  </p>
                  <div className="flex w-full flex-col gap-2">
                    <a
                      href={googleCalendarUrl({
                        title: eventName,
                        date: eventDate,
                        location: eventLocation,
                        description: eventDescription,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      {t(language, "googleCalendar")}
                    </a>
                    <a
                      href={outlookCalendarUrl({
                        title: eventName,
                        date: eventDate,
                        location: eventLocation,
                        description: eventDescription,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      {t(language, "outlookCalendar")}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const ics = generateICSContent({
                          title: eventName,
                          date: eventDate,
                          location: eventLocation,
                          description: eventDescription,
                        })
                        if (!ics) return
                        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `${eventName.replace(/\s+/g, "-").toLowerCase()}.ics`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                      {t(language, "appleCalendar")}
                    </button>
                  </div>
                </div>
              )}

              <a
                href={`/event/${eventId}`}
                className="mt-2 inline-flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                {t(language, "backToEvent")}
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
              <ArrowLeft className="h-5 w-5 rtl-flip" />
              {t(language, "back")}
            </button>

            {currentPage < totalPages - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex h-14 items-center gap-2 rounded-2xl bg-white px-8 text-base font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-40"
              >
                {t(language, "next")}
                <ArrowRight className="h-5 w-5 rtl-flip" />
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
                    {t(language, "submit")}
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
