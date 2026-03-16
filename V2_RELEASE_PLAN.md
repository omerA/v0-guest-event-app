# v2.0 Major Release Plan

## Overview

v2.0 transforms the app from a single-admin, single-event RSVP tool into a **multi-tenant event management platform** with user accounts, a public marketing presence, notification automation, and invitee management.

### New Features

1. **Marketing Homepage** — public-facing landing page with service overview, feature highlights, and sign-up CTA
2. **Owner Accounts & Dashboard** — email/password accounts and popular social/IDP login replace the shared admin password; each owner manages their own events in an isolated namespace
3. **Event Notifications** — owners configure one-time SMS/email blasts or scheduled reminders for guests
4. **Invitee Management** — owners upload guest lists (CSV) and send personalised invite URLs via SMS or email
5. **Super-Admin / Ops Dashboard** — platform-level dashboard for the app developer: business metrics, customer management, error monitoring, structured logging, and scoped data-correction tools

---

## Target Architecture

### Database Schema Changes

The complete target Prisma schema for v2.0. **All agents must treat this as the source of truth.**

```prisma
// NEW: Event owner accounts
// passwordHash is nullable — OAuth-only users never set a password
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?           // Required by NextAuth Prisma adapter
  image         String?             // Avatar URL from OAuth provider
  passwordHash  String?             // Null for OAuth-only users
  name          String?
  ownerSlug     String    @unique   // URL-safe handle, derived from email prefix at signup
  role          String    @default("owner")    // "owner" | "superadmin"
  status        String    @default("active")   // "active" | "suspended"
  createdAt     DateTime  @default(now())

  events        Event[]
  notifications NotificationTemplate[]
  accounts      Account[]           // NextAuth: linked OAuth accounts
  sessions      Session[]           // NextAuth: active sessions
}

// NEW: NextAuth Prisma adapter — linked OAuth accounts per user
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String                        // "google" | "github" | "azure-ad" | "credentials"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

// NEW: NextAuth Prisma adapter — database sessions
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// NEW: NextAuth Prisma adapter — email verification tokens
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// UPDATED: Event now belongs to a User owner
// Event slug is unique per owner (not globally), enforced by @@unique([ownerId, slug])
model Event {
  id          String   @id @default(cuid())   // UUID, no longer slug-based
  slug        String                           // URL-friendly name, unique per owner
  ownerId     String                           // FK to User
  owner       User     @relation(fields: [ownerId], references: [id])

  name                    String
  nameTranslations        Json?
  date                    String
  timezone                String  @default("UTC")
  location                String
  locationTranslations    Json?
  description             String
  descriptionTranslations Json?
  heroMediaUrl            String
  heroMediaType           String
  fontFamily              String  @default("playfair")
  dressCode               String  @default("none")
  supportedLanguages      String[]
  defaultLanguage         String  @default("en")
  createdAt               DateTime @default(now())

  pages                   EventPage[]
  guests                  Guest[]
  notificationTemplates   NotificationTemplate[]
  invitees                Invitee[]

  @@unique([ownerId, slug])  // Owner-scoped namespace
}

// UNCHANGED
model EventPage {
  id                  String     @id @default(cuid())
  eventId             String
  event               Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  title               String
  titleTranslations   Json?
  subtitle            String?
  subtitleTranslations Json?
  backgroundId        String
  backgroundImageUrl  String?
  order               Int
  questions           Question[]
}

// UNCHANGED
model Question {
  id                    String    @id @default(cuid())
  pageId                String
  page                  EventPage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  type                  String
  label                 String
  labelTranslations     Json?
  description           String?
  descriptionTranslations Json?
  options               Json?
  optionsTranslations   Json?
  min                   Int?
  max                   Int?
  required              Boolean
  order                 Int
}

// UNCHANGED
model Guest {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  phone       String
  name        String
  responses   Json
  submittedAt DateTime @default(now())

  @@unique([eventId, phone])
}

// UNCHANGED
model MediaFile {
  id         String   @id @default(cuid())
  url        String
  key        String   @unique
  name       String
  size       Int
  type       String
  mimeType   String
  uploadedAt DateTime @default(now())
}

// NEW: Notification templates that owners configure per event
// type: "blast" (send immediately) | "reminder" (scheduled before event)
model NotificationTemplate {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  name        String                         // Label for the owner's reference
  channel     String                         // "sms" | "email"
  type        String                         // "blast" | "reminder"
  subject     String?                        // Email subject (null for SMS)
  body        String                         // Message body; supports {{name}}, {{event}}, {{url}}
  daysBeforeEvent Int?                       // null for blasts; e.g. 7 = send 7 days before
  sentAt      DateTime?                      // null if not yet sent (blasts)
  createdAt   DateTime @default(now())

  scheduledJobs ScheduledNotificationJob[]
}

// NEW: Individual send jobs (one per recipient per template)
model ScheduledNotificationJob {
  id           String               @id @default(cuid())
  templateId   String
  template     NotificationTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  inviteeId    String?              // FK to Invitee if applicable
  guestId      String?              // FK to Guest if applicable
  recipient    String               // Phone number or email address
  status       String               @default("pending") // "pending" | "sent" | "failed"
  scheduledAt  DateTime
  sentAt       DateTime?
  error        String?
  createdAt    DateTime @default(now())
}

// NEW: Invitees uploaded by event owners (before RSVP)
model Invitee {
  id          String   @id @default(cuid())
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String
  email       String?
  phone       String?
  status      String   @default("invited")  // "invited" | "rsvped" | "declined"
  invitedAt   DateTime?
  createdAt   DateTime @default(now())

  @@unique([eventId, email])
}
```

