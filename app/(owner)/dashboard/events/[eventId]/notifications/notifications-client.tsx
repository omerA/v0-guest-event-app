"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Send, Trash2, Mail, MessageSquare, Clock, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  channel: string
  type: string
  subject: string | null
  body: string
  daysBeforeEvent: number | null
  sentAt: Date | null
  createdAt: Date
  _count: { scheduledJobs: number }
  statusCounts: Record<string, number>
}

interface Props {
  eventId: string
  eventName: string
  recipientCount: number
  initialTemplates: Template[]
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  channel: z.enum(["sms", "email"]),
  type: z.enum(["blast", "reminder"]),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  daysBeforeEvent: z.coerce.number().int().min(1).max(90).optional(),
})

type FormValues = z.infer<typeof formSchema>

// ─── Template variable rendering (for preview) ───────────────────────────────

const SAMPLE_VARS: Record<string, string> = {
  guest_name: "Jane Smith",
  event_name: "Annual Gala 2025",
  event_date: "December 31, 2025",
  event_url: "https://example.com/e/host/annual-gala",
  rsvp_url: "https://example.com/e/host/annual-gala",
}

function renderPreview(body: string): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VARS[key] ?? `{{${key}}}`)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationsClient({
  eventId,
  eventName,
  recipientCount,
  initialTemplates,
}: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channel: "sms",
      type: "blast",
    },
  })

  const watchedChannel = form.watch("channel")
  const watchedType = form.watch("type")
  const watchedBody = form.watch("body") ?? ""
  const watchedSubject = form.watch("subject") ?? ""

  async function onSubmit(values: FormValues) {
    setIsCreating(true)
    try {
      const res = await fetch(`/api/owner/events/${eventId}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to create notification")
      }
      const json = await res.json()
      const newTemplate: Template = {
        ...json.template,
        _count: { scheduledJobs: 0 },
        statusCounts: {},
      }
      setTemplates((prev) => [newTemplate, ...prev])
      form.reset({ channel: "sms", type: "blast" })
      setCreateOpen(false)
      toast.success("Notification template created")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating template")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleSendBlast(templateId: string) {
    setIsSending(true)
    try {
      const res = await fetch(
        `/api/owner/events/${eventId}/notifications/${templateId}/send`,
        { method: "POST" }
      )
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to send blast")
      }
      const json = await res.json()
      toast.success(`Blast enqueued for ${json.jobsEnqueued} recipient(s)`)
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId
            ? { ...t, sentAt: new Date(), _count: { scheduledJobs: json.jobsEnqueued } }
            : t
        )
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error sending blast")
    } finally {
      setIsSending(false)
      setConfirmSendId(null)
    }
  }

  async function handleDelete(templateId: string) {
    setDeletingId(templateId)
    try {
      const res = await fetch(
        `/api/owner/events/${eventId}/notifications/${templateId}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Failed to delete")
      }
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      toast.success("Template deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting template")
    } finally {
      setDeletingId(null)
    }
  }

  const confirmTemplate = templates.find((t) => t.id === confirmSendId)

  return (
    <>
      <Toaster />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {eventName} &mdash; {recipientCount} potential recipient(s)
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create notification template</DialogTitle>
                <DialogDescription>
                  Configure a new SMS or email notification for your guests.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7-day reminder" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Channel */}
                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <FormControl>
                          <RadioGroup
                            className="flex gap-4"
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="sms" id="ch-sms" />
                              <Label htmlFor="ch-sms" className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />
                                SMS
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="email" id="ch-email" />
                              <Label htmlFor="ch-email" className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                Email
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            className="flex gap-4"
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="blast" id="type-blast" />
                              <Label htmlFor="type-blast" className="flex items-center gap-1">
                                <Zap className="h-3.5 w-3.5" />
                                One-time blast
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="reminder" id="type-reminder" />
                              <Label htmlFor="type-reminder" className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Scheduled reminder
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Days before event (reminder only) */}
                  {watchedType === "reminder" && (
                    <FormField
                      control={form.control}
                      name="daysBeforeEvent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days before event</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={90}
                              placeholder="e.g. 7"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormDescription>Between 1 and 90 days before the event date.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Subject (email only) */}
                  {watchedChannel === "email" && (
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="You're invited to {{event_name}}" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Body */}
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Hi {{guest_name}}, you're invited to {{event_name}} on {{event_date}}. RSVP here: {{rsvp_url}}"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Available variables:{" "}
                          <code className="text-xs">{"{{guest_name}}"}</code>,{" "}
                          <code className="text-xs">{"{{event_name}}"}</code>,{" "}
                          <code className="text-xs">{"{{event_date}}"}</code>,{" "}
                          <code className="text-xs">{"{{event_url}}"}</code>,{" "}
                          <code className="text-xs">{"{{rsvp_url}}"}</code>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Live preview */}
                  {watchedBody && (
                    <div className="rounded-md border bg-muted/40 p-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Preview
                      </p>
                      {watchedChannel === "email" && watchedSubject && (
                        <p className="text-sm font-medium">{renderPreview(watchedSubject)}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{renderPreview(watchedBody)}</p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Creating…" : "Create template"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Template list */}
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground">No notification templates yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click &ldquo;New notification&rdquo; to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                recipientCount={recipientCount}
                onSendClick={() => setConfirmSendId(template.id)}
                onDeleteClick={() => handleDelete(template.id)}
                isDeleting={deletingId === template.id}
              />
            ))}
          </div>
        )}

        {/* Confirm send dialog */}
        <Dialog
          open={confirmSendId !== null}
          onOpenChange={(open) => !open && setConfirmSendId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send blast?</DialogTitle>
              <DialogDescription>
                This will send &ldquo;{confirmTemplate?.name}&rdquo; to approximately{" "}
                <strong>{recipientCount}</strong> recipient(s) immediately. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmSendId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => confirmSendId && handleSendBlast(confirmSendId)}
                disabled={isSending}
              >
                {isSending ? "Sending…" : "Send blast"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  recipientCount,
  onSendClick,
  onDeleteClick,
  isDeleting,
}: {
  template: Template
  recipientCount: number
  onSendClick: () => void
  onDeleteClick: () => void
  isDeleting: boolean
}) {
  const pending = template.statusCounts["pending"] ?? 0
  const sent = template.statusCounts["sent"] ?? 0
  const failed = template.statusCounts["failed"] ?? 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={template.channel === "sms" ? "secondary" : "outline"}>
              {template.channel === "sms" ? (
                <><MessageSquare className="h-3 w-3" /> SMS</>
              ) : (
                <><Mail className="h-3 w-3" /> Email</>
              )}
            </Badge>
            <Badge variant={template.type === "blast" ? "default" : "outline"}>
              {template.type === "blast" ? (
                <><Zap className="h-3 w-3" /> Blast</>
              ) : (
                <><Clock className="h-3 w-3" /> Reminder</>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        {template.type === "reminder" && template.daysBeforeEvent != null && (
          <p className="text-xs text-muted-foreground">
            Sends {template.daysBeforeEvent} day(s) before the event
          </p>
        )}
        {template.channel === "email" && template.subject && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Subject:</span> {template.subject}
          </p>
        )}
        <p className="text-sm line-clamp-2 text-muted-foreground">{template.body}</p>

        {template._count.scheduledJobs > 0 && (
          <>
            <Separator />
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="text-yellow-600">{pending} pending</span>
              <span className="text-green-600">{sent} sent</span>
              {failed > 0 && <span className="text-destructive">{failed} failed</span>}
            </div>
          </>
        )}

        {template.sentAt && (
          <p className="text-xs text-muted-foreground">
            Last sent: {new Date(template.sentAt).toLocaleString()}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        {template.type === "blast" && (
          <Button size="sm" onClick={onSendClick} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Send blast ({recipientCount})
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onDeleteClick}
          disabled={isDeleting}
          className="gap-1.5 ml-auto text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  )
}
