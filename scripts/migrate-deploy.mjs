#!/usr/bin/env node
/**
 * Smart migration script for Railway deployments.
 *
 * Handles three scenarios:
 *
 * A) Fresh DB — no tables exist, _prisma_migrations absent or corrupted.
 *    Drop _prisma_migrations if present (clears any stale/failed records from
 *    a previous botched deploy), then run prisma migrate deploy from scratch.
 *
 * B) Baseline DB — schema was created outside of Prisma migrations (e.g. via
 *    db push). Event table exists but migration 1 may not be tracked.
 *    Resolve migration 1 as applied, then deploy remaining migrations.
 *
 * C) Already-migrated DB — normal case, prisma migrate deploy is a no-op or
 *    applies any new migrations.
 */

import { execSync } from 'child_process'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const BASELINE_MIGRATION = '20260226000000_add_multilingual_support'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

let isBaselineDb = false
try {
  await prisma.$queryRawUnsafe('SELECT 1 FROM "Event" LIMIT 1')
  isBaselineDb = true
} catch {
  isBaselineDb = false
}

if (isBaselineDb) {
  // Scenario B/C: tables exist
  console.log('Existing database detected — resolving baseline migration...')
  await prisma.$disconnect()
  try {
    execSync(`npx prisma migrate resolve --applied ${BASELINE_MIGRATION}`, {
      stdio: 'inherit',
    })
  } catch {
    // Already resolved, safe to ignore
  }
} else {
  // Scenario A: fresh or broken state (Event table missing).
  // Drop _prisma_migrations so deploy starts from a clean slate.
  // This also clears any failed-migration records left by a previous bad deploy.
  console.log('Fresh database detected — clearing any stale migration state...')
  try {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "_prisma_migrations"')
    console.log('Cleared migration tracking table.')
  } catch (e) {
    console.log('Migration tracking table absent, continuing...')
  }
  await prisma.$disconnect()
}

execSync('npx prisma migrate deploy', { stdio: 'inherit' })
