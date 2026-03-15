#!/usr/bin/env node
/**
 * Smart migration script for Railway deployments.
 *
 * Problem: `prisma migrate resolve --applied <migration>` is needed for baseline
 * databases (schema created outside Prisma), but on a fresh DB it marks migration 1
 * as applied WITHOUT running its SQL — so migrations 2+ fail trying to ALTER
 * non-existent tables.
 *
 * Solution: Only resolve the baseline migration when the DB already has tables.
 */

import { execSync } from 'child_process'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const BASELINE_MIGRATION = '20260226000000_add_multilingual_support'

async function isBaselineDb() {
  let prisma
  try {
    const { PrismaClient } = require('@prisma/client')
    prisma = new PrismaClient()
    await prisma.$queryRawUnsafe('SELECT 1 FROM "Event" LIMIT 1')
    return true
  } catch {
    return false
  } finally {
    await prisma?.$disconnect()
  }
}

const baseline = await isBaselineDb()

if (baseline) {
  console.log('Existing database detected — resolving baseline migration...')
  try {
    execSync(`npx prisma migrate resolve --applied ${BASELINE_MIGRATION}`, {
      stdio: 'inherit',
    })
  } catch {
    // Already resolved, safe to ignore
  }
} else {
  console.log('Fresh database detected — running all migrations from scratch...')
}

execSync('npx prisma migrate deploy', { stdio: 'inherit' })
