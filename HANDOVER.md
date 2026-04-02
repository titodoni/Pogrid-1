# 🤝 HANDOVER.md — Pogrid-1

> **For the next AI agent / developer picking this up.**  
> Last updated: 2026-04-02 | Author: Tito Doni Asmoro  
> Repo: https://github.com/titodoni/Pogrid-1  
> Linear: https://linear.app/pogrid/project/pogrid-1-web-app

---

## 🧭 Project Overview

**Pogrid** is a B2B SaaS real-time laundry management web app for Indonesian laundry businesses. It replaces WhatsApp chaos and paper-based PO tracking with a role-based, real-time floor management system.

- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **State management:** Zustand (`store/uiStore.ts`)
- **Mock data layer:** `lib/mockData.ts` (no real DB yet)
- **Future DB:** Turso (libSQL/SQLite edge) + Prisma ORM
- **Future auth:** iron-session (PIN-based, role-based)
- **Future real-time:** Pusher Channels
- **Deployment target:** Vercel
- **Design language:** Neo-brutalism — bold 2px borders, dark theme, high contrast
- **UI copy language:** Bahasa Indonesia (app is for Indonesian users)

---

## ✅ What Has Been Completed

### Phase 1 — App UI Shell (IN PROGRESS 🔄)

#### ✅ POG-26 — Department Select Screen (`/select-dept`)
- Route: `app/select-dept/`
- Department grid UI with card selection
- Each card triggers the `OriginDrawer` on click
- Passes `triggerRect` (card bounding box) to `OriginDrawer` for animation origin

#### ✅ POG-27 — OriginDrawer Component (heavily iterated today)
- Component: `components/` (inside layout or ui subfolder)
- **Current behavior (latest commit `abc3faf`):** Anchored to the clicked card, expands downward as a contextual panel — NO viewport math, NO bottom sheet on desktop
- Mobile: full-width bottom sheet with drag handle
- Desktop: card-anchored panel that grows downward
- Animation: shared origin expansion from card position
- **This component had ~15 commits of refinement today** — the latest `abc3faf` is the final correct version

#### ✅ POG-28 — UserPanel Component
- Shows user info, role, department after login
- Used in the dashboard shell

#### 🔄 POG-29 — PIN Login Page (`/login`) — **CURRENT ACTIVE TASK**
- Route: `app/login/`
- Directory exists but PIN login UI may be incomplete
- Needs: 4-digit numeric keypad, role display, mock submit → redirect to `/board` or `/jobs`

---

## 🗂️ Full Repo Structure (as of 2026-04-02)

