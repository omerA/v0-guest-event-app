-- V2 Foundation Migration
-- Adds all new models for v2.0: owner accounts (NextAuth-compatible),
-- event ownership, notifications, invitees, and the super-admin audit log.
--
-- Safe to run on both a fresh v2 database and an existing v1 database.
--
-- Notes on Event changes:
--   - "slug" and "ownerId" are nullable here. Track A (Gate 1) will enforce
--     NOT NULL and add @@unique([ownerId, slug]) after the data migration
--     script backfills existing rows.
--   - "ownerId" FK uses ON DELETE SET NULL so existing events are not lost
--     if applied to a v1 database before owners exist.

-- ─── User ────────────────────────────────────────────────────────────────────

CREATE TABLE "User" (
    "id"            TEXT        NOT NULL,
    "email"         TEXT        NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image"         TEXT,
    "passwordHash"  TEXT,
    "name"          TEXT,
    "ownerSlug"     TEXT        NOT NULL,
    "role"          TEXT        NOT NULL DEFAULT 'owner',
    "status"        TEXT        NOT NULL DEFAULT 'active',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key"     ON "User"("email");
CREATE UNIQUE INDEX "User_ownerSlug_key" ON "User"("ownerSlug");

-- ─── Account (NextAuth) ───────────────────────────────────────────────────────

CREATE TABLE "Account" (
    "id"                TEXT    NOT NULL,
    "userId"            TEXT    NOT NULL,
    "type"              TEXT    NOT NULL,
    "provider"          TEXT    NOT NULL,
    "providerAccountId" TEXT    NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
    ON "Account"("provider", "providerAccountId");

ALTER TABLE "Account"
    ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Session (NextAuth) ───────────────────────────────────────────────────────

CREATE TABLE "Session" (
    "id"           TEXT        NOT NULL,
    "sessionToken" TEXT        NOT NULL,
    "userId"       TEXT        NOT NULL,
    "expires"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

ALTER TABLE "Session"
    ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── VerificationToken (NextAuth) ────────────────────────────────────────────

CREATE TABLE "VerificationToken" (
    "identifier" TEXT        NOT NULL,
    "token"      TEXT        NOT NULL,
    "expires"    TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key"
    ON "VerificationToken"("token");

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key"
    ON "VerificationToken"("identifier", "token");

-- ─── Event (alter) ───────────────────────────────────────────────────────────

-- Add owner namespace columns. Nullable until Track A (Gate 1) backfills
-- existing rows and then tightens to NOT NULL + unique constraint.
ALTER TABLE "Event"
    ADD COLUMN "slug"    TEXT,
    ADD COLUMN "ownerId" TEXT;

-- On a fresh v2 DB this is a no-op (no rows exist).
-- On a migrated v1 DB: copy existing slug-based ids into the slug column so
-- that existing event URLs continue to work after Track A wires up routing.
UPDATE "Event" SET "slug" = "id" WHERE "slug" IS NULL;

ALTER TABLE "Event"
    ADD CONSTRAINT "Event_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── NotificationTemplate ────────────────────────────────────────────────────

CREATE TABLE "NotificationTemplate" (
    "id"              TEXT        NOT NULL,
    "eventId"         TEXT        NOT NULL,
    "ownerId"         TEXT        NOT NULL,
    "name"            TEXT        NOT NULL,
    "channel"         TEXT        NOT NULL,
    "type"            TEXT        NOT NULL,
    "subject"         TEXT,
    "body"            TEXT        NOT NULL,
    "daysBeforeEvent" INTEGER,
    "sentAt"          TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── ScheduledNotificationJob ────────────────────────────────────────────────

CREATE TABLE "ScheduledNotificationJob" (
    "id"          TEXT        NOT NULL,
    "templateId"  TEXT        NOT NULL,
    "inviteeId"   TEXT,
    "guestId"     TEXT,
    "recipient"   TEXT        NOT NULL,
    "status"      TEXT        NOT NULL DEFAULT 'pending',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt"      TIMESTAMP(3),
    "error"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledNotificationJob_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ScheduledNotificationJob"
    ADD CONSTRAINT "ScheduledNotificationJob_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Invitee ─────────────────────────────────────────────────────────────────

CREATE TABLE "Invitee" (
    "id"        TEXT        NOT NULL,
    "eventId"   TEXT        NOT NULL,
    "name"      TEXT        NOT NULL,
    "email"     TEXT,
    "phone"     TEXT,
    "status"    TEXT        NOT NULL DEFAULT 'invited',
    "invitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitee_pkey" PRIMARY KEY ("id")
);

-- Partial unique index: only enforce uniqueness when email is non-null
-- (a row with email=NULL doesn't collide with anything)
CREATE UNIQUE INDEX "Invitee_eventId_email_key" ON "Invitee"("eventId", "email");

ALTER TABLE "Invitee"
    ADD CONSTRAINT "Invitee_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── SuperAdminAuditLog ───────────────────────────────────────────────────────

CREATE TABLE "SuperAdminAuditLog" (
    "id"         TEXT        NOT NULL,
    "actorEmail" TEXT        NOT NULL,
    "action"     TEXT        NOT NULL,
    "targetType" TEXT        NOT NULL,
    "targetId"   TEXT        NOT NULL,
    "meta"       JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminAuditLog_pkey" PRIMARY KEY ("id")
);
