"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Loader2,
  Save,
  Check,
  Settings,
  Layout,
  Users,
  Bell,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Calendar,
  X,
} from "lucide-react"
import { MediaPicker } from "@/components/media-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarWidget } from "@/components/ui/calendar"
import type { EventConfig, EventPage, QuestionType, Guest } from "@/lib/store"
import { BACKGROUND_GALLERY, FONT_OPTIONS } from "@/lib/store"
import { SUPPORTED_LANGUAGES, DRESS_CODES } from "@/lib/i18n"
import { getFontStyle } from "@/lib/fonts"
import { formatEventDateShort } from "@/lib/date-utils"
import { parseISO, isValid, format } from "date-fns"

// ---- Timezone options ----
const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "America/New_York", label: "New York (ET, UTC−5/−4)" },
  { value: "America/Chicago", label: "Chicago (CT, UTC−6/−5)" },
  { value: "America/Denver", label: "Denver (MT, UTC−7/−6)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT, UTC−8/−7)" },
  { value: "America/Anchorage", label: "Anchorage (AKT, UTC−9/−8)" },
  { value: "Pacific/Honolulu", label: "Honolulu (HST, UTC−10)" },
  { value: "America/Toronto", label: "Toronto (ET, UTC−5/−4)" },
  { value: "America/Vancouver", label: "Vancouver (PT, UTC−8/−7)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT, UTC−3)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART, UTC−3)" },
  { value: "America/Mexico_City", label: "Mexico City (CST, UTC−6/−5)" },
  { value: "Europe/London", label: "London (GMT/BST, UTC+0/+1)" },
  { value: "Europe/Paris", label: "Paris (CET, UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Berlin (CET, UTC+1/+2)" },
  { value: "Europe/Rome", label: "Rome (CET, UTC+1/+2)" },
  { value: "Europe/Madrid", label: "Madrid (CET, UTC+1/+2)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET, UTC+1/+2)" },
  { value: "Europe/Moscow", label: "Moscow (MSK, UTC+3)" },
  { value: "Africa/Cairo", label: "Cairo (EET, UTC+2)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)" },
  { value: "Africa/Lagos", label: "Lagos (WAT, UTC+1)" },
  { value: "Asia/Jerusalem", label: "Jerusalem (IST, UTC+2/+3)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Kolkata", label: "Mumbai / Kolkata (IST, UTC+5:30)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST, UTC+6)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT, UTC+7)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST, UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)" },
  { value: "Asia/Seoul", label: "Seoul (KST, UTC+9)" },
  { value: "Australia/Sydney", label: "Sydney (AEST, UTC+10/+11)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST, UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST, UTC+12/+13)" },
]

