"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  RefreshCw,
  Loader2,
  ClipboardList,
  Settings,
  Layout,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Check,
  X,
} from "lucide-react"
import type { Guest, EventPage, EventConfig, QuestionType, FontFamily } from "@/lib/store"
import { BACKGROUND_GALLERY, FONT_OPTIONS } from "@/lib/store"
import { getFontStyle } from "@/lib/fonts"

export function AdminDashboard() {
  const [config, setConfig] = useState<EventConfig | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [configRes, guestsRes] = await Promise.all([
        fetch("/api/event-config"),
        fetch("/api/admin/guests"),
      ])
      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData)
      }
      if (guestsRes.ok) {
        const guestsData = await guestsRes.json()
        setGuests(guestsData.guests)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveConfig = useCallback(async () => {
    if (!config) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/event-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }, [config])

  if (loading || !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="settings" className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Event Settings
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-1.5">
            <Layout className="h-4 w-4" />
            Page Builder
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Responses
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
        <EventSettingsTab config={config} setConfig={setConfig} />
      </TabsContent>

      <TabsContent value="pages">
        <PageBuilderTab config={config} setConfig={setConfig} />
      </TabsContent>

      <TabsContent value="responses">
        <ResponsesTab guests={guests} pages={config.pages} onRefresh={fetchData} />
      </TabsContent>
    </Tabs>
  )
}

