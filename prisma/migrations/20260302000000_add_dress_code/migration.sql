-- Add dress code field to Event table.
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "dressCode" TEXT NOT NULL DEFAULT 'none';
