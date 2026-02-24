# Guest Event App

A multi-event RSVP platform built with Next.js 15 (App Router), React 19, and PostgreSQL. Guests authenticate via SMS OTP, complete customizable multi-page RSVP forms, and organisers manage everything through a password-protected admin dashboard.

## Features

- **Phone OTP authentication** via Twilio SMS — cryptographically random codes, hashed at rest, 5-minute expiry
- **Multi-event support** — each event has its own URL (`/event/[eventId]`)
- **Customisable RSVP forms** — multi-page, multiple question types (text, yes/no, single/multi-choice, guest-count, number)
- **Admin dashboard** — create, edit, and delete events; view guest responses in real time
- **Countdown timer** — live countdown to the event date
- **Calendar integration** — one-click add to Google Calendar, Outlook, or Apple Calendar
- **Maps integration** — links to Google Maps, Waze, and Apple Maps
- **Themed event pages** — 10 gradient and 4 image background options, 5 serif font choices, custom hero video or image
- **Stateless sessions** — HMAC-signed bearer tokens, no session storage required
- **Production-ready** — PostgreSQL via Prisma, env-var secrets, admin auth middleware

## Tech Stack

| Layer           | Library                                         |
| --------------- | ----------------------------------------------- |
| Framework       | Next.js 15 (App Router)                         |
| UI              | React 19, Tailwind CSS v4, shadcn/ui (Radix UI) |
| Database        | PostgreSQL via Prisma ORM                       |
| Auth            | Phone OTP (Twilio SMS) + HMAC sessions          |
| Forms           | React Hook Form + Zod                           |
| SMS             | Twilio                                          |
| Package manager | pnpm                                            |

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (local or Railway)
- Twilio account with a phone number

## Local Setup

```bash
# 1. Clone
git clone <your-repo-url>
cd v0-guest-event-app

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and fill in all required values

# 4. Apply the database schema
pnpm db:push

# 5. Seed the default event
pnpm db:seed

# 6. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

Visit `/admin/login` and enter your `ADMIN_PASSWORD` to access the admin dashboard.

## Environment Variables

| Variable              | Required | Description                                                 |
| --------------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`        | ✅       | PostgreSQL connection string                                |
| `SESSION_SECRET`      | ✅       | ≥32-char random string for signing tokens and admin cookie  |
| `ADMIN_PASSWORD`      | ✅       | Password for the `/admin` dashboard                         |
| `TWILIO_ACCOUNT_SID`  | ✅       | Twilio account SID (starts with `AC`)                       |
| `TWILIO_AUTH_TOKEN`   | ✅       | Twilio auth token                                           |
| `TWILIO_PHONE_NUMBER` | ✅       | Twilio sender number in E.164 format (e.g. `+12025551234`)  |
| `NEXT_PUBLIC_APP_URL` | optional | Public URL of the app (e.g. `https://your-app.railway.app`) |

Generate `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Available Scripts

| Script            | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `pnpm dev`        | Start development server                                  |
| `pnpm build`      | Build for production                                      |
| `pnpm start`      | Start production server                                   |
| `pnpm lint`       | Run ESLint                                                |
| `pnpm lint:fix`   | Run ESLint with auto-fix                                  |
| `pnpm format`     | Format all files with Prettier                            |
| `pnpm type-check` | TypeScript type check (no emit)                           |
| `pnpm db:push`    | Push Prisma schema to the database (no migration history) |
| `pnpm db:migrate` | Create and apply a named migration                        |
| `pnpm db:seed`    | Seed the default demo event                               |
| `pnpm db:studio`  | Open Prisma Studio (visual DB browser)                    |

## Deploying to Railway

Railway is the recommended deployment platform. It provides managed PostgreSQL, automatic builds from GitHub, and simple environment variable management.

### Step 1 — Create the project

1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project → Deploy from GitHub repo** and select this repository.
3. Railway detects Next.js and configures the build automatically.

### Step 2 — Add PostgreSQL

1. In your Railway project, click **+ New → Database → Add PostgreSQL**.
2. Railway automatically adds `DATABASE_URL` to your service's environment variables.

### Step 3 — Set environment variables

In your Railway service, go to **Variables** and add:

```
SESSION_SECRET      = <generate with the command above>
ADMIN_PASSWORD      = <your chosen admin password>
TWILIO_ACCOUNT_SID  = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN   = <your twilio auth token>
TWILIO_PHONE_NUMBER = +1xxxxxxxxxx
NEXT_PUBLIC_APP_URL = https://<your-railway-domain>
```

### Step 4 — Deploy and migrate

Once the first deploy completes, run the database migrations and seed from your local machine using the Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Link to your project
railway link

# Push schema and seed
railway run pnpm db:push
railway run pnpm db:seed
```

Or run them as one-off commands from the Railway dashboard under **Service → Deploy → Run command**.

### Step 5 — Custom domain (optional)

In Railway: **Service → Settings → Networking → Generate Domain** for a free `*.railway.app` subdomain, or add a custom domain and configure your DNS.

### Automatic deploys

Railway redeploys automatically on every push to your connected branch. Schema changes require re-running `pnpm db:push` (or `pnpm db:migrate` for production migration history).

## Architecture

```
Browser
  │
  ├── /event/[eventId]          Guest-facing event & RSVP pages
  ├── /admin                    Admin dashboard (password-protected)
  └── /admin/login              Admin login page
        │
        ▼
  Next.js App Router (Node.js)
        │
  ├── middleware.ts             Edge runtime — verifies admin_token cookie
  ├── app/api/auth/             OTP send + verify
  ├── app/api/events/           Event CRUD
  ├── app/api/event-config/     Event settings
  ├── app/api/questions/        Event questions (public read)
  ├── app/api/responses/        Guest RSVP submission
  └── app/api/admin/            Admin-only endpoints (guests list, auth)
        │
  lib/store.ts  →  Prisma ORM  →  PostgreSQL
  lib/otp.ts    →  Twilio SMS
```

**Session flow:**

1. Guest enters phone → `POST /api/auth/send-code` → Twilio sends SMS OTP
2. Guest enters code → `POST /api/auth/verify-code` → returns HMAC-signed bearer token
3. Token sent as `Authorization: Bearer <token>` on RSVP submission
4. Server verifies HMAC signature (stateless, no DB lookup needed)

## Security Notes

- OTP codes are cryptographically random (`crypto.randomInt`), never logged, stored only as SHA-256 hashes, and expire after 5 minutes.
- Session tokens are HMAC-SHA256 signed with `SESSION_SECRET` — tampering is detectable without a database lookup.
- Admin cookie is httpOnly, SameSite=Lax, Secure in production.
- Admin password comparison uses `timingSafeEqual` to prevent timing attacks.
- `SESSION_SECRET` and `ADMIN_PASSWORD` are never committed to the repository (see `.env.example`).