// ---- Event Settings Tab ----
function EventSettingsTab({
  config,
  setConfig,
}: {
  config: EventConfig
  setConfig: (c: EventConfig) => void
}) {
  function update(field: keyof EventConfig, value: string) {
    setConfig({ ...config, [field]: value })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Event Details</CardTitle>
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
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                value={config.date}
                onChange={(e) => update("date", e.target.value)}
                placeholder="Saturday, April 18th, 2026"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={config.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="The Grand Hall"
              />
            </div>
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="video-url">Hero Video URL</Label>
            <Input
              id="video-url"
              value={config.heroVideoUrl}
              onChange={(e) => update("heroVideoUrl", e.target.value)}
              placeholder="https://videos.pexels.com/..."
            />
            <p className="text-xs text-muted-foreground">
              Paste a direct link to a .mp4 video file for the landing page background
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font Picker */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Event Font</CardTitle>
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
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all ${
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span
                    className="text-2xl text-foreground"
                    style={{ fontFamily: getFontStyle(font.id) }}
                  >
                    {config.name || "Event Name"}
                  </span>
                  <span className="text-xs text-muted-foreground">{font.label}</span>
                  {selected && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Page Builder Tab ----
function PageBuilderTab({
  config,
  setConfig,
}: {
  config: EventConfig
  setConfig: (c: EventConfig) => void
}) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null)

  function addPage() {
    const newPage: EventPage = {
      id: `page-${Date.now()}`,
      title: "New Page",
      subtitle: "",
      question: {
        id: `q-${Date.now()}`,
        type: "text",
        label: "Your question here",
        required: true,
      },
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
    setConfig({
      ...config,
      pages: config.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
    })
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
          <p className="text-xs text-muted-foreground">
            Each page shows one question. Guests will see them in order, one at a time.
          </p>
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
            className={`border shadow-sm transition-all ${
              editingPageId === page.id ? "border-primary" : "border-border"
            }`}
          >
            <CardContent className="py-4">
              {/* Page header row */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => movePage(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                    aria-label="Move up"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 10 6" fill="none"><path d="M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => movePage(index, 1)}
                    disabled={index === config.pages.length - 1}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                    aria-label="Move down"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                <div
                  className="h-10 w-10 shrink-0 rounded-lg"
                  style={getPageBgPreview(page.backgroundId)}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {page.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {page.question.type} - {page.question.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setEditingPageId(editingPageId === page.id ? null : page.id)
                    }
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

              {/* Expanded editor */}
              {editingPageId === page.id && (
                <PageEditor
                  page={page}
                  onChange={(updates) => updatePage(page.id, updates)}
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

// ---- Page Editor (inline) ----
function PageEditor({
  page,
  onChange,
}: {
  page: EventPage
  onChange: (updates: Partial<EventPage>) => void
}) {
  function updateQuestion(field: string, value: string | string[] | number | boolean) {
    onChange({ question: { ...page.question, [field]: value } })
  }

  return (
    <div className="mt-4 flex flex-col gap-5 border-t border-border pt-4">
      {/* Title & Subtitle */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Page Title</Label>
          <Input
            value={page.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Your Name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Subtitle</Label>
          <Input
            value={page.subtitle ?? ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Let us know who you are"
          />
        </div>
      </div>

      {/* Question Label */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Question</Label>
        <Input
          value={page.question.label}
          onChange={(e) => updateQuestion("label", e.target.value)}
          placeholder="What is your full name?"
        />
      </div>

      {/* Question Type + Required */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Question Type</Label>
          <Select
            value={page.question.type}
            onValueChange={(val: QuestionType) =>
              onChange({
                question: {
                  ...page.question,
                  type: val,
                  options: val === "single-choice" || val === "multi-choice" ? page.question.options ?? ["Option 1", "Option 2"] : undefined,
                  min: val === "number" ? 0 : undefined,
                  max: val === "number" ? 10 : undefined,
                },
              })
            }
          >
            <SelectTrigger className="w-full">
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
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Required</Label>
          <div className="flex h-9 items-center gap-2">
            <button
              type="button"
              onClick={() => updateQuestion("required", !page.question.required)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                page.question.required ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={page.question.required}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  page.question.required ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {page.question.required ? "Required" : "Optional"}
            </span>
          </div>
        </div>
      </div>

      {/* Options editor for choice types */}
      {(page.question.type === "single-choice" || page.question.type === "multi-choice") && (
        <OptionsEditor
          options={page.question.options ?? []}
          onChange={(opts) => updateQuestion("options", opts)}
        />
      )}

      {/* Min/Max for number type */}
      {page.question.type === "number" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Min</Label>
            <Input
              type="number"
              value={page.question.min ?? 0}
              onChange={(e) => updateQuestion("min", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Max</Label>
            <Input
              type="number"
              value={page.question.max ?? 10}
              onChange={(e) => updateQuestion("max", parseInt(e.target.value) || 10)}
            />
          </div>
        </div>
      )}

      {/* Background Picker */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs">Page Background</Label>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {BACKGROUND_GALLERY.map((bg) => {
            const selected = page.backgroundId === bg.id
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => onChange({ backgroundId: bg.id })}
                className={`group relative flex h-12 w-full items-center justify-center rounded-lg border-2 transition-all ${
                  selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                }`}
                style={bg.type === "gradient" ? { background: bg.value } : bg.type === "none" ? { background: "#f3f3f3" } : {}}
                title={bg.label}
                aria-label={bg.label}
              >
                {bg.type === "none" && (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                {selected && bg.type !== "none" && (
                  <Check className="h-4 w-4 text-white drop-shadow-md" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---- Options Editor ----
function OptionsEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (opts: string[]) => void
}) {
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
          <Input
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            className="flex-1"
          />
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

// ---- Responses Tab ----
function ResponsesTab({
  guests,
  pages,
  onRefresh,
}: {
  guests: Guest[]
  pages: EventPage[]
  onRefresh: () => void
}) {
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  // Find the yes-no or attendance question
  const attendanceQuestion = pages.find(
    (p) => p.question.type === "yes-no" || p.question.id === "q-attendance"
  )
  const attQid = attendanceQuestion?.question.id

  const attendingCount = attQid
    ? guests.filter((g) => g.responses[attQid] === true || g.responses[attQid] === "Yes").length
    : 0
  const declinedCount = attQid
    ? guests.filter((g) => g.responses[attQid] === false || g.responses[attQid] === "No").length
    : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
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

      {/* Table */}
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
            onClick={handleRefresh}
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
              <p className="font-medium text-foreground">No responses yet</p>
              <p className="text-sm text-muted-foreground">
                Share the event link with your guests to start collecting RSVPs.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    {pages.map((p) => (
                      <TableHead key={p.id}>{p.title}</TableHead>
                    ))}
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium text-foreground">{guest.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {guest.phone}
                      </TableCell>
                      {pages.map((p) => {
                        const val = guest.responses[p.question.id]
                        return (
                          <TableCell key={p.id} className="text-muted-foreground">
                            {formatResponseValue(val)}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-xs text-muted-foreground">
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

// ---- Helpers ----
function formatResponseValue(val: unknown): string {
  if (val === undefined || val === null) return "-"
  if (typeof val === "boolean") return val ? "Yes" : "No"
  if (Array.isArray(val)) return val.join(", ")
  if (typeof val === "object" && val !== null) {
    const gc = val as { adults?: number; children?: number; babies?: number }
    const parts: string[] = []
    if (gc.adults) parts.push(`${gc.adults} adult${gc.adults !== 1 ? "s" : ""}`)
    if (gc.children) parts.push(`${gc.children} child${gc.children !== 1 ? "ren" : ""}`)
    if (gc.babies) parts.push(`${gc.babies} bab${gc.babies !== 1 ? "ies" : "y"}`)
    return parts.length > 0 ? parts.join(", ") : "None"
  }
  return String(val)
}

function getPageBgPreview(backgroundId: string): React.CSSProperties {
  const bg = BACKGROUND_GALLERY.find((b) => b.id === backgroundId)
  if (!bg || bg.type === "none") return { background: "#e5e5e5" }
  if (bg.type === "gradient") return { background: bg.value }
  return { background: "#e5e5e5" }
}
