/**
 * Owner authentication helpers.
 *
 * ⚠️  STUB — Gate 1 (Track A) replaces getOwnerSession() with a real
 * NextAuth-backed implementation. All exported types and function
 * signatures here are final and must not be changed by other tracks.
 *
 * How it works right now:
 *   - NODE_ENV=development  → returns a hardcoded stub session so that
 *     Tracks B, C, D, and E can develop and test locally without Gate 1.
 *   - All other environments → returns null (unauthenticated), causing
 *     requireOwnerSession() to throw 401. This is intentional: the app
 *     is not fully functional until Gate 1 lands.
 *
 * When Track A (Gate 1) is ready, only getOwnerSession() changes.
 * Every caller of this module remains untouched.
 */

export interface OwnerSession {
  userId: string
  email: string
  name: string | null
  ownerSlug: string
  role: "owner" | "superadmin"
}

// ─── Stub session (development only) ─────────────────────────────────────────

const DEV_STUB: OwnerSession = {
  userId: "stub-user-id",
  email: "dev@example.com",
  name: "Dev Owner",
  ownerSlug: "dev-owner",
  role: "owner",
}

// ─── Core session getter ──────────────────────────────────────────────────────

/**
 * Returns the authenticated owner session, or null if the request is
 * unauthenticated.
 *
 * STUB: replaced by Track A (Gate 1) with:
 *   const session = await auth()
 *   if (!session?.user?.id) return null
 *   return { userId: session.user.id, email: session.user.email!, ... }
 */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  if (process.env.NODE_ENV === "development") {
    return DEV_STUB
  }
  // Gate 1 not yet landed — no real auth available
  return null
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
 *
 * STUB: ownership check is skipped until Track A (Gate 1) lands.
 * Track A will add:
 *   const event = await prisma.event.findUnique({ where: { id: eventId }, select: { ownerId: true } })
 *   if (!event || event.ownerId !== session.userId) throw new Response("Forbidden", { status: 403 })
 */
export async function requireEventOwnership(eventId: string): Promise<OwnerSession> {
  const session = await requireOwnerSession()
  // TODO (Track A / Gate 1): add ownership check against Event.ownerId
  void eventId
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
