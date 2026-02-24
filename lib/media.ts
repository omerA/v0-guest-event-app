import { UTApi } from "uploadthing/server"
import { db } from "./db"

export interface MediaFile {
  id: string
  url: string
  key: string
  name: string
  size: number
  type: string
  mimeType: string
  uploadedAt: string
}

export async function listMedia(): Promise<MediaFile[]> {
  const files = await db.mediaFile.findMany({ orderBy: { uploadedAt: "desc" } })
  return files.map((f) => ({ ...f, uploadedAt: f.uploadedAt.toISOString() }))
}

export async function deleteMedia(key: string): Promise<void> {
  const utapi = new UTApi()
  await Promise.all([utapi.deleteFiles([key]), db.mediaFile.delete({ where: { key } })])
}
