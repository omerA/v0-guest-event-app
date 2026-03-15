# v2.0 Major Release Plan

## Overview

v2.0 transforms the app from a single-admin, single-event RSVP tool into a **multi-tenant event management platform** with user accounts, a public marketing presence, notification automation, and invitee management.

### New Features

1. **Marketing Homepage** — public-facing landing page with service overview, feature highlights, and sign-up CTA
2. **Owner Accounts & Dashboard** — email/password accounts and popular social/IDP login replace the shared admin password; each owner manages their own events in an isolated namespace
3. **Event Notifications** — owners configure one-time SMS/email blasts or scheduled reminders for guests
4. **Invitee Management** — owners upload guest lists (CSV) and send personalised invite URLs via SMS or email

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
└───────────────┬─────────────────────────────────────────────┘
                │
    ┌───────────┼───────────────────────────────────┐
    ▼           ▼               ▼                   ▼
 Track A     Track B         Track C             Track D
 Auth &      Marketing       Notification        Invitee
 Dashboard   Homepage        System              Management
```

**Track dependencies:**
- Track B (homepage) has zero runtime dependencies on other tracks — it only needs to link to `/signup`
- Tracks C and D both depend on Track A for the `User` session (they read `ownerId` from the session cookie)
- Tracks C and D are **independent of each other**
- Track A should be developed first or in parallel; Tracks C and D can start with mocked auth and integrate once Track A is ready

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

#### Interface Contracts (for Tracks C & D)

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
```

> Tracks C and D call `requireOwnerSession()` / `requireEventOwnership()` from this file. They do **not** import `auth` directly.

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

### Migration Strategy

1. **Pre-migration**: export existing events from v1 DB
2. **Apply v2 schema**: run Prisma migration (creates User, Invitee, Notification tables; updates Event)
3. **Data migration script**: create a seed "legacy" admin user; re-assign all existing Events to that user
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

## Execution Order

```
Week 1:
  - All agents read this plan and the v2 schema
  - Agent A: DB migration + auth API + session middleware
  - Agent B: Marketing homepage (fully independent, ship first)

Week 2:
  - Agent A: Owner dashboard + event URL restructure
  - Agent C: Notification backend (uses mocked auth if Track A not merged yet)
  - Agent D: Invitee backend (uses mocked auth if Track A not merged yet)

Week 3:
  - Agent A: Integration + final review
  - Agent C: Dashboard notification UI (after Track A dashboard shell merged)
  - Agent D: Dashboard invitee UI (after Track A dashboard shell merged)
  - Integration testing across all tracks
```

---

## Out of Scope for v2.0

- Pricing / billing / subscription management
- Team accounts (multiple owners per event)
- Custom domains per owner
- Analytics dashboard (beyond existing guest view)
- In-app messaging between owner and guest
- Mobile app

These are candidates for v2.1 and beyond.