```
Pogrid-1/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Root redirect (→ /select-dept)
│   ├── layout.tsx              # Root layout
│   ├── globals.css             # Global styles
│   ├── favicon.ico
│   ├── fonts/
│   ├── select-dept/            # ✅ Phase 1 — Dept select screen
│   ├── login/                  # 🔄 Phase 1 — PIN login page (in progress)
│   ├── board/                  # 📋 Phase 6 — Board view
│   ├── jobs/                   # 📋 Phase 4 — Worker my jobs
│   ├── pos/                    # 📋 Phase 12 — PO creation
│   ├── issues/                 # 📋 Phase 9 — Issue tracking
│   ├── invoicing/              # 📋 Phase 10 — Finance/invoicing
│   ├── analytics/              # 📋 Phase 13 — Manager analytics
│   ├── departments/            # 📋 Admin dept management
│   ├── users/                  # 📋 Admin user management
│   ├── export/                 # 📋 Data export
│   └── settings/               # 📋 App settings
│
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── layout/                 # Layout shell components
│   └── providers/              # Context providers (Zustand, etc.)
│
├── lib/
│   └── mockData.ts             # 13KB mock data — POs, items, users, departments
│
├── store/
│   └── uiStore.ts              # 7KB Zustand store — UI state, drawer, session
│
├── AGENTS.md                   # Agent-specific instructions (READ THIS)
├── HANDOVER.md                 # ← this file
├── POGrid-Manifesto-v3.5.md    # 62KB full product spec & business logic
├── UIUX.md                     # 43KB UI/UX design guidelines
├── DASHBOARD_REPORT_GUIDELINE.md  # Dashboard & report spec
├── database-protocol.md        # DB schema spec & migration protocol
├── next.config.mjs
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🔄 Currently Active Work

### **POG-29 — PIN Login Page** ← START HERE

The `/login` route directory exists. The PIN login page needs:

1. **Display** — show selected dept name + role (from Zustand `uiStore`)
2. **PIN pad** — 4-digit numeric keypad (0–9), backspace, submit
3. **State** — PIN digits stored locally in component state (not Zustand)
4. **Mock submit** — match PIN against `lib/mockData.ts` users, set session in `uiStore`, redirect to `/board` or `/jobs` based on role
5. **Design** — neo-brutalist dark, bold border inputs, no soft shadows

> Check `store/uiStore.ts` to see existing session shape and `lib/mockData.ts` for mock user PIN data.

---

## 🗺️ Full Phase Roadmap

| Phase | Linear | Title | Status | Priority |
|-------|--------|-------|--------|----------|
| 1 | POG-26/27/28 | Dept Select + OriginDrawer + UserPanel | ✅ Done | — |
| 1 | POG-29 | PIN Login page | 🔄 In Progress | 🔴 Urgent |
| 2 | POG-35 | DB Schema — Prisma + Turso/libSQL + seed | 📋 Todo | 🔴 Urgent |
| 3 | POG-36 | Auth API — `/api/auth/login`, `/api/me`, iron-session | 📋 Todo | 🔴 Urgent |
| 4 | POG-37 | Worker: My Jobs feed + ItemCard with progress controls | 📋 Todo | 🔴 Urgent |
| 5 | POG-38 | Real-time Pusher — channel + event broadcasting | 📋 Todo | 🔴 Urgent |
| 6 | POG-39 | Board View — full floor visibility + filter chips | 📋 Todo | 🟠 High |
| 7 | POG-40 | QC Gate — item split protocol + Rework spawn | 📋 Todo | 🔴 Urgent |
| 8 | POG-41 | Delivery Gate — client return protocol | 📋 Todo | 🔴 Urgent |
| 9 | POG-42 | Issue Tracking — Laporkan Masalah + 3-day escalation | 📋 Todo | 🟠 High |
| 10 | POG-43 | Finance/Invoicing — paid toggle, PO auto-close | 📋 Todo | 🟠 High |
| 11 | POG-44 | Notification System — in-app bell, tier 1/2/3 | 📋 Todo | 🟡 Medium |
| 12 | POG-45 | PO Creation — Admin/Manager multi-item entry form | 📋 Todo | 🟠 High |
| 13 | POG-46 | Manager Analytics + Admin Panel + hardening | 📋 Todo | 🟡 Medium |

---

## 🏗️ Architecture Decisions

| Concern | Decision | Reason |
|---------|----------|--------|
| Framework | Next.js 14 App Router | SSR, API routes, edge-ready |
| Database | Turso (libSQL/SQLite) + Prisma | Low cost, edge-compatible |
| Auth | iron-session (cookie) + PIN | Simple PIN auth, no OAuth needed |
| Real-time | Pusher Channels | Managed WS, easiest for role broadcast |
| State | Zustand | Lightweight, already set up in `store/uiStore.ts` |
| Styling | Tailwind CSS + shadcn/ui | Already configured |
| Deployment | Vercel | Already in use |

---

## 🔑 Environment Variables Needed (Phase 2+)

```env
# Turso DB
DATABASE_URL="libsql://your-db-name.turso.io"
DATABASE_AUTH_TOKEN="your-auth-token"

# iron-session
SESSION_SECRET="min-32-char-secret-string-here"
SESSION_COOKIE_NAME="pogrid_session"

# Pusher
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

---

## 📌 Critical Rules for Next Agent

1. **Read `AGENTS.md` first** — it has specific agent instructions for this project
2. **Read `POGrid-Manifesto-v3.5.md`** for full product logic before building any feature
3. **Read `UIUX.md`** before touching any UI — strict design system must be followed
4. **Read `database-protocol.md`** before touching any data layer (Phase 2+)
5. **All phase tasks are tracked in Linear** — update issue status when done
6. **Commit convention:** `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` + scope in parens e.g. `fix(OriginDrawer): ...`
7. **Mock data is in `lib/mockData.ts`** — use it for all UI work until Phase 2 (real DB)
8. **Zustand store is in `store/uiStore.ts`** — check existing shape before adding state
9. **Do NOT install new packages without checking** `package.json` first for duplicates
10. **UI language is Bahasa Indonesia** — all button labels, toasts, and user-facing copy

---

## 👤 Project Owner

- **Name:** Tito Doni Asmoro
- **GitHub:** [@TitoDoni](https://github.com/titodoni)
- **Location:** Bandar Lampung, Indonesia
- **Preferred agents:** Kimi 2.5, Claude, Lovable
- **Dev env:** VS Code + WSL Ubuntu + PowerShell + Vercel
