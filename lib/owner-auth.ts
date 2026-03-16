/**
 * Owner authentication helpers — Gate 1 (Track A) implementation.
 *
 * All exported types and function signatures here are final.
 * Other tracks import them; do not change signatures.
 */

import { auth } from "@/auth"
import { db } from "@/lib/db"

export interface OwnerSession {
  userId: string
  email: string
  name: string | null
  ownerSlug: string
  role: "owner" | "superadmin"
}

// ─── Core session getter ──────────────────────────────────────────────────────

/**
 * Returns the authenticated owner session, or null if unauthenticated.
 */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    userId: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? null,
    ownerSlug: (session.user as any).ownerSlug,
    role: ((session.user as any).role ?? "owner") as "owner" | "superadmin",
  }
}

// ─── Guards ───────────────────────────────────────────────────────────────────

/**
 * Returns the session or throws a 401 Response if unauthenticated.
 * Use this in API route handlers.
 */
export async function requireOwnerSession(): Promise<OwnerSession> {
  const session = await getOwnerSession()
  if (!session) {
    throw new Response("Unauthorized", { status: 401 })
  }
  return session
}

/**
 * Returns the session if the authenticated user owns the given event.
 * Throws 401 if unauthenticated, 403 if the event belongs to another owner.
 */
export async function requireEventOwnership(eventId: string): Promise<OwnerSession> {
  const session = await requireOwnerSession()
  const event = await db.event.findUnique({ where: { id: eventId }, select: { ownerId: true } })
  if (!event || event.ownerId !== session.userId) {
    throw new Response("Forbidden", { status: 403 })
  }
  return session
}

/**
 * Returns the session if the authenticated user has the "superadmin" role.
 * Throws 401 if unauthenticated, 403 if the user is a regular owner.
 */
export async function requireSuperAdmin(): Promise<OwnerSession> {
  const session = await requireOwnerSession()
  if (session.role !== "superadmin") {
    throw new Response("Forbidden", { status: 403 })
  }
  return session
}
