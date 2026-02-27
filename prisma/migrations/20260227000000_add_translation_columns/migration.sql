-- Add multilingual translation columns to existing tables.
-- Uses IF NOT EXISTS so this is safe to run on a fresh DB where the
-- first migration already created these columns.

-- Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "nameTranslations"        JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "locationTranslations"    JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "descriptionTranslations" JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "supportedLanguages"      TEXT[] DEFAULT ARRAY['en']::TEXT[];
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "defaultLanguage"         TEXT NOT NULL DEFAULT 'en';

-- EventPage
ALTER TABLE "EventPage" ADD COLUMN IF NOT EXISTS "titleTranslations"    JSONB;
ALTER TABLE "EventPage" ADD COLUMN IF NOT EXISTS "subtitleTranslations" JSONB;

-- Question
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "labelTranslations"       JSONB;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "descriptionTranslations" JSONB;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "optionsTranslations"     JSONB;

-- MediaFile (may not exist on older deployments)
CREATE TABLE IF NOT EXISTS "MediaFile" (
    "id"         TEXT NOT NULL,
    "url"        TEXT NOT NULL,
    "key"        TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "size"       INTEGER NOT NULL,
    "type"       TEXT NOT NULL,
    "mimeType"   TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MediaFile_key_key" ON "MediaFile"("key");
