"use client"

import { Check, Minus, Plus, Baby, User, Users } from "lucide-react"
import type { Question } from "@/lib/store"

export interface GuestCountValue {
  babies: number
  children: number
  adults: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyValue = any

interface RendererProps {
  question: Question
  value: AnyValue
  onChange: (val: AnyValue) => void
}

export function QuestionRenderer({ question, value, onChange }: RendererProps) {
  switch (question.type) {
    case "text":
      return <TextRenderer question={question} value={value as string | undefined} onChange={onChange} />
    case "single-choice":
      return <SingleChoiceRenderer question={question} value={value as string | undefined} onChange={onChange} />
    case "multi-choice":
      return <MultiChoiceRenderer question={question} value={value as string[] | undefined} onChange={onChange} />
    case "number":
      return <NumberRenderer question={question} value={value as number | undefined} onChange={onChange} />
    case "yes-no":
      return <YesNoRenderer question={question} value={value as boolean | undefined} onChange={onChange} />
    case "guest-count":
      return <GuestCountRenderer question={question} value={value as GuestCountValue | undefined} onChange={onChange} />
    default:
      return null
  }
}

function TextRenderer({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string | undefined
  onChange: (val: string) => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <label htmlFor={question.id} className="sr-only">
        {question.label}
      </label>
      <input
        id={question.id}
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full max-w-md rounded-2xl border-2 border-white/20 bg-white/10 px-6 py-5 text-center text-xl text-white placeholder-white/30 outline-none backdrop-blur-sm transition-colors focus:border-white/50 focus:bg-white/15"
        autoComplete="off"
      />
    </div>
  )
}

function SingleChoiceRenderer({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string | undefined
  onChange: (val: string) => void
}) {
  const options = question.options ?? []

  return (
    <div
      className="grid w-full max-w-lg gap-3"
      style={{
        gridTemplateColumns: options.length <= 3 ? "1fr" : "repeat(2, 1fr)",
      }}
    >
      {options.map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex min-h-[64px] items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-lg font-medium transition-all active:scale-[0.97] ${
              selected
                ? "border-white bg-white/20 text-white shadow-lg shadow-white/10 backdrop-blur-sm"
                : "border-white/15 bg-white/5 text-white/80 backdrop-blur-sm hover:border-white/30 hover:bg-white/10"
            }`}
          >
            {selected && <Check className="h-5 w-5 shrink-0" />}
            <span>{option}</span>
          </button>
        )
      })}
    </div>
  )
}

function MultiChoiceRenderer({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string[] | undefined
  onChange: (val: string[]) => void
}) {
  const options = question.options ?? []
  const selected = value ?? []

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div
      className="grid w-full max-w-lg gap-3"
      style={{
        gridTemplateColumns: options.length <= 3 ? "1fr" : "repeat(2, 1fr)",
      }}
    >
      {options.map((option) => {
        const isSelected = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`flex min-h-[64px] items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-lg font-medium transition-all active:scale-[0.97] ${
              isSelected
                ? "border-white bg-white/20 text-white shadow-lg shadow-white/10 backdrop-blur-sm"
                : "border-white/15 bg-white/5 text-white/80 backdrop-blur-sm hover:border-white/30 hover:bg-white/10"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                isSelected ? "border-white bg-white/30" : "border-white/30"
              }`}
            >
              {isSelected && <Check className="h-4 w-4 text-white" />}
            </span>
            <span>{option}</span>
          </button>
        )
      })}
    </div>
  )
}

function NumberRenderer({
  question,
  value,
  onChange,
}: {
  question: Question
  value: number | undefined
  onChange: (val: number) => void
}) {
  const min = question.min ?? 0
  const max = question.max ?? 99
  const current = value ?? min

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-8">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, current - 1))}
          disabled={current <= min}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20 active:scale-90 disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:bg-white/10"
          aria-label="Decrease"
        >
          <Minus className="h-6 w-6" />
        </button>

        <span className="min-w-[80px] text-center text-6xl font-light tracking-tight text-white tabular-nums">
          {current}
        </span>

        <button
          type="button"
          onClick={() => onChange(Math.min(max, current + 1))}
          disabled={current >= max}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20 active:scale-90 disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:bg-white/10"
          aria-label="Increase"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
      <p className="text-sm text-white/40">
        {min} - {max} guests
      </p>
    </div>
  )
}

function YesNoRenderer({
  value,
  onChange,
}: {
  question: Question
  value: boolean | undefined
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex w-full max-w-sm gap-4">
      {[
        { label: "Yes", val: true },
        { label: "No", val: false },
      ].map(({ label, val }) => {
        const selected = value === val
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(val)}
            className={`flex flex-1 min-h-[80px] items-center justify-center rounded-2xl border-2 text-2xl font-medium transition-all active:scale-[0.97] ${
              selected
                ? "border-white bg-white/20 text-white shadow-lg shadow-white/10 backdrop-blur-sm"
                : "border-white/15 bg-white/5 text-white/80 backdrop-blur-sm hover:border-white/30 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ---- Guest Count by Age Group (like flights/accommodations) ----

const AGE_GROUPS = [
  { key: "adults" as const, label: "Adults", sublabel: "18+", icon: Users },
  { key: "children" as const, label: "Children", sublabel: "3 - 17", icon: User },
  { key: "babies" as const, label: "Babies", sublabel: "0 - 2", icon: Baby },
]

function GuestCountRenderer({
  value,
  onChange,
}: {
  question: Question
  value: GuestCountValue | undefined
  onChange: (val: GuestCountValue) => void
}) {
  const counts: GuestCountValue = value ?? { babies: 0, children: 0, adults: 0 }

  function update(key: keyof GuestCountValue, delta: number) {
    const next = { ...counts, [key]: Math.max(0, Math.min(10, counts[key] + delta)) }
    onChange(next)
  }

  const total = counts.adults + counts.children + counts.babies

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {AGE_GROUPS.map(({ key, label, sublabel, icon: Icon }) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-2xl border-2 border-white/15 bg-white/5 px-5 py-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10">
              <Icon className="h-5 w-5 text-white/70" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">{label}</p>
              <p className="text-sm text-white/45">{sublabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => update(key, -1)}
              disabled={counts[key] <= 0}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white transition-all hover:border-white/40 hover:bg-white/20 active:scale-90 disabled:opacity-25"
              aria-label={`Decrease ${label}`}
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="min-w-[32px] text-center text-2xl font-light text-white tabular-nums">
              {counts[key]}
            </span>

            <button
              type="button"
              onClick={() => update(key, 1)}
              disabled={counts[key] >= 10}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-white transition-all hover:border-white/40 hover:bg-white/20 active:scale-90 disabled:opacity-25"
              aria-label={`Increase ${label}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <p className="mt-1 text-center text-sm text-white/40">
        {total === 0 ? "No additional guests" : `${total} additional guest${total !== 1 ? "s" : ""}`}
      </p>
    </div>
  )
}
