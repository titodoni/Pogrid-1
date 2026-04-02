# POGrid SaaS — Agent Guide

> This file is the single source of truth for AI coding agents working on this project. Read it before making any changes.

---

## 1. Project Overview

**POGrid** is a real-time, mobile-first Purchase Order visibility SaaS for Indonesian manufacturing SMEs. It allows workshop owners to check the status of all active jobs across the floor in under 10 seconds — without asking anyone — and spot bottlenecks instantly.

**Core paradigm:** The PO is a container; the **Item** is the atomic unit that moves independently through production stages.

**Deployment model:** Single-tenant SaaS. 1 Client = 1 Vercel deploy + 1 Turso DB + 1 custom domain. The Prisma schema must NEVER contain a `tenantId` or `companyId`.

**Current state of the codebase:** This repository is an early-stage Next.js 14 project bootstrapped with `create-next-app`. At the time of writing, the only existing code lives under `app/` and is the default starter template (`page.tsx`, `layout.tsx`, `globals.css`). All business logic, API routes, components, Prisma schema, and stores are **planned** per the product manifesto and UI/UX guidelines committed in this repo.

---

## 2. Technology Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js | 14 (App Router). DO NOT upgrade to Next.js 15. |
| UI Library | React | 18. DO NOT upgrade to React 19. |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | v3. Config file is `tailwind.config.ts`. DO NOT use v4. |
| Component Library | shadcn/ui | To be installed (for Tailwind v3). Built on Radix UI. |
| Database ORM | Prisma | 5.22.x. DO NOT migrate to Prisma 6. |
| Database | Turso (libSQL) | Remote SQLite via `@prisma/adapter-libsql` |
| Prisma Adapter | **PrismaLibSQL** | ALL CAPS import from `@prisma/adapter-libsql` |
| Global State | Zustand | v5 — UI state only |
| Server State | TanStack React Query | v5 — server data and mutations |
| Real-time | Pusher Channels | `ap1` cluster. `pusher-js` (client), `pusher` (server) |
| Auth | iron-session | Non-edge cookie sessions. No Prisma in `middleware.ts`. |
| Hashing | bcryptjs | v3+ uses named exports: `import { hashSync } from 'bcryptjs'` |
| Icons | lucide-react | — |
| PDF Generation | @react-pdf/renderer | Server-side API routes (planned) |
| ID Generation | `@paralleldrive/cuid2` | Generate IDs in API routes, not DB defaults inside transactions. |
| Script Runner | **tsx** | REQUIRED. Replaces `ts-node` everywhere. |

---

## 3. Project Structure

### Existing directories and files
```
app/
  fonts/           # Geist font files (local)
  favicon.ico
  globals.css      # Tailwind directives + CSS variables
  layout.tsx       # Root layout with Geist fonts
  page.tsx         # Default Next.js landing page (starter content)

Config files:
  package.json
  next.config.mjs
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  .eslintrc.json

Documentation (authoritative):
  POGrid-Manifesto-v3.5.md      # Product truth, schema, API reference
  DASHBOARD_REPORT_GUIDELINE.md # Dashboard UI specification
  UIUX.md                         # Unified UI/UX guidelines
  database-protocol.md            # Database connection troubleshooting
```

### Planned module divisions (from manifesto)
When implementing features, create these directories:
- `app/api/**` — Next.js API route handlers
- `app/(pages)/**` — App Router pages (e.g., `/login`, `/dashboard`)
- `lib/` — Core utilities
  - `lib/db.ts` — Prisma client with Turso adapter
  - `lib/session.ts` — iron-session helpers
  - `lib/pusher.ts` — Pusher server & client init
  - `lib/utils.ts` — Helper functions
  - `lib/constants.ts` — App constants & config
- `components/` — React components
- `store/` — Zustand stores (e.g., `store/uiStore.ts`)
- `prisma/` — Prisma schema and seed scripts

---

## 4. Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Database initialization workflow (planned)
```bash
# Step 1: Generate Prisma Client
npx prisma generate

# Step 2: Create local dev.db (for Prisma Studio, optional)
npx prisma db push

# Step 3: Seed Turso database (env must be in .env.local)
npx dotenv -e .env.local -- npx tsx prisma/seed.ts
# or, once added to package.json:
npm run db:seed
```

