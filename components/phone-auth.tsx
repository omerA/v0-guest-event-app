"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Phone, ArrowRight, Loader2 } from "lucide-react"

interface PhoneAuthProps {
  onAuthenticated: (alreadyResponded: boolean) => void
  eventName: string
}

export function PhoneAuth({ onAuthenticated, eventName }: PhoneAuthProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [demoCode, setDemoCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSendCode() {
    if (!phone.trim()) {
      setError("Please enter your phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, "") }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to send code")
        return
      }

      // Store demo code for display
      if (data._demo_code) {
        setDemoCode(data._demo_code)
      }

      setStep("otp")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(code: string) {
    if (code.length !== 6) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ""), code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid code")
        setOtp("")
        return
      }

      onAuthenticated(data.alreadyResponded)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl font-semibold text-foreground">
          {step === "phone" ? "Verify your identity" : "Enter verification code"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {step === "phone"
            ? `Enter your phone number to RSVP for ${eventName}`
            : `We sent a 6-digit code to ${phone}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "phone" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                className="h-11"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              onClick={handleSendCode}
              disabled={loading || !phone.trim()}
              className="h-11 w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Send code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {demoCode && (
              <div className="rounded-lg bg-primary/5 p-3 text-center border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Demo mode - your code is:</p>
                <p className="text-lg font-mono font-bold tracking-widest text-primary">{demoCode}</p>
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <Label className="text-sm font-medium text-foreground sr-only">
                Verification code
              </Label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value)
                  setError("")
                  if (value.length === 6) {
                    handleVerifyCode(value)
                  }
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && (
              <p className="text-sm text-center text-destructive">{error}</p>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setStep("phone")
                setOtp("")
                setDemoCode("")
                setError("")
              }}
              className="text-sm text-muted-foreground"
            >
              Use a different number
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