function getPageBgPreview(backgroundId: string, imageUrl?: string): React.CSSProperties {
  if (imageUrl) return { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
  const bg = BACKGROUND_GALLERY.find((b) => b.id === backgroundId)
  if (!bg || bg.type === "none") return { backgroundColor: "#f3f3f3" }
  if (bg.type === "gradient") return { background: bg.value }
  if (bg.type === "image") return { backgroundImage: `url(${bg.value})`, backgroundSize: "cover" }
  return {}
}

// ---- Date Time Picker ----
function DateTimePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const date = value ? parseISO(value) : undefined
  const isDateValid = date && isValid(date)
  const timeValue = isDateValid ? format(date, "HH:mm") : "19:00"

  function toLocalIso(d: Date): string {
    return format(d, "yyyy-MM-dd'T'HH:mm:ss")
  }

  function handleDateSelect(newDate: Date | undefined) {
    if (!newDate) return
    const [hours, minutes] = timeValue.split(":").map(Number)
    newDate.setHours(hours, minutes, 0, 0)
    onChange(toLocalIso(newDate))
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [hours, minutes] = e.target.value.split(":").map(Number)
    if (isDateValid) {
      const updated = new Date(date)
      updated.setHours(hours, minutes, 0, 0)
      onChange(toLocalIso(updated))
    } else {
      const now = new Date()
      now.setHours(hours, minutes, 0, 0)
      onChange(toLocalIso(now))
    }
  }

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex h-9 flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors hover:bg-accent ${isDateValid ? "text-foreground" : "text-muted-foreground"}`}
          >
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            {isDateValid ? format(date, "EEEE, MMMM d, yyyy") : "Pick a date"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarWidget
            mode="single"
            selected={isDateValid ? date : undefined}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
      />
    </div>
  )
}

// ---- Options Editor ----
function OptionsEditor({ options, onChange }: { options: string[]; onChange: (opts: string[]) => void }) {
  function updateOption(index: number, value: string) {
    const next = [...options]
    next[index] = value
    onChange(next)
  }
  function addOption() {
    onChange([...options, `Option ${options.length + 1}`])
  }
  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs">Options</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} className="flex-1" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removeOption(i)}
            disabled={options.length <= 1}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addOption} className="mt-1 w-fit gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add Option
      </Button>
    </div>
  )
}

// ---- Page Editor ----
function PageEditor({
  page,
  onChange,
  nonDefaultLanguages = [],
}: {
  page: EventPage
  onChange: (updates: Partial<EventPage>) => void
  nonDefaultLanguages?: string[]
}) {
  function updateQuestion(qIndex: number, field: string, value: string | string[] | number | boolean) {
    const newQuestions = page.questions.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q))
    onChange({ questions: newQuestions })
  }

  function updateQuestionTranslation(
    qIndex: number,
    field: "labelTranslations" | "descriptionTranslations",
    lang: string,
    value: string
  ) {
    const q = page.questions[qIndex]
    const existing = (q[field] as Record<string, string>) ?? {}
    const newQuestions = page.questions.map((qq, i) =>
      i === qIndex ? { ...qq, [field]: { ...existing, [lang]: value } } : qq
    )
    onChange({ questions: newQuestions })
  }

  function updateOptionTranslation(qIndex: number, lang: string, optIdx: number, value: string) {
    const q = page.questions[qIndex]
    const existing: Record<string, string[]> = (q.optionsTranslations as Record<string, string[]>) ?? {}
    const currentLangOpts = existing[lang] ? [...existing[lang]] : [...(q.options ?? [])]
    currentLangOpts[optIdx] = value
    const newQuestions = page.questions.map((qq, i) =>
      i === qIndex ? { ...qq, optionsTranslations: { ...existing, [lang]: currentLangOpts } } : qq
    )
    onChange({ questions: newQuestions })
  }

  function updatePageTranslation(field: "titleTranslations" | "subtitleTranslations", lang: string, value: string) {
    const existing = (page[field] as Record<string, string>) ?? {}
    onChange({ [field]: { ...existing, [lang]: value } })
  }

  function updateQuestionType(qIndex: number, val: QuestionType) {
    const q = page.questions[qIndex]
    const newQ = {
      ...q,
      type: val,
      options: val === "single-choice" || val === "multi-choice" ? (q.options ?? ["Option 1", "Option 2"]) : undefined,
      min: val === "number" ? 0 : undefined,
      max: val === "number" ? 10 : undefined,
    }
    const newQuestions = page.questions.map((qq, i) => (i === qIndex ? newQ : qq))
    onChange({ questions: newQuestions })
  }

  function addQuestion() {
    onChange({
      questions: [...page.questions, { id: `q-${Date.now()}`, type: "text", label: "New question", required: true }],
    })
  }

  function removeQuestion(qIndex: number) {
    if (page.questions.length <= 1) return
    onChange({ questions: page.questions.filter((_, i) => i !== qIndex) })
  }

  return (
    <div className="mt-4 flex flex-col gap-5 border-t border-border pt-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Page Title</Label>
          <Input value={page.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Your Name" />
          {nonDefaultLanguages.map((lang) => {
            const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
            return (
              <div key={lang} className="flex flex-col gap-0.5">
                <Label className="text-[10px] text-muted-foreground">Title in {langInfo?.nativeLabel ?? lang}</Label>
                <Input
                  dir={langInfo?.rtl ? "rtl" : "ltr"}
                  className="text-xs"
                  value={(page.titleTranslations as Record<string, string>)?.[lang] ?? ""}
                  onChange={(e) => updatePageTranslation("titleTranslations", lang, e.target.value)}
                  placeholder={`Title in ${langInfo?.nativeLabel ?? lang}...`}
                />
              </div>
            )
          })}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Subtitle</Label>
          <Input
            value={page.subtitle ?? ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Let us know who you are"
          />
          {nonDefaultLanguages.map((lang) => {
            const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
            return (
              <div key={lang} className="flex flex-col gap-0.5">
                <Label className="text-[10px] text-muted-foreground">
                  Subtitle in {langInfo?.nativeLabel ?? lang}
                </Label>
                <Input
                  dir={langInfo?.rtl ? "rtl" : "ltr"}
                  className="text-xs"
                  value={(page.subtitleTranslations as Record<string, string>)?.[lang] ?? ""}
                  onChange={(e) => updatePageTranslation("subtitleTranslations", lang, e.target.value)}
                  placeholder={`Subtitle in ${langInfo?.nativeLabel ?? lang}...`}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Questions ({page.questions.length})</Label>
          <Button variant="outline" size="sm" onClick={addQuestion} className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" />
            Add Question
          </Button>
        </div>

        {page.questions.map((q, qIndex) => (
          <div key={q.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <Input
                  value={q.label}
                  onChange={(e) => updateQuestion(qIndex, "label", e.target.value)}
                  placeholder="What is your full name?"
                  className="text-sm"
                />
                {nonDefaultLanguages.map((lang) => {
                  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
                  return (
                    <Input
                      key={lang}
                      dir={langInfo?.rtl ? "rtl" : "ltr"}
                      value={(q.labelTranslations as Record<string, string>)?.[lang] ?? ""}
                      onChange={(e) => updateQuestionTranslation(qIndex, "labelTranslations", lang, e.target.value)}
                      placeholder={`Question in ${langInfo?.nativeLabel ?? lang}...`}
                      className="text-xs text-muted-foreground"
                    />
                  )
                })}
              </div>
              {page.questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeQuestion(qIndex)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">Type</Label>
                <Select value={q.type} onValueChange={(val: QuestionType) => updateQuestionType(qIndex, val)}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="single-choice">Single Choice (Boxes)</SelectItem>
                    <SelectItem value="multi-choice">Multi Choice (Boxes)</SelectItem>
                    <SelectItem value="number">Number Stepper</SelectItem>
                    <SelectItem value="yes-no">Yes / No</SelectItem>
                    <SelectItem value="guest-count">Guest Count (Age Groups)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">Required</Label>
                <div className="flex h-8 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qIndex, "required", !q.required)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${q.required ? "bg-primary" : "bg-muted-foreground/30"}`}
                    role="switch"
                    aria-checked={q.required}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${q.required ? "translate-x-4" : "translate-x-0"}`}
                    />
                  </button>
                  <span className="text-xs text-muted-foreground">{q.required ? "Required" : "Optional"}</span>
                </div>
              </div>
            </div>

            {(q.type === "single-choice" || q.type === "multi-choice") && (
              <>
                <OptionsEditor options={q.options ?? []} onChange={(opts) => updateQuestion(qIndex, "options", opts)} />
                {nonDefaultLanguages.map((lang) => {
                  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
                  const options = q.options ?? []
                  const currentTranslations = (q.optionsTranslations as Record<string, string[]>)?.[lang] ?? []
                  return (
                    <div key={lang} className="flex flex-col gap-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Options in {langInfo?.nativeLabel ?? lang}
                      </Label>
                      {options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 truncate">{opt} →</span>
                          <Input
                            dir={langInfo?.rtl ? "rtl" : "ltr"}
                            className="flex-1 text-xs"
                            value={currentTranslations[optIdx] ?? ""}
                            onChange={(e) => updateOptionTranslation(qIndex, lang, optIdx, e.target.value)}
                            placeholder={`${opt} in ${langInfo?.nativeLabel ?? lang}...`}
                          />
                        </div>
                      ))}
                    </div>
                  )
                })}
              </>
            )}

            {q.type === "number" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    value={q.min ?? 0}
                    onChange={(e) => updateQuestion(qIndex, "min", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    value={q.max ?? 10}
                    onChange={(e) => updateQuestion(qIndex, "max", parseInt(e.target.value) || 10)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Separator />
      <div className="flex flex-col gap-3">
        <Label className="text-xs">Page Background</Label>
        <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
          {BACKGROUND_GALLERY.map((bg) => {
            const selected = page.backgroundId === bg.id && !page.backgroundImageUrl
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => onChange({ backgroundId: bg.id, backgroundImageUrl: undefined })}
                className={`group relative flex h-10 w-full items-center justify-center rounded-lg border-2 bg-cover bg-center transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
                style={
                  bg.type === "gradient"
                    ? { background: bg.value }
                    : bg.type === "image"
                      ? { backgroundImage: `url(${bg.value})`, backgroundSize: "cover" }
                      : { background: "#f3f3f3" }
                }
                title={bg.label}
                aria-label={bg.label}
              >
                {bg.type === "none" && <X className="h-3 w-3 text-muted-foreground" />}
                {selected && bg.type !== "none" && <Check className="h-3 w-3 text-white drop-shadow-md" />}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-muted-foreground">Or choose a custom image</Label>
          <MediaPicker
            accept="image"
            value={page.backgroundImageUrl}
            onSelect={(url) => onChange({ backgroundImageUrl: url, backgroundId: "custom" })}
            onClear={() =>
              onChange({
                backgroundImageUrl: undefined,
                backgroundId: page.backgroundId === "custom" ? "none" : page.backgroundId,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

// ---- Page Builder Tab ----
function PageBuilderTab({ config, setConfig }: { config: EventConfig; setConfig: (c: EventConfig) => void }) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const nonDefaultLanguages = (config.supportedLanguages ?? ["en"]).filter(
    (l) => l !== (config.defaultLanguage ?? "en")
  )

  function addPage() {
    const newPage: EventPage = {
      id: `page-${Date.now()}`,
      title: "New Page",
      subtitle: "",
      questions: [{ id: `q-${Date.now()}`, type: "text", label: "Your question here", required: true }],
      backgroundId: "none",
    }
    setConfig({ ...config, pages: [...config.pages, newPage] })
    setEditingPageId(newPage.id)
  }

  function removePage(pageId: string) {
    setConfig({ ...config, pages: config.pages.filter((p) => p.id !== pageId) })
    if (editingPageId === pageId) setEditingPageId(null)
  }

  function updatePage(pageId: string, updates: Partial<EventPage>) {
    setConfig({ ...config, pages: config.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)) })
  }

  function movePage(index: number, direction: -1 | 1) {
    const newPages = [...config.pages]
    const target = index + direction
    if (target < 0 || target >= newPages.length) return
    ;[newPages[index], newPages[target]] = [newPages[target], newPages[index]]
    setConfig({ ...config, pages: newPages })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">RSVP Pages</h3>
          <p className="text-xs text-muted-foreground">Each page shows one question. Guests see them in order.</p>
        </div>
        <Button onClick={addPage} size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Page
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {config.pages.map((page, index) => (
          <Card
            key={page.id}
            className={`border shadow-sm transition-all ${editingPageId === page.id ? "border-primary" : "border-border"}`}
          >
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => movePage(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                    aria-label="Move up"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 10 6" fill="none">
                      <path
                        d="M1 5l4-4 4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => movePage(index, 1)}
                    disabled={index === config.pages.length - 1}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                    aria-label="Move down"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 10 6" fill="none">
                      <path
                        d="M1 1l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center"
                  style={getPageBgPreview(page.backgroundId, page.backgroundImageUrl)}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{page.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {page.questions.length === 1
                      ? `${page.questions[0].type} - ${page.questions[0].label}`
                      : `${page.questions.length} questions`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingPageId(editingPageId === page.id ? null : page.id)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removePage(page.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {editingPageId === page.id && (
                <PageEditor
                  page={page}
                  onChange={(updates) => updatePage(page.id, updates)}
                  nonDefaultLanguages={nonDefaultLanguages}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {config.pages.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Layout className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No pages yet. Add your first question page.</p>
            <Button onClick={addPage} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Page
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---- Slug status ----
type SlugStatus = "idle" | "checking" | "available" | "taken" | "same"

// ---- Event Settings Tab ----
function EventSettingsTab({
  config,
  setConfig,
  currentEventId,
  onRenameSuccess,
}: {
  config: EventConfig
  setConfig: (c: EventConfig) => void
  currentEventId: string
  onRenameSuccess: (newEventId: string) => void
}) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle")
  const [previewSlug, setPreviewSlug] = useState("")
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const name = config.name.trim()
    if (!name || name.length < 2) {
      setSlugStatus("idle")
      setPreviewSlug("")
      return
    }
    setSlugStatus("checking")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/events/check-name?name=${encodeURIComponent(name)}&currentEventId=${encodeURIComponent(currentEventId)}`
        )
        if (!res.ok) { setSlugStatus("idle"); return }
        const data: { available: boolean; slug: string } = await res.json()
        setPreviewSlug(data.slug)
        if (data.slug === currentEventId) setSlugStatus("same")
        else setSlugStatus(data.available ? "available" : "taken")
      } catch {
        setSlugStatus("idle")
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [config.name, currentEventId])

  async function handleRename() {
    setRenaming(true)
    try {
      const res = await fetch("/api/events/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentEventId, newName: config.name.trim() }),
      })
      if (res.ok) {
        const data: { newEventId: string } = await res.json()
        setShowRenameDialog(false)
        onRenameSuccess(data.newEventId)
      }
    } catch { /* ignore */ } finally {
      setRenaming(false)
    }
  }

  function update(field: keyof EventConfig, value: string) {
    setConfig({ ...config, [field]: value })
  }

  function updateTranslation(
    field: "nameTranslations" | "locationTranslations" | "descriptionTranslations",
    lang: string,
    value: string
  ) {
    const existing = (config[field] as Record<string, string>) ?? {}
    setConfig({ ...config, [field]: { ...existing, [lang]: value } })
  }

  function toggleLanguage(code: string) {
    const current = config.supportedLanguages ?? ["en"]
    if (code === "en") return
    const next = current.includes(code) ? current.filter((l) => l !== code) : [...current, code]
    const newDefault = next.includes(config.defaultLanguage) ? config.defaultLanguage : "en"
    setConfig({ ...config, supportedLanguages: next, defaultLanguage: newDefault })
  }

  const nonDefaultLanguages = (config.supportedLanguages ?? ["en"]).filter(
    (l) => l !== (config.defaultLanguage ?? "en")
  )

  return (
    <>
      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename event and change URL?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <p>
                  Renaming will change the public URL from{" "}
                  <span className="font-mono font-medium text-foreground">/event/{currentEventId}</span> to{" "}
                  <span className="font-mono font-medium text-foreground">/event/{previewSlug}</span>.
                </p>
                <p>Any existing links to the old URL will stop working.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={renaming}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename} disabled={renaming} className="gap-1.5">
              {renaming && <Loader2 className="h-4 w-4 animate-spin" />}
              Rename &amp; Change URL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
            <CardDescription>Configure the basic information for your event</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={config.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Annual Gathering 2026"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <LinkIcon className="h-3 w-3 shrink-0" />
                  <span className="font-mono">/event/{previewSlug || currentEventId}</span>
                  {slugStatus === "checking" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {slugStatus === "available" && (
                    <Badge variant="outline" className="border-green-500 text-green-600 text-[10px] px-1.5 py-0">
                      available
                    </Badge>
                  )}
                  {slugStatus === "taken" && (
                    <Badge variant="outline" className="border-red-400 text-red-500 text-[10px] px-1.5 py-0">
                      taken
                    </Badge>
                  )}
                </div>
                {slugStatus === "available" && previewSlug !== currentEventId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs border-amber-400 text-amber-600 hover:bg-amber-50"
                    onClick={() => setShowRenameDialog(true)}
                  >
                    <LinkIcon className="h-3 w-3" />
                    Rename &amp; Change URL
                  </Button>
                )}
              </div>
              {nonDefaultLanguages.map((lang) => {
                const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
                return (
                  <div key={lang} className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Event Name in {langInfo?.nativeLabel ?? lang}
                    </Label>
                    <Input
                      dir={langInfo?.rtl ? "rtl" : "ltr"}
                      value={(config.nameTranslations as Record<string, string>)?.[lang] ?? ""}
                      onChange={(e) => updateTranslation("nameTranslations", lang, e.target.value)}
                      placeholder={`Event name in ${langInfo?.nativeLabel ?? lang}...`}
                    />
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Date &amp; Time</Label>
                <DateTimePicker value={config.date} onChange={(val) => update("date", val)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={config.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="The Grand Hall"
                />
                {nonDefaultLanguages.map((lang) => {
                  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
                  return (
                    <div key={lang} className="flex flex-col gap-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Location in {langInfo?.nativeLabel ?? lang}
                      </Label>
                      <Input
                        dir={langInfo?.rtl ? "rtl" : "ltr"}
                        value={(config.locationTranslations as Record<string, string>)?.[lang] ?? ""}
                        onChange={(e) => updateTranslation("locationTranslations", lang, e.target.value)}
                        placeholder={`Location in ${langInfo?.nativeLabel ?? lang}...`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:max-w-[calc(66.666%_-_0.5rem)]">
              <Label htmlFor="event-timezone">Timezone</Label>
              <Select value={config.timezone ?? "UTC"} onValueChange={(val) => update("timezone", val)}>
                <SelectTrigger id="event-timezone" className="h-9">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="event-desc">Description</Label>
              <textarea
                id="event-desc"
                value={config.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                placeholder="Event description..."
              />
              {nonDefaultLanguages.map((lang) => {
                const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang)
                return (
                  <div key={lang} className="flex flex-col gap-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Description in {langInfo?.nativeLabel ?? lang}
                    </Label>
                    <textarea
                      dir={langInfo?.rtl ? "rtl" : "ltr"}
                      value={(config.descriptionTranslations as Record<string, string>)?.[lang] ?? ""}
                      onChange={(e) => updateTranslation("descriptionTranslations", lang, e.target.value)}
                      rows={2}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                      placeholder={`Description in ${langInfo?.nativeLabel ?? lang}...`}
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="event-dresscode">Dress Code</Label>
              <Select
                value={config.dressCode ?? "none"}
                onValueChange={(val) => setConfig({ ...config, dressCode: val })}
              >
                <SelectTrigger id="event-dresscode" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRESS_CODES.map((dc) => (
                    <SelectItem key={dc.id} value={dc.id}>
                      {dc.translations.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Label>Hero Media</Label>
              <MediaPicker
                accept="any"
                value={config.heroMediaUrl || undefined}
                valueType={(config.heroMediaType as "image" | "video") || undefined}
                onSelect={(url, type) => setConfig({ ...config, heroMediaUrl: url, heroMediaType: type })}
                onClear={() => update("heroMediaUrl", "")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Event Font</CardTitle>
            <CardDescription>Choose a display font for the guest-facing event pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FONT_OPTIONS.map((font) => {
                const selected = config.fontFamily === font.id
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setConfig({ ...config, fontFamily: font.id })}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"}`}
                  >
                    <span className="text-2xl text-foreground" style={{ fontFamily: getFontStyle(font.id) }}>
                      {config.name || "Event Name"}
                    </span>
                    <span className="text-xs text-muted-foreground">{font.label}</span>
                    {selected && <Badge variant="default" className="text-xs">Selected</Badge>}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Languages</CardTitle>
            <CardDescription>Choose which languages guests can use</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <Label>Supported Languages</Label>
              <div className="flex flex-wrap gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isEnabled = (config.supportedLanguages ?? ["en"]).includes(lang.code)
                  const isEnglish = lang.code === "en"
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      disabled={isEnglish}
                      className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${isEnabled ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"} ${isEnglish ? "cursor-default opacity-70" : ""}`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${isEnabled ? "border-primary bg-primary" : "border-muted-foreground"}`}
                      >
                        {isEnabled && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </span>
                      <span>{lang.nativeLabel}</span>
                      <span className="text-xs text-muted-foreground">{lang.label}</span>
                      {lang.rtl && <Badge variant="outline" className="text-[10px] px-1.5 py-0">RTL</Badge>}
                    </button>
                  )
                })}
              </div>
            </div>
            {(config.supportedLanguages ?? ["en"]).length > 1 && (
              <div className="flex flex-col gap-2">
                <Label>Default Language</Label>
                <Select
                  value={config.defaultLanguage ?? "en"}
                  onValueChange={(val) => setConfig({ ...config, defaultLanguage: val })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(config.supportedLanguages ?? ["en"]).map((code) => {
                      const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === code)
                      return (
                        <SelectItem key={code} value={code}>
                          {langInfo?.nativeLabel ?? code} ({langInfo?.label ?? code})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// ---- Responses Tab ----
function formatResponseValue(val: unknown): string {
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

function ResponsesTab({
  guests,
  config,
  onRefresh,
}: {
  guests: Guest[]
  config: EventConfig
  onRefresh: () => void
}) {
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  const allQuestions = config.pages.flatMap((p) => p.questions)
  const attendanceQuestion = allQuestions.find((q) => q.type === "yes-no" || q.id === "q-attendance")
  const attQid = attendanceQuestion?.id
  const attendingCount = attQid
    ? guests.filter((g) => g.responses[attQid] === true || g.responses[attQid] === "Yes").length
    : 0
  const declinedCount = attQid
    ? guests.filter((g) => g.responses[attQid] === false || g.responses[attQid] === "No").length
    : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col gap-1 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</p>
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
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Guest Responses</CardTitle>
            <CardDescription>
              {guests.length === 0
                ? "No responses yet"
                : `${guests.length} ${guests.length === 1 ? "response" : "responses"} received`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <Loader2 className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : "hidden"}`} />
            Refresh
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="pt-0">
          {guests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">No responses yet</p>
              <p className="text-sm text-muted-foreground">Share the event link with your guests.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Phone</th>
                    {allQuestions.map((q) => (
                      <th key={q.id} className="pb-2 text-left font-medium text-muted-foreground">
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
                          {formatResponseValue(guest.responses[q.id])}
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

// ---- Main Event Editor Page ----
export default function EventEditorPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [config, setConfig] = useState<EventConfig | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [configRes, guestsRes] = await Promise.all([
        fetch(`/api/owner/events/${eventId}`),
        fetch(`/api/owner/events/${eventId}/guests`),
      ])
      if (configRes.ok) setConfig(await configRes.json())
      if (guestsRes.ok) {
        const data = await guestsRes.json()
        setGuests(data.guests)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])

  const saveConfig = useCallback(async () => {
    if (!config) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/owner/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }, [config, eventId])

  function handleRenameSuccess(newEventId: string) {
    window.location.href = `/dashboard/events/${newEventId}`
  }

  function copyEventLink() {
    const url = `${window.location.origin}/event/${eventId}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Event not found or you do not have access.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Events
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">{config.name}</span>
      </div>

      {/* Event link bar */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <span className="truncate text-xs text-muted-foreground font-mono">
          {typeof window !== "undefined" ? window.location.origin : ""}/event/{eventId}
        </span>
        <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 shrink-0 text-xs" onClick={copyEventLink}>
          {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copiedLink ? "Copied" : "Copy"}
        </Button>
        <a
          href={`/event/${eventId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Preview
        </a>
      </div>

      <Tabs defaultValue="settings" className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5">
              <Layout className="h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="responses" className="gap-1.5">
              <Users className="h-4 w-4" />
              Responses
            </TabsTrigger>
            <TabsTrigger value="notifications" asChild>
              <Link href={`/dashboard/events/${eventId}/notifications`} className="gap-1.5">
                <Bell className="h-4 w-4" />
                Notifications
              </Link>
            </TabsTrigger>
            <TabsTrigger value="invitees" asChild>
              <Link href={`/dashboard/events/${eventId}/invitees`} className="gap-1.5">
                <Users className="h-4 w-4" />
                Invitees
              </Link>
            </TabsTrigger>
          </TabsList>

          <Button onClick={saveConfig} disabled={saving} size="sm" className="gap-1.5">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Saved" : "Save Changes"}
          </Button>
        </div>

        <TabsContent value="settings">
          <EventSettingsTab
            config={config}
            setConfig={setConfig}
            currentEventId={eventId}
            onRenameSuccess={handleRenameSuccess}
          />
        </TabsContent>

        <TabsContent value="pages">
          <PageBuilderTab config={config} setConfig={setConfig} />
        </TabsContent>

        <TabsContent value="responses">
          <ResponsesTab guests={guests} config={config} onRefresh={fetchData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
