
  The main issues we encountered:

  1. Version mismatch between @prisma/adapter-libsql and prisma
  2. bcryptjs v3+ import syntax change
  3. Prisma schema with sqlite provider but Turso URL requires driverAdapters approach
  4. Turso database initialization (schema creation)

  Let me write a comprehensive summary.
• POGrid Database Connection Protocol - Error Analysis & Resolution

  Executive Summary

  During POGrid Phase 0.6-0.7 (Database Setup & Seeding), we encountered a cascade of compatibility issues when connecti
  ng Prisma 5.22.x to Turso via @prisma/adapter-libsql. This document details the root causes, underlying logic, and def
  initive fixes.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  1. The Adapter Version Mismatch Error

  Error Manifestation

  TypeError: import_adapter_libsql.PrismaLibSql is not a constructor
  TypeError: Cannot read properties of undefined (reading 'bind')

  Root Cause

  Version skew between Prisma core and the LibSQL adapter.

   Package                   Installed (Wrong)   Required (Correct)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   prisma / @prisma/client   5.22.0              5.22.0 ✓
   @prisma/adapter-libsql    7.6.0               5.22.0
   @libsql/client            0.17.2              0.8.0

  Logic: Prisma 7.x adapter exports changed to PrismaLibSql (lowercase "ql"), while 5.x uses PrismaLibSQL (uppercase "SQ
  L"). Additionally, v7 adapter has peer dependencies that don't align with Prisma 5.22's expected driver adapter interf
  ace.

  The Fix

  # Downgrade to matching versions
  npm install @libsql/client@0.8.0 --save
  npm install @prisma/adapter-libsql@5.22.0 --save
  npx prisma generate  # Regenerate client with driverAdapters preview feature

  Correct Import Pattern (Prisma 5.22.x)

  // lib/prisma.ts AND prisma/seed.ts
  import { PrismaLibSQL } from '@prisma/adapter-libsql'  // ALL CAPS: SQL not Sql
  const adapter = new PrismaLibSQL(libsqlClient)

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  2. The bcryptjs v3+ Import Error

  Error Manifestation

  TypeError: Cannot read properties of undefined (reading 'bind')
  at bcrypt (prisma/seed.ts:18:16)

  Root Cause

  bcryptjs v3.0.3 changed from default export to named export.

   Version   Import Syntax
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   v2.x      import bcrypt from 'bcryptjs' → bcrypt.hashSync()
   v3.x      import { hashSync } from 'bcryptjs' → hashSync()

  The Fix

  // prisma/seed.ts - BEFORE (broken)
  import bcrypt from 'bcryptjs'
  bcrypt.hashSync('0000', 10)

  // AFTER (fixed)
  import { hashSync } from 'bcryptjs'
  hashSync('0000', 10)

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  3. The Turso Schema Initialization Challenge

  Error Manifestation

  SQLITE_UNKNOWN: SQLite error: no such table: main.SystemConfig

  Root Cause

  Prisma's db push targets the local file, not Turso remote.

  Our schema.prisma uses:

  datasource db {
    provider = "sqlite"
    url      = "file:./dev.db"  // Local file for Prisma CLI validation
  }

  But the application connects to Turso via the adapter:

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,  // libsql://pogrid-xxx.turso.io
    authToken: process.env.TURSO_AUTH_TOKEN
  })

  Logic: Prisma Migrate/Push validates against the url in schema.prisma (local file), but the seed script uses the adapt
  er to connect to Turso. The Turso database was empty - no tables existed.

  The Fix: Two-Phase Initialization

  Phase A: Local Schema Validation

  npx prisma db push --accept-data-loss
  # Creates tables in local dev.db for Prisma CLI validation

  Phase B: Turso Schema Creation

  Created prisma/init-turso.ts that uses raw SQL via @libsql/client to create tables directly on Turso:

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  // Execute raw CREATE TABLE statements
  await client.execute(`CREATE TABLE IF NOT EXISTS "User" (...)`)

  Run order:

  1. npx tsx prisma/init-turso.ts - Create schema on Turso
  2. npx tsx prisma/seed.ts - Insert seed data via Prisma + adapter

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  4. Complete Database Connection Architecture

  File: prisma/schema.prisma

  generator client {
    provider        = "prisma-client-js"
    previewFeatures = ["driverAdapters"]  // REQUIRED for Turso
  }

  datasource db {
    provider = "sqlite"
    url      = "file:./dev.db"  // Placeholder for Prisma CLI validation only
  }

  File: lib/prisma.ts (Runtime Singleton)

  import { PrismaClient } from '@prisma/client'
  import { PrismaLibSQL } from '@prisma/adapter-libsql'  // ALL CAPS
  import { createClient } from '@libsql/client'

  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL!,      // libsql://...
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  const adapter = new PrismaLibSQL(libsql)  // ALL CAPS

  declare global {
    var prisma: PrismaClient | undefined
  }

  const prisma = global.prisma || new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') global.prisma = prisma

  export default prisma

  Environment Requirements

  # .env.local
  TURSO_DATABASE_URL="libsql://your-db-name.turso.io"
  TURSO_AUTH_TOKEN="your-token-here"

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  5. Development Workflow Protocol

  First-Time Setup

  # 1. Install compatible versions
  npm install @libsql/client@0.8.0 @prisma/adapter-libsql@5.22.0

  # 2. Generate Prisma Client
  npx prisma generate

  # 3. Create local file (for Prisma CLI validation)
  npx prisma db push --accept-data-loss

  # 4. Create Turso schema (one-time)
  npx tsx prisma/init-turso.ts

  # 5. Seed Turso database
  npx tsx prisma/seed.ts

  Subsequent Migrations

  When schema changes:

  1. Update prisma/schema.prisma
  2. Update prisma/init-turso.ts with new tables/fields
  3. Run npx tsx prisma/init-turso.ts to apply to Turso
  4. Run npx prisma generate to update client

  Re-seeding (Idempotent)

  The seed script uses upsert with hardcoded IDs, making it safe to re-run:

  • SystemConfig.id = 'singleton'
  • PoSequence.id = 'singleton'
  • Department.name (unique field)
  • User.name = 'Administrator' (unique field)

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  6. Key Rules for Future Development

   Rule                                Rationale
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Never change url in schema.prisma   Must remain file:./dev.db for Prisma CLI compatibility
   Always use adapter at runtime       The adapter bridges Prisma Client to Turso
   Keep versions synchronized          @prisma/adapter-libsql version MUST match prisma version
   Use PrismaLibSQL (ALL CAPS)         v5.22 export name; v7 uses PrismaLibSql
   Seed uses hardcoded IDs             Enables idempotent upserts
   Initialize Turso separately         Raw SQL via libsql client, not Prisma Migrate

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  7. Troubleshooting Checklist

   Symptom                                                Likely Cause            Fix
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PrismaLibSql is not a constructor                      Version mismatch        Downgrade adapter to 5.22.0
   cannot read properties of undefined (reading 'bind')   bcryptjs import         Use named import { hashSync }
   no such table: main.X                                  Turso not initialized   Run init-turso.ts first
   SQLITE_ERROR: table X already exists                   Init script re-run      Safe to ignore (CREATE IF NOT EXISTS)
   env var not found                                      dotenv not loaded       Ensure dotenv.config() is first line

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  8. Summary

  The Turso + Prisma + LibSQL adapter stack requires careful version alignment and a two-tier database strategy:

  • Schema definition: Local SQLite file (Prisma CLI validation)
  • Runtime data: Remote Turso (via driver adapter)

  The adapter pattern decouples Prisma's migration tooling from the actual database connection, enabling edge-compatible
  SQLite (Turso) while maintaining Prisma's full feature set.