### URL Structure Changes

| v1 | v2 | Notes |
|---|---|---|
| `/event/[eventId]` | `/e/[ownerSlug]/[eventSlug]` | `ownerSlug` = unique owner identifier derived from their account |
| `/admin` | `/dashboard` | Owner dashboard |
| `/admin/login` | `/login`, `/signup` | Standard auth pages |
| _(none)_ | `/` | Marketing homepage |

> **Alternative considered:** Keep `/event/[eventId]` but use the new UUID-based `Event.id` — simpler migration but loses readable URLs. **Decision: Use `/e/[ownerSlug]/[eventSlug]`** for clean namespace separation and shareable human-readable URLs.

### Authentication Strategy

- **Library**: [NextAuth.js v5 (Auth.js)](https://authjs.dev) with the Prisma adapter
- **Owner auth — credentials**: Email + password; `passwordHash` stored with bcrypt; handled via the `Credentials` provider
- **Owner auth — IDP / OAuth**: Google, GitHub, and Microsoft (Azure AD) via their respective NextAuth providers; more providers can be added trivially by adding an env var pair
- **Account linking**: NextAuth's Prisma adapter automatically links multiple OAuth accounts to the same `User` row when the email matches — an owner who signed up with Google can later also sign in with GitHub if the email is the same
- **Session**: Database sessions via NextAuth + Prisma `Session` model; `auth()` helper available in server components and API routes
- **Custom session fields**: Extend the NextAuth session callback to include `userId` and `ownerSlug` so all server code has access without an extra DB query
- **Guest auth**: Unchanged — phone OTP flow via Twilio (`lib/otp.ts`)
- **Middleware**: Use NextAuth's exported `auth` middleware to protect `/dashboard/*`; guest OTP flows remain unprotected

**NextAuth configuration file** (`auth.ts` at repo root):

```typescript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    GitHub,
    MicrosoftEntraId,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize({ email, password }) {
        const user = await prisma.user.findUnique({ where: { email: String(email) } })
        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(String(password), user.passwordHash)
        return valid ? user : null
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      session.user.ownerSlug = (user as any).ownerSlug
      return session
    },
  },
})
```

**`middleware.ts`** — protect owner routes using NextAuth:

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

### Notification Infrastructure

- **SMS**: Twilio Messaging API (existing Twilio account, switch from Verify to Messaging for outbound)
- **Email**: [Resend](https://resend.com) — simple API, generous free tier
- **Job scheduling**: PostgreSQL-based scheduler using `pg-boss` (fits the existing Railway Postgres setup; no extra infrastructure)
  - `pg-boss` creates its own tables; it polls the DB for due jobs
  - Start `pg-boss` worker in a Next.js instrumentation file (`instrumentation.ts`)
  - Reminder jobs are enqueued at notification template creation; blast jobs run immediately

---

## Parallel Agent Tracks

These four tracks have **minimal overlap** and can be developed simultaneously after a shared DB migration is applied. The tracks do have interface contracts defined below — agents must respect them.

```
┌─────────────────────────────────────────────────────────────┐
│               SHARED: DB Migration (do first)               │
│  Run once: apply the v2 schema, set up pg-boss tables       │
└───────────┬─────────────────────────────────────────────────┘
            │
  ┌─────────┼──────────────────────────────────────┐
  ▼         ▼               ▼           ▼           ▼
Track A   Track B         Track C     Track D     Track E
Auth &    Marketing       Notif-      Invitee     Super-Admin
Dashboard Homepage        ication     Mgmt        Ops Dashboard
```

**Track dependencies:**
- Track B (homepage) has zero runtime dependencies on other tracks — it only needs to link to `/signup`
- Tracks C and D both depend on Track A for the `User` session (they read `ownerId` from the session cookie)
- Track E depends on Track A for the `role` field on `User` and the `requireSuperAdmin()` guard — but its metrics pages and third-party integrations (Sentry, Axiom) can be set up independently
- Tracks C, D, and E are **independent of each other**
- Track A should be developed first or in parallel; other tracks can start with mocked auth and integrate once Track A is merged

---

## Track A — Auth System & Owner Dashboard

**Owner:** Agent A
**Touches:** `prisma/schema.prisma`, `auth.ts`, `middleware.ts`, `lib/`, `app/(auth)/`, `app/dashboard/`, API routes under `/api/owner/`

### Scope

#### 1. Dependencies

```
pnpm add next-auth@beta @auth/prisma-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

#### 2. Database

- Apply v2.0 migration:
  - Add `User` model (with `ownerSlug`, nullable `passwordHash`, `emailVerified`, `image`)
  - Add `Account`, `Session`, `VerificationToken` models (NextAuth Prisma adapter requirements)
  - Add `ownerId`, `slug` columns to `Event`; remove old string-based `@id`; add `@@unique([ownerId, slug])`
  - Write migration SQL and Prisma migration file

#### 3. NextAuth Configuration (`auth.ts`)

Create `auth.ts` at the repo root as shown in the Authentication Strategy section above. Enabled providers:

| Provider | Env vars required |
|---|---|
| Google | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| GitHub | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` |
| Microsoft (Entra ID) | `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`, `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` |
| Credentials (email+password) | _(none — uses DB)_ |

Common NextAuth vars: `AUTH_SECRET` (replaces `JWT_SECRET`), `AUTH_URL` (base URL in production).

#### 4. Route Handler

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

This replaces the old `/api/admin/auth` and is the only auth route handler needed.

#### 5. Sign-up Flow

NextAuth handles sign-in for OAuth providers automatically. For the credentials (email+password) flow, sign-in exists but sign-up does not — it must be built as a custom form:

- `app/(auth)/signup/page.tsx` — form: name, email, password, confirm password
- `POST /api/owner/auth/signup` — creates `User` row (bcrypt hash password, generate `ownerSlug`), then calls `signIn("credentials", ...)` to establish session

OAuth sign-up is automatic: when a user signs in with Google/GitHub/Microsoft for the first time, NextAuth creates the `User` and `Account` rows. A database callback should generate `ownerSlug` at this point if not set.

#### 6. Auth Pages

- `app/(auth)/login/page.tsx` — shows "Sign in with Google", "Sign in with GitHub", "Sign in with Microsoft" buttons + email/password form; implemented using `signIn()` from `next-auth/react`
- `app/(auth)/signup/page.tsx` — same OAuth buttons (they work for both sign-in and sign-up) + email/password registration form
- Configure `pages.signIn = "/login"` in NextAuth options

#### 7. Middleware

```typescript
// middleware.ts
export { auth as middleware } from "@/auth"
export const config = { matcher: ["/dashboard/:path*"] }
```

#### 8. `ownerSlug` Generation

`ownerSlug` is not provided by OAuth providers and must be generated server-side:
- Derive from `user.email` prefix (strip `@domain`), slugify (lowercase, replace non-alphanumeric with `-`), deduplicate with random suffix if taken
- Set during sign-up (credentials) or in a NextAuth `signIn` event callback (OAuth)
- Expose a "change handle" form in dashboard account settings

#### 4. Owner Dashboard (`/dashboard`)

Replace `app/admin/` with `app/dashboard/`:

- **`/dashboard`** — list of owner's events with links to manage each
- **`/dashboard/events/new`** — create event form (generates slug, scoped to owner)
- **`/dashboard/events/[eventId]`** — full event editor (port existing admin dashboard features)
- **`/dashboard/events/[eventId]/guests`** — guest list view
- **`/dashboard/events/[eventId]/notifications`** — notification template list (UI shell; integration with Track C)
- **`/dashboard/events/[eventId]/invitees`** — invitee management (UI shell; integration with Track D)

#### 5. Event API Updates

Update all existing event/admin API routes to use owner session instead of password:

| Old Route | New Route | Change |
|---|---|---|
| `POST /api/events` | `POST /api/owner/events` | Auth: session cookie |
| `DELETE /api/events` | `DELETE /api/owner/events/[eventId]` | Auth: session + ownership check |
| `PUT /api/event-config` | `PUT /api/owner/events/[eventId]/config` | Auth: session + ownership check |
| `GET /api/admin/guests` | `GET /api/owner/events/[eventId]/guests` | Auth: session + ownership check |
| `GET /api/admin/media` | `GET /api/owner/media` | Auth: session |

#### 6. Public Event URL Update

- Change `app/event/[eventId]/` → `app/e/[ownerSlug]/[eventSlug]/`
- Update `EventPage` and `RSVPPage` to resolve event by `(ownerSlug, eventSlug)` pair
- Update all internal links and OG image routes

#### 7. `app/` Root Page

- Change `app/page.tsx` from redirect-to-first-event to redirect to `/` (marketing page — handled by Track B)
- If user has active session, redirect to `/dashboard`

#### Interface Contracts (for Tracks C, D & E)

Track A exposes a thin wrapper in `lib/owner-auth.ts` so other tracks never import from `next-auth` directly:

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

// Augmented session shape (see NextAuth session callback in auth.ts)
export interface OwnerSession {
  userId: string;
  email: string;
  name: string | null;
  ownerSlug: string;
}

// Returns null if not logged in
export async function getOwnerSession(): Promise<OwnerSession | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return {
    userId: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? null,
    ownerSlug: (session.user as any).ownerSlug,
  }
}

// Throws Response with 401 if not logged in — use in API route handlers
export async function requireOwnerSession(): Promise<OwnerSession>

// Throws Response with 403 if session user does not own the event
export async function requireEventOwnership(eventId: string): Promise<OwnerSession>

// Throws Response with 403 if session user is not role="superadmin"
export async function requireSuperAdmin(): Promise<OwnerSession>
```

> Tracks C, D, and E call these helpers from `lib/owner-auth.ts`. They do **not** import `auth` directly.

---

## Track B — Marketing Homepage

**Owner:** Agent B
**Touches:** `app/page.tsx`, `app/(marketing)/`, new components in `components/marketing/`

### Scope

Build a polished, responsive marketing homepage at `/`. This track is **entirely independent** — it only links to `/signup` for the CTA.

#### Page Sections

1. **Hero Section**
   - Headline: _"Beautiful RSVP experiences for any event"_
   - Sub-headline: brief value proposition (2 sentences)
   - Primary CTA button: "Create your first event →" → `/signup`
   - Secondary CTA: "See a demo event" → link to a sample public event
   - Hero visual: animated mockup or screenshot of the event page

2. **Features Section** — highlight 4–6 core features with icon + title + description:
   - Customisable event pages (themes, fonts, hero media)
   - Multi-page RSVP forms with custom questions
   - Phone OTP guest verification
   - Guest list & response management
   - SMS & email notifications _(v2.0)_
   - Invitee management & bulk invites _(v2.0)_

3. **How It Works Section** — 3-step visual flow:
   1. Create your event
   2. Share the link with guests
   3. Track RSVPs in real time

4. **Social Proof / Demo Section**
   - Embedded preview of an actual event page (iframe or screenshot carousel)
   - Short quote/tagline

5. **Final CTA Section**
   - Repeat the sign-up CTA
   - "No credit card required • Free to start"

6. **Footer**
   - Product name, tagline
   - Links: Features, Pricing (placeholder), Privacy, Terms
   - Copyright

#### Technical Notes

- Create a `(marketing)` route group with its own layout (no dashboard chrome)
- The marketing layout should have a simple nav: Logo | Features | Sign In | **Get Started** (button)
- Use existing Tailwind + shadcn/ui components
- Animations: use `tailwindcss` transitions and `@keyframes` — no additional animation libraries
- Dark mode: honour system preference via existing `ThemeProvider`
- No new dependencies required

---

## Track C — Notification System

**Owner:** Agent C
**Touches:** `prisma/schema.prisma` (additions), `lib/notifications.ts`, `lib/email.ts`, `instrumentation.ts`, API routes under `/api/owner/events/[eventId]/notifications/`

**Prerequisite:** Track A must have defined `lib/owner-auth.ts` and the `Event` model with `ownerId`. Agent C can develop against mocked auth and integrate when Track A is merged.

### Scope

#### 1. Database

Add `NotificationTemplate` and `ScheduledNotificationJob` models (as defined in schema above).

#### 2. Dependencies

```
pnpm add resend pg-boss
```

#### 3. Email Service (`lib/email.ts`)

```typescript
// Wrapper around Resend
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void>
```

New env var: `RESEND_API_KEY`

#### 4. SMS Service Update (`lib/sms.ts`)

Create new `lib/sms.ts` that uses Twilio Messaging (not Verify) for outbound blasts:

```typescript
export async function sendSMS(opts: {
  to: string;   // E.164 format
  body: string;
}): Promise<void>
```

Existing `lib/otp.ts` (uses Twilio Verify) is unchanged.

#### 5. Job Queue (`lib/jobs.ts` + `instrumentation.ts`)

- Initialise `pg-boss` worker in `instrumentation.ts` (Next.js instrumentation hook)
- Define job handlers:
  - `send-notification` job: reads `ScheduledNotificationJob`, renders template, sends SMS or email, updates status
- When a `reminder` notification template is saved, enqueue one `send-notification` job per current guest/invitee, scheduled at `event.date - daysBeforeEvent days`
- When a `blast` is triggered, enqueue jobs immediately with `scheduledAt = now()`

#### 6. Template Rendering

Support template variables in the message body:
- `{{guest_name}}` — recipient's name
- `{{event_name}}` — event name
- `{{event_date}}` — formatted date
- `{{event_url}}` — full public URL to the event page
- `{{rsvp_url}}` — direct link to RSVP form

#### 7. API Routes

Under `/api/owner/events/[eventId]/notifications/`:

| Route | Method | Purpose |
|---|---|---|
| `index` | GET | List all notification templates for event |
| `index` | POST | Create notification template |
| `[templateId]` | GET | Get single template |
| `[templateId]` | PUT | Update template |
| `[templateId]` | DELETE | Delete template + cancel pending jobs |
| `[templateId]/send` | POST | Trigger blast immediately |

All routes: auth via `requireEventOwnership(req, eventId)`.

#### 8. Dashboard UI Integration

In `/dashboard/events/[eventId]/notifications` (shell created by Track A):

- List of existing notification templates (channel badge, type, status)
- **Create notification** form:
  - Name (owner label)
  - Channel: SMS | Email
  - Type: One-time blast | Reminder
  - If Reminder: "Days before event" number input
  - Subject (email only)
  - Message body with variable hints (`{{guest_name}}`, etc.)
  - Preview rendered message
- Send blast button (confirmation dialog)
- Status column: shows scheduled, sent, failed counts per template

---

## Track D — Invitee Management

**Owner:** Agent D
**Touches:** `prisma/schema.prisma` (additions), `lib/invitees.ts`, API routes under `/api/owner/events/[eventId]/invitees/`

**Prerequisite:** Track A must have defined `lib/owner-auth.ts` and the `Event` model with `ownerId`. Agent D can develop against mocked auth and integrate when Track A is merged.

### Scope

#### 1. Database

Add `Invitee` model (as defined in schema above).

#### 2. CSV Import

- Accept CSV file with columns: `name`, `email`, `phone` (at least one of email/phone required)
- Parse server-side using `papaparse` (add dependency: `pnpm add papaparse @types/papaparse`)
- Validate rows: skip rows missing both email and phone; report import summary
- Upsert on `(eventId, email)` — re-importing the same list updates names

#### 3. API Routes

Under `/api/owner/events/[eventId]/invitees/`:

| Route | Method | Purpose |
|---|---|---|
| `index` | GET | List all invitees with status + pagination |
| `index` | POST | Add single invitee |
| `index` | DELETE | Delete all invitees for event |
| `import` | POST | Upload + parse CSV → bulk upsert |
| `[inviteeId]` | PATCH | Update single invitee (name, email, phone) |
| `[inviteeId]` | DELETE | Remove single invitee |
| `invite` | POST | Send invite URLs (body: `{ inviteeIds: string[], channel: 'sms' | 'email' }`) |
| `sync-status` | POST | Mark invitees as rsvped when matching Guest record found |

#### 4. Invite URL Format

The invite URL points to the public event page:

```
https://{host}/e/{ownerSlug}/{eventSlug}
```

No token or personalisation in URL — the RSVP form handles identity via phone OTP as before. The invite is simply the event URL delivered to the contact.

For SMS: short message — `"Hi {name}, you're invited to {event_name}! RSVP here: {url}"`
For Email: HTML email with event name, date, hero image, and RSVP button.

Use `lib/sms.ts` and `lib/email.ts` from Track C. **If Track C is not yet merged, stub these with `console.log`.**

#### 5. Dashboard UI Integration

In `/dashboard/events/[eventId]/invitees` (shell created by Track A):

- **Import panel**: drag-and-drop CSV upload with column mapping preview and import summary
- **Invitee table**: name, email, phone, status badge (invited / rsvped / declined), invited date
- **Actions**:
  - Select rows → "Send invite" (choose channel: SMS / email)
  - Add single invitee (form)
  - Remove invitee(s)
  - Export CSV
- **Status sync button**: re-check which invitees have RSVPed (match by phone)
- Pagination for large lists

---

## Track E — Super-Admin / Ops Dashboard

**Owner:** Agent E
**Touches:** `app/super-admin/`, `lib/owner-auth.ts` (read `requireSuperAdmin`), `lib/admin-metrics.ts`, `instrumentation.ts` (Sentry + Axiom init), API routes under `/api/super-admin/`

**Prerequisite:** Track A must have landed the `User.role` field and `requireSuperAdmin()` helper. All metrics queries and third-party SDK wiring (Sentry, Axiom) can proceed in parallel.

### Context & Guiding Principles

This dashboard is for **you as the app developer** — not for event owners. It has three distinct jobs:

1. **Business visibility** — understand growth, usage, and health at a glance
2. **Customer support** — investigate and fix issues for specific owners or guests without needing raw DB access
3. **Platform health** — surface errors, slow API routes, failed jobs, and delivery failures in one place

The approach deliberately avoids embedding a generic DB admin UI (raw SQL in the browser is a security liability and slow to use for support). Instead, every action is a specific, safe, audited operation. For raw SQL exploration use Prisma Studio locally or Railway's built-in DB browser linked from the admin UI.

### Access Control

- **Route protection**: `middleware.ts` — add `/super-admin/:path*` to the protected matcher; after NextAuth session check, also verify `session.user.role === "superadmin"`
- **Bootstrap**: The first superadmin is granted by running the seed script with `SUPER_ADMIN_EMAIL` env var set. Subsequent promotions are done through the admin UI.
- **Audit log**: Every destructive action taken from `/super-admin` is written to a `SuperAdminAuditLog` table (see schema below) with timestamp, actor email, action, and target ID.

Add to Prisma schema:

```prisma
model SuperAdminAuditLog {
  id         String   @id @default(cuid())
  actorEmail String
  action     String   // e.g. "suspend_owner", "delete_guest", "retry_notification_job"
  targetType String   // "User" | "Event" | "Guest" | "NotificationJob" | etc.
  targetId   String
  meta       Json?    // additional context
  createdAt  DateTime @default(now())
}
```

### Pages & Routes

#### `/super-admin` — Business Metrics Overview

Summary cards (query via `/api/super-admin/metrics`):

| Metric | Description |
|---|---|
| Total owners | Count of `User` where `role = "owner"`, with delta vs last 7 days |
| Active owners | Owners who have at least one event |
| Total events | Count of all events, split: upcoming / past |
| Total guests | Count of all `Guest` rows (RSVPs submitted) |
| Total invitees | Count of all `Invitee` rows (before RSVP) |
| Notification delivery | Sent / failed jobs in last 30 days |
| Failed jobs (24h) | Count of `ScheduledNotificationJob` with `status = "failed"` in last 24h — shows as red badge if > 0 |

Time-series charts using the existing `Recharts` library:
- **New owner signups** — daily count over the last 30 days
- **Events created** — daily count over the last 30 days
- **RSVPs submitted** — daily count over the last 30 days (sourced from `Guest.submittedAt`)

#### `/super-admin/owners` — Owner Management

Full-text search across `User.email` and `User.name`. Table columns:

| Column | Details |
|---|---|
| Name / email | Linked to owner detail page |
| Status | `active` / `suspended` badge |
| Sign-in methods | OAuth provider badges (Google, GitHub, etc.) + "Password" if credentials set |
| Events | Count of their events |
| Guests | Total guests across all their events |
| Joined | `createdAt` |
| Actions | Suspend / restore, view events, promote to superadmin |

**Owner detail page** (`/super-admin/owners/[userId]`):
- Owner profile (name, email, ownerSlug, avatar, sign-in methods)
- Event list: name, date, guest count, RSVP completion status
- Ability to view any of their events exactly as the owner would see them (read-only)
- Danger zone: suspend account (blocks dashboard login, events remain visible to guests until manually taken down), permanently delete account (requires typing email to confirm)

**Impersonation for support** (`POST /api/super-admin/impersonate`):
- Sets a special `impersonating` flag in the session pointing to the target owner's `userId`
- Redirects to `/dashboard` where the UI shows a yellow "Impersonating [name]" banner
- All writes are blocked during impersonation (read-only view) to prevent accidental changes
- "End impersonation" button returns to the super-admin session
- Action is recorded in `SuperAdminAuditLog`

#### `/super-admin/events` — Event Explorer

Search all events across all owners. Table: event name, owner, date, location, guest count, RSVP open/closed status. Click through to a read-only event detail view. Admin can reassign an event to a different owner (e.g., during account migration).

#### `/super-admin/guests` — Guest Support

Search guests by phone number or name across all events. Useful for the support case: _"Guest X says they can't access the RSVP — help?"_

Results show: guest name, phone, event name, owner, submission date, full response data. Admin can delete a specific guest record (to allow re-RSVP from the same phone) with audit log.

#### `/super-admin/notifications` — Notification Job Monitor

Lists `ScheduledNotificationJob` rows across all events with filters:
- Status: pending / sent / failed
- Channel: SMS / email
- Date range

Failed jobs show the `error` field. **Retry failed jobs** button re-enqueues them via `pg-boss`. Useful for diagnosing Twilio/Resend outages.

#### `/super-admin/logs` — Observability Hub

This page is a **launcher / linker** — it does not reproduce what Axiom and Sentry already do well. It provides:

- Embedded Sentry recent-issues widget (using Sentry's embeddable component or direct iframe to the Sentry project)
- Link to Axiom dataset with pre-built query URLs for common lookups:
  - All errors in the last 1h
  - API latency P95 by route
  - Requests by owner
  - Notification delivery events
- Summary of failed `ScheduledNotificationJob`s in the last 24h (sourced from DB, not Axiom — no external dependency for this)

### Third-Party Observability Integrations

These are set up as part of Track E but affect the whole codebase.

#### Error Tracking: Sentry

```
pnpm add @sentry/nextjs
```

- Run `npx @sentry/wizard@latest -i nextjs` to generate `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- Captures: unhandled exceptions, API route errors, performance traces, source maps
- Configure `tracesSampleRate: 0.2` in production (20% of requests — adjust based on volume)
- Add `SENTRY_DSN` env var; `SENTRY_AUTH_TOKEN` for source map upload in CI
- In all API route error handlers, call `Sentry.captureException(err)` before returning a 500

#### Structured Logging: Axiom

```
pnpm add next-axiom
```

- Wraps Next.js middleware and API routes with structured log emission
- Replace `console.log` / `console.error` calls throughout `lib/` with `log.info(msg, { ...fields })` / `log.error(msg, { ...fields })`
- Standard fields to include in every log line: `{ requestId, ownerId?, eventId?, route, durationMs }`
- Configure `AXIOM_DATASET` and `AXIOM_TOKEN` env vars

### API Routes

Under `/api/super-admin/`:

| Route | Method | Purpose |
|---|---|---|
| `metrics` | GET | Aggregate counts + time-series data for dashboard |
| `owners` | GET | Paginated, searchable owner list |
| `owners/[userId]` | GET | Single owner detail with events |
| `owners/[userId]/suspend` | POST | Suspend / restore owner account |
| `owners/[userId]/promote` | POST | Set `role = "superadmin"` |
| `owners/[userId]` | DELETE | Permanently delete owner + cascade |
| `impersonate` | POST | Start impersonation session |
| `impersonate` | DELETE | End impersonation session |
| `events` | GET | All events across all owners |
| `events/[eventId]/reassign` | POST | Change event owner |
| `guests/search` | GET | Search guests by phone/name |
| `guests/[guestId]` | DELETE | Delete guest record (allow re-RSVP) |
| `notifications/jobs` | GET | List notification jobs with filters |
| `notifications/jobs/[jobId]/retry` | POST | Re-enqueue a failed job |
| `audit-log` | GET | Paginated audit log |

All routes: auth via `requireSuperAdmin()` from `lib/owner-auth.ts`.

---

## Shared Concerns

### Environment Variables (v2.0 additions)

```bash
# NextAuth (owner auth)
AUTH_SECRET=...                          # 32+ char random string — replaces JWT_SECRET
AUTH_URL=https://yourdomain.com          # Required in production

# OAuth — Google
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# OAuth — GitHub
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# OAuth — Microsoft (Entra ID / Azure AD)
AUTH_MICROSOFT_ENTRA_ID_ID=...
AUTH_MICROSOFT_ENTRA_ID_SECRET=...
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=...   # Use "common" for multi-tenant

# Email (notifications)
RESEND_API_KEY=re_...                    # From resend.com

# Twilio Messaging (outbound SMS for notifications & invites)
TWILIO_ACCOUNT_SID=...                   # Existing
TWILIO_AUTH_TOKEN=...                    # Existing
TWILIO_PHONE_NUMBER=+1...               # Sending phone number (NEW — different from Verify service)

# Existing — unchanged
TWILIO_VERIFY_SERVICE_SID=...           # Keep for guest OTP
DATABASE_URL=...
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...
UNSPLASH_ACCESS_KEY=...
```

**OAuth app setup checklist (for each provider):**
- **Google**: Create OAuth 2.0 client in Google Cloud Console; add `{AUTH_URL}/api/auth/callback/google` as authorised redirect URI
- **GitHub**: Create GitHub OAuth App; callback URL: `{AUTH_URL}/api/auth/callback/github`
- **Microsoft**: Register app in Azure Portal (Entra ID); redirect URI: `{AUTH_URL}/api/auth/callback/microsoft-entra-id`; grant `openid`, `profile`, `email` scopes

```bash
# Super-admin bootstrap
SUPER_ADMIN_EMAIL=you@yourdomain.com  # Seed script grants superadmin role to this email

# Observability — Sentry
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...                 # For source map upload in CI/CD only

# Observability — Axiom
AXIOM_DATASET=v0-guest-event-app
AXIOM_TOKEN=...
```

### Migration Strategy

1. **Pre-migration**: export existing events from v1 DB
2. **Apply v2 schema**: run Prisma migration (creates User, Account, Session, Invitee, Notification, AuditLog tables; updates Event)
3. **Data migration script**: create a seed "legacy" admin user with `role = "owner"`; re-assign all existing Events to that user; grant `role = "superadmin"` to the email in `SUPER_ADMIN_EMAIL` env var
4. **Post-migration verification**: confirm all event slugs are valid, all foreign keys intact

### Testing Approach

Each track should include:
- Unit tests for utility functions (`lib/`)
- Integration tests for API routes (mock Prisma using `jest-mock-extended` or `vitest`)
- Manual smoke-test checklist at the end of the track's PR

### Code Style

- Follow existing patterns: Zod for validation at API boundary, Prisma for DB, Next.js server actions where appropriate
- No new client-side state management libraries
- Keep components in `components/` flat unless they are route-specific (then co-locate in `app/`)
- Existing `lib/store.ts` will be refactored to `lib/events.ts` as part of Track A; other tracks should create their own lib files (`lib/notifications.ts`, `lib/invitees.ts`)

---

## Parallel Deployment Strategy

### Dependency Graph

Understanding what truly blocks what determines how many agents can run simultaneously and when.

```
                    ┌──────────────────────────────┐
                    │   Foundation PR (one agent)  │
                    │   • Full Prisma schema       │
                    │   • DB migration applied     │
                    │   • lib/owner-auth.ts stub   │
                    └──────────────┬───────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
    ┌─────▼──────┐          ┌──────▼──────┐         ┌──────▼──────┐
    │  Track B   │          │  Tracks     │         │  Track E    │
    │  Marketing │          │  C + D + E  │         │  Sentry /   │
    │  Homepage  │          │  backends   │         │  Axiom only │
    │            │          │  (stub auth)│         │             │
    └─────┬──────┘          └──────┬──────┘         └──────┬──────┘
          │                        │                        │
          │              ┌─────────▼──────────┐            │
          │              │  Gate 1            │            │
          │              │  Track A: real     │            │
          │              │  auth lands        │            │
          │              │  (lib/owner-auth   │            │
          │              │  no longer a stub) │            │
          │              └─────────┬──────────┘            │
          │                        │                        │
          │              ┌─────────▼──────────┐            │
          │              │  Tracks C, D, E    │            │
          │              │  integrate real    │            │
          │              │  auth; E unlocks   │            │
          │              │  owner mgmt pages  │            │
          │              └─────────┬──────────┘            │
          │                        │
          │              ┌─────────▼──────────┐
          │              │  Gate 2            │
          │              │  Track A: dashboard│
          │              │  shell lands       │
          │              │  (notification +   │
          │              │  invitee tab pages │
          │              │  exist as empty    │
          │              │  route shells)     │
          │              └─────────┬──────────┘
          │                        │
          │              ┌─────────▼──────────┐
          │              │  Tracks C + D      │
          │              │  build dashboard   │
          │              │  UI into shells    │
          └──────────────┴────────────────────┘
                    All tracks merge → integration testing
```

### The Three Hard Prerequisites

#### Foundation PR (true prerequisite — must merge before any track starts)

This is a **single standalone PR** done before any agent branches off feature work. It has no new behaviour, only shared infrastructure that all tracks depend on.

**Deliverables:**

1. **Full `schema.prisma` with all v2.0 models** — including every model across all tracks (`User`, `Account`, `Session`, `VerificationToken`, `Event` updated, `NotificationTemplate`, `ScheduledNotificationJob`, `Invitee`, `SuperAdminAuditLog`). All models defined in one place, one migration, zero merge conflicts later.

2. **DB migration applied** — `prisma migrate dev` run once; migration SQL committed. Every agent gets a fully migrated schema on their first `git pull`.

3. **`lib/owner-auth.ts` stub** — the file exists with the correct TypeScript signatures but backed by a hardcoded mock return value. This is the interface contract all other tracks code against. When Track A lands real auth, only this one file changes — no find-replace across tracks C, D, E.

```typescript
// lib/owner-auth.ts  — STUB (replaced when Track A merges real auth)
export interface OwnerSession {
  userId: string
  email: string
  name: string | null
  ownerSlug: string
  role: "owner" | "superadmin"
}

// Returns the stub session in development; will be replaced by Track A
// with a real NextAuth-backed implementation
export async function getOwnerSession(): Promise<OwnerSession | null> {
  if (process.env.NODE_ENV === "development") {
    return { userId: "stub-user", email: "dev@example.com", name: "Dev Owner", ownerSlug: "dev-owner", role: "owner" }
  }
  return null
}

export async function requireOwnerSession(): Promise<OwnerSession> {
  const session = await getOwnerSession()
  if (!session) throw new Response("Unauthorized", { status: 401 })
  return session
}

export async function requireEventOwnership(eventId: string): Promise<OwnerSession> {
  // Stub: real implementation checks Event.ownerId === session.userId
  return requireOwnerSession()
}

export async function requireSuperAdmin(): Promise<OwnerSession> {
  const session = await requireOwnerSession()
  if (session.role !== "superadmin") throw new Response("Forbidden", { status: 403 })
  return session
}
```

> **Why a stub and not just mocking in tests?** Because agents C, D, E run their code in a real dev environment against the real DB. The stub makes their local dev work end-to-end without needing Track A's NextAuth config. When Track A replaces the stub with the real implementation, the other agents only need to `git pull` — their code is unchanged.

---

#### Gate 1 — Track A: Real Auth Lands

**What it delivers:** `lib/owner-auth.ts` replaced with a real NextAuth-backed implementation. The function signatures are identical to the stub — agents C, D, E pull the change and their code works against real sessions with zero modifications.

**Also delivers:** `/login`, `/signup` pages; NextAuth route handler; middleware protecting `/dashboard/*` and `/super-admin/*`.

**What it unblocks:**
- Tracks C, D, E can now run against real sessions in staging/production
- Track E can build owner management pages (needs real `User.role` query)
- The app can be deployed to staging for the first time with working auth

**What it does NOT need to include yet:** The full owner dashboard event editor. That is Gate 2.

---

#### Gate 2 — Track A: Dashboard Shell Lands

**What it delivers:** The route structure under `/dashboard/events/[eventId]/` including:
- The event editor page (ported from existing admin dashboard)
- An empty `/dashboard/events/[eventId]/notifications` page (just a heading + "coming soon")
- An empty `/dashboard/events/[eventId]/invitees` page (same)

These empty shells are what Tracks C and D need to inject their UI components into. Without the shell the route doesn't exist; their components have nowhere to mount.

**What it unblocks:** Tracks C and D's frontend work (notification UI, invitee UI). All their backend work was already unblocked by the Foundation PR.

---

### What Can Run Fully in Parallel (No Gates Required)

| Track | Can start immediately after Foundation PR? | Notes |
|---|---|---|
| **Track B** | Yes — even before Foundation PR | No DB dependency at all. Can start from day 1. |
| **Track C backend** | Yes | Uses stub auth. API routes and pg-boss job system work against real DB. |
| **Track D backend** | Yes | Uses stub auth. CSV parsing, invitee CRUD, invite sending all independent. |
| **Track E — Sentry/Axiom** | Yes — even before Foundation PR | Just SDK config and `instrumentation.ts`. No DB required. |
| **Track E — metrics API** | Yes, after Foundation PR | Metrics queries read existing tables (`User`, `Event`, `Guest`). |
| **Track A** | Yes, after Foundation PR | Has no dependencies on other tracks. |

| Track | Requires Gate 1? | Requires Gate 2? |
|---|---|---|
| Track C — real session integration | Yes | No |
| Track D — real session integration | Yes | No |
| Track E — owner management pages | Yes | No |
| Track C — dashboard UI | No | **Yes** |
| Track D — dashboard UI | No | **Yes** |
| Track E — notification job monitor | No (reads DB directly) | No |

---

### Recommended Execution Sequence

```
Day 1-2:   Foundation PR
           └── One agent: schema, migration, lib/owner-auth.ts stub
               All other agents read the plan, set up local dev

Day 2+:    5 agents start in parallel
           ├── Agent A: NextAuth config → login/signup pages → middleware → real lib/owner-auth.ts
           ├── Agent B: Marketing homepage (ships independently, no gates)
           ├── Agent C: Notification API + pg-boss + email/SMS (stub auth)
           ├── Agent D: Invitee API + CSV import + invite sending (stub auth)
           └── Agent E: Sentry/Axiom + metrics API + super-admin overview

           ↓ Gate 1: Track A real auth merges (est. day 5-7)
           ├── Agent C: Swap stub → real auth; test against real sessions
           ├── Agent D: Swap stub → real auth; test against real sessions
           └── Agent E: Owner management, event explorer, guest search pages

           ↓ Gate 2: Track A dashboard shell merges (est. day 8-10)
           ├── Agent C: Build notification UI into dashboard shell
           ├── Agent D: Build invitee UI into dashboard shell
           └── Agent E: Notification job monitor, impersonation, audit log

           ↓ All tracks merged → integration testing → release
```

### Merge Order & Conflict Zones

The Foundation PR eliminates almost all schema merge conflicts since it defines every model upfront. The remaining conflict risks are:

| Risk | Location | Mitigation |
|---|---|---|
| Multiple tracks editing `instrumentation.ts` | Track C (pg-boss) and Track E (Sentry/Axiom) both touch this file | Track C owns pg-boss init; Track E owns Sentry/Axiom init; both sections are additive and non-overlapping |
| `middleware.ts` updated by Track A | Tracks C/D/E assume the middleware structure | Track A owns `middleware.ts`; other tracks never touch it |
| `prisma/schema.prisma` | Already solved by Foundation PR — no track adds new models | If a track discovers a needed schema addition, they open a small schema-only PR first |
| `.env.example` | All tracks add env vars | Each track adds only its own vars to `.env.example`; standard text merge conflict, easy to resolve |

---

## Out of Scope for v2.0

- Pricing / billing / subscription management (super-admin payments section will be a placeholder stub; Stripe integration is v2.1)
- Team accounts (multiple owners per event)
- Custom domains per owner
- In-app messaging between owner and guest
- Mobile app
- Public-facing status page (can be added via Instatus/Betterstack in v2.1 using the Axiom data already being collected)

These are candidates for v2.1 and beyond.