---

## 5. Code Style and Conventions

### TypeScript / Next.js
- Strict mode is enabled in `tsconfig.json`.
- Path alias `@/*` maps to `./*`.
- All API routes MUST export:
  ```ts
  export const dynamic = 'force-dynamic';
  ```
- All API routes MUST verify the iron-session user via `lib/session.ts` before any DB operation.

### Critical file naming convention (exact names only)
| Purpose | Correct File | Forbidden Names |
|---|---|---|
| Prisma client + Turso adapter | `lib/db.ts` | `lib/prisma.ts`, `lib/database.ts` |
| Iron Session helpers | `lib/session.ts` | `lib/auth.ts`, `lib/iron-session.ts` |
| Pusher server & client | `lib/pusher.ts` | `lib/pusher-server.ts`, `lib/pusher-client.ts` |
| Utilities | `lib/utils.ts` | `lib/helpers.ts`, `lib/cuid.ts` |
| Constants | `lib/constants.ts` | `lib/config.ts`, `lib/const.ts` |

### Environment loading protocol (CRITICAL)
ES modules hoist static imports **before** `dotenv.config()` runs. In any standalone script (`prisma/seed.ts`, `scripts/*.ts`), you MUST:

1. Load `.env.local` first.
2. Use **dynamic imports** for anything that depends on env vars (including `lib/db.ts`).

```ts
// ✅ REQUIRED in seed.ts / scripts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { prisma } = await import('@/lib/db');
  // ... use prisma
}
```

Next.js pages and API routes can use standard imports because Next.js loads env automatically.

### Prisma conventions
- **No enums** in the schema. Use `String` fields with `@default("value")`.
- Schema URL must be hardcoded as `file:./dev.db` (not `env()`).
- Runtime data goes to Turso via the adapter.
- All multi-table writes MUST use `prisma.$transaction`.

### CSS / Tailwind conventions
- Mobile-first design. Standard page padding:
  - Horizontal: `px-4`
  - Top: `pt-14` (accounts for sticky header)
  - Bottom: `pb-24` (accounts for bottom nav)
- **Never** use `top-14` for sticky headers. Use `sticky top-0` with a header height of `h-14`.

---

## 6. Testing

There is **no testing framework currently installed** (no Jest, Vitest, or Playwright). If you add one, prefer the smallest viable setup that works with Next.js 14 and TypeScript. Update this section when tests are introduced.

---

## 7. Security Considerations

- **PIN-based auth:** Worker and admin PINs are bcrypt-hashed in the DB. Never log or transmit plain-text PINs.
- **Iron Session:** Cookie is `httpOnly`, `sameSite: 'strict'`, and `secure` in production. Password comes from `IRON_SESSION_PASSWORD` env var.
- **No Prisma in middleware:** `middleware.ts` (if created) must only check cookie existence via iron-session. All auth logic happens in API routes.
- **Env vars:** Use `.env.local` for secrets. Never commit it.

---

## 8. Key Environment Variables

```env
# Branding
NEXT_PUBLIC_CLIENT_NAME="PT. Maju Jaya"
NEXT_PUBLIC_BRAND_COLOR="#2A7B76"
NEXT_PUBLIC_BRAND_COLOR_DARK="#1D5E5A"
NEXT_PUBLIC_CLIENT_LOGO_URL="/logo.png"

# Database
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."

# Auth
IRON_SESSION_PASSWORD="..."
SUPER_ADMIN_PIN="052072"

# Real-time
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

---

## 9. Reference Documents

Always consult these files before changing business logic or UI behavior:
- **`POGrid-Manifesto-v3.5.md`** — Product truth, schema, API route reference, state management patterns, locked workflow decisions.
- **`UIUX.md`** — Global UI/UX hard rules, spacing, typography, color, component behavior.
- **`DASHBOARD_REPORT_GUIDELINE.md`** — `/dashboard` page specification (management-only view).
- **`database-protocol.md`** — Troubleshooting guide for Prisma + Turso adapter issues.

If a conflict arises between this guide and the manifesto, **the manifesto wins**, especially `§26 Workflow Truth v1.1`.
