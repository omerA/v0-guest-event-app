"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageIcon, Upload, Link, Search, Trash2, Play, Loader2, X } from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing-client"
import type { MediaFile } from "@/lib/media"

type MediaType = "image" | "video"

interface UnsplashPhoto {
  id: string
  url: string
  thumbnail: string
  photographer: string
  photographerUrl: string
  downloadLocation: string
}

export interface MediaPickerProps {
  /** What file types this slot accepts. "any" allows both image and video. */
  accept: "image" | "video" | "any"
  /** Current URL — drives the thumbnail preview in the trigger area. */
  value?: string
  /** Explicit type of the current value. Overrides URL-based detection (needed for extension-less CDN URLs). */
  valueType?: MediaType
  onSelect: (url: string, type: MediaType) => void
  onClear?: () => void
}

function detectMediaType(url: string): MediaType {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0] ?? ""
  return ["mp4", "mov", "webm", "ogg", "avi", "mkv"].includes(ext) ? "video" : "image"
}

export function MediaPicker({ accept, value, valueType, onSelect, onClear }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"upload" | "library" | "url" | "search">("upload")

  // ── Upload tab ───────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false)
  const { startUpload: startImageUpload, isUploading: isUploadingImage } = useUploadThing("heroImage")
  const { startUpload: startVideoUpload, isUploading: isUploadingVideo } = useUploadThing("heroVideo")
  const isUploading = isUploadingImage || isUploadingVideo

  // ── Library tab ──────────────────────────────────────────────────────────
  const [library, setLibrary] = useState<MediaFile[] | null>(null)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  // ── URL tab ──────────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState("")

  // ── Search tab ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Reset URL input when dialog opens
  useEffect(() => {
    if (open) setUrlInput(value ?? "")
  }, [open, value])

  // Fetch library lazily when the Library tab is activated
  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true)
    try {
      const res = await fetch("/api/admin/media")
      if (res.ok) {
        const data = (await res.json()) as { files: MediaFile[] }
        setLibrary(data.files)
      }
    } finally {
      setLibraryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === "library" && library === null) fetchLibrary()
  }, [tab, library, fetchLibrary])

  // ── Handlers ─────────────────────────────────────────────────────────────

  function confirmSelect(url: string, type: MediaType) {
    onSelect(url, type)
    setOpen(false)
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith("video/")
    if (accept === "image" && isVideo) return
    if (accept === "video" && !isVideo) return
    const startUpload = isVideo ? startVideoUpload : startImageUpload
    const result = await startUpload([file])
    const uploaded = result?.[0]
    if (uploaded) {
      const url = (uploaded.serverData as { url?: string } | null)?.url ?? uploaded.url
      if (url) {
        setLibrary(null) // invalidate cache
        confirmSelect(url, isVideo ? "video" : "image")
      }
    }
  }

  function openFilePicker() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept === "video" ? "video/*" : accept === "image" ? "image/*" : "image/*,video/*"
    input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files)
    input.click()
  }

  function handleUrlSelect() {
    const url = urlInput.trim()
    if (!url) return
    confirmSelect(url, detectMediaType(url))
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/admin/media/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = (await res.json()) as { results: UnsplashPhoto[] }
        setSearchResults(data.results)
      }
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery])

  async function handleUnsplashSelect(photo: UnsplashPhoto) {
    // Fire download-tracking in the background (Unsplash API requirement)
    void fetch(`/api/admin/media/search?track=${encodeURIComponent(photo.downloadLocation)}`)
    confirmSelect(photo.url, "image")
  }

  async function handleDelete(key: string) {
    setDeletingKey(key)
    try {
      await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`, { method: "DELETE" })
      setLibrary((prev) => prev?.filter((f) => f.key !== key) ?? null)
    } finally {
      setDeletingKey(null)
    }
  }

  // Filter library by accept type
  const filteredLibrary =
    library?.filter((f) => {
      if (accept === "any") return true
      return f.type === accept
    }) ?? []

  // ── Tab trigger className helper ─────────────────────────────────────────
  const tabCls =
    "rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5"

  return (
    <>
      {/* ── Trigger area ── */}
      <div className="flex flex-col gap-2">
        {value ? (
          <div className="group relative w-full overflow-hidden rounded-lg border border-border bg-muted">
            <div className="aspect-video">
              {(valueType ?? detectMediaType(value)) === "video" ? (
                <video src={value} className="h-full w-full object-cover" muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt="Media preview" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button size="sm" variant="secondary" type="button" onClick={() => setOpen(true)}>
                Change
              </Button>
              {onClear && (
                <Button size="sm" variant="secondary" type="button" onClick={onClear}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
          >
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm font-medium">Choose media</span>
          </button>
        )}
      </div>

      {/* ── Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Choose Media</DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b bg-transparent px-6 pb-0">
              <TabsTrigger value="upload" className={tabCls}>
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="library" className={tabCls}>
                <ImageIcon className="h-4 w-4" />
                Library
              </TabsTrigger>
              <TabsTrigger value="url" className={tabCls}>
                <Link className="h-4 w-4" />
                By URL
              </TabsTrigger>
              {accept !== "video" && (
                <TabsTrigger value="search" className={tabCls}>
                  <Search className="h-4 w-4" />
                  Search
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── Upload tab ── */}
            <TabsContent value="upload" className="mt-0 p-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  void handleFiles(e.dataTransfer.files)
                }}
                onClick={openFilePicker}
                className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop file here, or click to browse</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {accept === "video"
                          ? "Video up to 256 MB"
                          : accept === "image"
                            ? "Image up to 8 MB"
                            : "Image (8 MB) or video (256 MB)"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ── Library tab ── */}
            <TabsContent value="library" className="mt-0">
              <ScrollArea className="h-[320px] px-6 py-4">
                {libraryLoading ? (
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                  </div>
                ) : filteredLibrary.length === 0 ? (
                  <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-sm">No uploads yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {filteredLibrary.map((file) => (
                      <div
                        key={file.key}
                        className="group flex cursor-pointer flex-col gap-1"
                        onClick={() => confirmSelect(file.url, file.type as MediaType)}
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-shadow hover:shadow-md">
                          {file.type === "video" ? (
                            <>
                              <video
                                src={file.url}
                                className="h-full w-full object-cover"
                                preload="metadata"
                                muted
                                playsInline
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50">
                                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                                </div>
                              </div>
                            </>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                          )}
                          {/* Delete button */}
                          <div className="absolute inset-0 flex items-start justify-end p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                void handleDelete(file.key)
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white hover:bg-red-600"
                              disabled={deletingKey === file.key}
                            >
                              {deletingKey === file.key ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="truncate px-0.5 text-[11px] text-muted-foreground" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── By URL tab ── */}
            <TabsContent value="url" className="mt-0 space-y-4 p-6">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSelect()}
                />
                <Button type="button" onClick={handleUrlSelect} disabled={!urlInput.trim()}>
                  Use this URL
                </Button>
              </div>
              {urlInput.trim() && (
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                  {detectMediaType(urlInput) === "video" ? (
                    <video src={urlInput} className="h-full w-full object-cover" controls muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urlInput}
                      alt="Preview"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Search tab (Unsplash, images only) ── */}
            {accept !== "video" && (
              <TabsContent value="search" className="mt-0 space-y-4 p-6">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for photos…"
                    onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
                  />
                  <Button
                    type="button"
                    onClick={() => void handleSearch()}
                    disabled={searchLoading || !searchQuery.trim()}
                  >
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <ScrollArea className="h-[220px]">
                  {searchLoading ? (
                    <div className="grid grid-cols-4 gap-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="grid grid-cols-4 gap-3">
                        {searchResults.map((photo) => (
                          <div
                            key={photo.id}
                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border"
                            onClick={() => void handleUnsplashSelect(photo)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.thumbnail}
                              alt={photo.photographer}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <a
                                href={photo.photographerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-[10px] text-white hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {photo.photographer}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        Photos provided by{" "}
                        <a
                          href="https://unsplash.com?utm_source=rsvp_app&utm_medium=referral"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Unsplash
                        </a>
                      </p>
                    </>
                  ) : null}
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
