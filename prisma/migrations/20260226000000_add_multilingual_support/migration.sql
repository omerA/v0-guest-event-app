-- AddMultilingualSupport
-- Adds language support fields to Event, EventPage, and Question models

-- Event: supported languages, default language, and translation JSON fields
ALTER TABLE "Event" ADD COLUMN "supportedLanguages" TEXT[] NOT NULL DEFAULT ARRAY['en']::TEXT[];
ALTER TABLE "Event" ADD COLUMN "defaultLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Event" ADD COLUMN "nameTranslations" JSONB;
ALTER TABLE "Event" ADD COLUMN "locationTranslations" JSONB;
ALTER TABLE "Event" ADD COLUMN "descriptionTranslations" JSONB;

-- EventPage: translation JSON fields for title and subtitle
ALTER TABLE "EventPage" ADD COLUMN "titleTranslations" JSONB;
ALTER TABLE "EventPage" ADD COLUMN "subtitleTranslations" JSONB;

-- Question: translation JSON fields for label, description, and options
ALTER TABLE "Question" ADD COLUMN "labelTranslations" JSONB;
ALTER TABLE "Question" ADD COLUMN "descriptionTranslations" JSONB;
ALTER TABLE "Question" ADD COLUMN "optionsTranslations" JSONB;
