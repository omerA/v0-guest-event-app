import { createUploadthing, type FileRouter } from "uploadthing/next"
import { db } from "./db"
import { verifyAdmin } from "./admin-auth"

const f = createUploadthing()

async function saveToLibrary(file: { ufsUrl: string; key: string; name: string; size: number; type: string }) {
  try {
    await db.mediaFile.create({
      data: {
        url: file.ufsUrl,
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type.startsWith("video/") ? "video" : "image",
        mimeType: file.type,
      },
    })
  } catch {
    // Non-fatal: duplicate key = file was already tracked
  }
}

export const ourFileRouter = {
  heroImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      await verifyAdmin()
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      await saveToLibrary(file)
      return { url: file.ufsUrl }
    }),

  heroVideo: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async () => {
      await verifyAdmin()
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      await saveToLibrary(file)
      return { url: file.ufsUrl }
    }),

  pageBackground: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      await verifyAdmin()
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      await saveToLibrary(file)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
