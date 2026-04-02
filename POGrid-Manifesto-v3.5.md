# POGrid — Product Manifesto & System Truth
> **Version:** 3.5 | **Updated:** 2026-03-31
> **Status:** LOCKED — Single Source of Truth for all AI Coding Agents, Developers, and Product Owners.

### Changelog from v3.3 → v3.5
- §22 CRITICAL: Environment Loading Protocol added — prevents #1 initialization failure
- §22 CRITICAL: Dynamic Import Pattern documented for all scripts
- §22 CRITICAL: File Naming Convention standardized (`lib/db.ts`, `lib/session.ts`)
- §22 ADDED: `tsx` script runner — replaces `ts-node` everywhere
- §23 CRITICAL: Prisma Schema URL must be `file:./dev.db` (not `env()`)
- §23 NEW: Database initialization workflow with two-tier strategy
- §26 NEW: Workflow Truth v1.1 integrated — all Q&A decisions locked
- `ReturnItem` schema simplified to log-only (removed `stage`, `progress`, `resolved`)
- `ItemTrack.action` updated to include `CLIENT_RETURN`
- Sales role confirmed as read-only (exists in system)
- §24 API route reference updated to use `lib/session.ts` (not `lib/auth.ts`)

---

## TABLE OF CONTENTS

1. What Is POGrid (And What It Is Not)
2. The Single-Tenant SaaS Model
3. The Item-Centric Paradigm
4. The 8-Stage Lifecycle & Routing
5. The Item Split Protocol (Rework)
6. Issue Tracking (Laporkan Masalah)
7. UI/UX & Design System (LOCKED)
8. Competitive Positioning & Feature Boundary
9. The QC Pass Gate Protocol
10. The Rework Breadcrumb
11. Offline Awareness
12. The Delivery Confirmation Gate & Return Protocol
13. Role-Based Navigation & View Rules
14. Job List Behavior Rules
15. Analytics Dashboard
16. Notification Tier System
17. Finance Invoicing Flow
18. PO Numbering System
19. Export System (PDF + Presentation)
20. Return/NG Delivery Protocol
21. Super Admin (`/admin`) Spec
22. Tech Stack & Architecture Reference ⚠ CRITICAL UPDATES
23. Database Schema Reference ⚠ CRITICAL UPDATES
24. API Route Reference
25. State Management Reference
26. **Workflow Truth v1.1 — Locked Decisions** ← NEW

---

## §1. WHAT IS POGRID (AND WHAT IT IS NOT)

**POGrid is a real-time, mobile-first Purchase Order visibility SaaS for Indonesian manufacturing SMEs.**

### The Core Promise
> A workshop owner can check the status of ALL active jobs across the floor in under 10 seconds — without asking anyone — and spot bottlenecks instantly.

### The Competitive Position
> POGrid is the Shop Floor visibility tool that Odoo's and Fishbowl's SME customers wish they had — without the ERP tax. No BOM, no MRP, no Gantt. Just: what is happening on the floor right now, who is blocked, and what needs the owner's attention — on a phone.

### It Is NOT:
- A project management tool (no Gantt charts, no per-stage deadlines)
- A supplier portal (suppliers do not log in)
- A communication app (chat/comments are outside scope)
- A multi-tenant monolith (each client gets an isolated instance)
- An ERP (no Bill of Materials, no MRP, no inventory replenishment, no accounting ledger)

---

## §2. THE SINGLE-TENANT SAAS MODEL

**1 Client = 1 Vercel Deploy + 1 Turso DB + 1 Custom Domain.**

- The codebase is identical across all clients.
- Customization (Client Name, Brand Color, Logo) is driven purely by Vercel `.env` variables.
- Pricing: 500,000 IDR/month per client instance.
- **Hard Rule:** The Prisma schema must NEVER contain a `tenantId` or `companyId`. The database is already isolated per client.

### Environment Variables (Per Client)
```env
NEXT_PUBLIC_CLIENT_NAME="PT. Maju Jaya"
NEXT_PUBLIC_BRAND_COLOR="#2A7B76"
NEXT_PUBLIC_BRAND_COLOR_DARK="#1D5E5A"
NEXT_PUBLIC_CLIENT_LOGO_URL="/logo.png"
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
IRON_SESSION_PASSWORD="..."
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
SUPER_ADMIN_PIN="052072"
```

---

## §3. THE ITEM-CENTRIC PARADIGM

**The PO is just a container. The Item is the core entity.**

- A single PO contains multiple Items.
- Items within the same PO move independently. Item A can be in QC while Item B is still in Machining.
- Partial delivery and partial invoicing are tracked and executed at the **Item level**.
- PO status is derived automatically from the aggregate state of its Items.
- Workers never interact with the PO directly. They interact with Items only.

### PO Status Derivation Logic
```
ACTIVE     → At least one item is in progress (not DONE or PAID)
PARTIAL    → At least one item is PAID, at least one item is not yet PAID
COMPLETE   → All items are DONE (Delivery Gate passed), none are PAID yet
CLOSED     → All items are PAID (Finance confirmed)
LATE       → Current date > PO delivery_date AND at least one item is not DONE
```
> **Rule:** LATE can co-exist with ACTIVE or PARTIAL. A PO can be both LATE and PARTIAL.
> **Rule:** PO status is NEVER set manually. It is always computed. Store derived status in DB for query performance but recompute on every mutation.

---

## §4. THE 8-STAGE LIFECYCLE & ROUTING

### Corrected Lifecycle
```
DRAFTING → PURCHASING → MACHINING → FABRIKASI → QC → DELIVERY → DONE
```
> **Critical:** `DRAFTING` is NOT an inactive/pending state. It is a live work stage where the Drafter department produces technical drawings. Items are visible and actionable from the moment a PO is created.

### Stage Definitions

| Stage | Owner Department | Work Done | Advance Condition |
|---|---|---|---|
| `DRAFTING` | Drafter | Technical drawings produced | 100% progress → auto-advance to PURCHASING |
| `PURCHASING` | Purchasing | Materials sourced / vendor coordinated | 100% progress → auto-advance (per routing) |
| `MACHINING` | Machining | CNC / lathe / machining operations | 100% progress → auto-advance (per routing) |
| `FABRIKASI` | Fabrikasi | Welding / fabrication operations | 100% progress → auto-advance to QC |
| `QC` | QC | Quality inspection | Explicit QC Gate (§9) required |
| `DELIVERY` | Delivery | Physical delivery to client | Explicit Delivery Gate (§12) required |
| `DONE` | — | Delivered, awaiting invoicing | Finance unlocks |

### Routing Rules

```
production_type = "machining"    → DRAFTING → PURCHASING → MACHINING → QC → DELIVERY → DONE
production_type = "fabrication"  → DRAFTING → PURCHASING → FABRIKASI → QC → DELIVERY → DONE
production_type = "both"         → DRAFTING → PURCHASING → MACHINING → FABRIKASI → QC → DELIVERY → DONE
vendor_job = true                → DRAFTING → PURCHASING → QC → DELIVERY → DONE
```

> **Technical:** Store `production_type` (String: "machining" | "fabrication" | "both") and `vendor_job` (Boolean) on the Item model. Stage advancement logic reads these fields server-side in the API route, never in the UI.

### No Stage Blocking Rule
**All items are visible to all departments from the moment a PO is created.** There is no gate that prevents a downstream worker from seeing an upstream item. The My Jobs tab filters by actionable items for that department only. The Board shows everything.

### Urgent Flag Rule
- Admin sets `urgent = true` on a PO at creation or edit time.
- **ALL items in an urgent PO** inherit the urgent flag automatically.
- Urgent items: display a pulsing orange `URGENT` badge on the ItemCard.
- Urgent items: always pinned to the top of My Jobs AND the Board, overriding stale-sort.
- Urgent items: trigger a Tier 1 notification to all users when the PO is first activated.

### Terminal Gates (Non-Negotiable)
- QC → DELIVERY requires explicit QC Pass Gate (§9). No auto-advance.
- DELIVERY → DONE requires explicit Delivery Confirmation Gate (§12). No auto-advance.
- Finance invoicing unlocks ONLY after Delivery Gate is passed.

---

## §5. THE ITEM SPLIT PROTOCOL (REWORK)

Rework is NOT a separate status. It is a divergence event triggered at the QC Gate.

### The Split Flow
1. QC worker reaches 100% → QC Gate bottom-sheet opens.
2. Worker taps "Ada unit NG?" → Item Split bottom-sheet opens.
3. Worker selects NG quantity and reason (preset dropdown — see §9).
4. System executes a Prisma `$transaction`:
   - **Card A (Good):** Original Item record. `qty` decremented by NG qty. Advances to DELIVERY.
   - **Card B (Rework):** New Item record spawned. Name = `[OriginalName] - RW1`. `qty` = NG qty. `progress` = 0. `stage` = `QC`. `parentItemId` = Card A's ID. Red Issue auto-attached.

### All-NG Rule
If NG qty = original qty (all units fail):
- Card A stays as a record with original qty. Marked with `allNG = true` flag. Does NOT advance. Visible in history only.
- Card B spawns with full original qty.

### RW Generation Rule
- RW1 fails QC again → spawns RW2: `[OriginalName] - RW1 - RW2`
- No generation limit enforced by system.
- Each generation tracked via `parentItemId` chain.
- Analytics tracks RW count per item, per PO, per department.

### RW Routing Rule
**RW items always return to QC stage.** They are re-inspected only. If deeper rework is needed, Admin manually edits the RW item's `production_type` and re-routes via standard stage logic.

### Transaction Reference
```typescript
await prisma.$transaction(async (tx) => {
  // Update Card A
  await tx.item.update({
    where: { id: parentItemId },
    data: { qty: parentQty - ngQty, stage: 'DELIVERY', progress: 0 }
  });
  // Create Card B
  const rwItem = await tx.item.create({
    data: {
      id: generateCuid(),
      name: `${parentItem.name} - RW${rwGeneration}`,
      qty: ngQty,
      progress: 0,
      stage: 'QC',
      parentItemId: parentItemId,
      poId: parentItem.poId,
      productionType: parentItem.productionType,
      vendorJob: parentItem.vendorJob,
      urgent: parentItem.urgent,
    }
  });
  // Auto-attach Issue to RW item
  await tx.issue.create({
    data: {
      id: generateCuid(),
      itemId: rwItem.id,
      reason: ngReason,
      filedById: currentUserId,
      resolved: false,
    }
  });
  // Log ItemTrack for Card A
  await tx.itemTrack.create({
    data: {
      id: generateCuid(),
      itemId: parentItemId,
      department: 'QC',
      action: 'SPLIT_PASS',
      userId: currentUserId,
    }
  });
});
```

---

## §6. ISSUE TRACKING (LAPORKAN MASALAH)

### Core Rules
- Any worker can file an Issue on any Item from the ItemCard bottom-sheet.
- Filing does NOT lock the progress slider. Work continues unaffected.
- Multiple active issues can exist on a single item simultaneously.
- An Item with `issue.resolved = false` displays a red ISSUE badge overriding the stage badge.

### Issue States
```
OPEN → RESOLVED
```
Simple toggle. No intermediate states. No resolution notes required.

### Resolution Rules
- The worker who filed the issue can resolve it.
- Admin and Manager can resolve any issue.
- Other workers cannot resolve issues they did not file.

### 3-Day Escalation Rule
- If an issue remains `resolved = false` for 72 hours after creation:
  - Manager and Admin receive a Tier 2 escalation notification.
  - The issue card in `/issues` inbox displays a red `⚠ Belum diselesaikan 3 hari` badge.
- Implementation: Scheduled job (Vercel Cron or check on page load) compares `issue.createdAt` against current timestamp.

---

## §7. UI/UX & DESIGN SYSTEM (LOCKED)

### Core Principles
- **Mobile-First:** Primary users are workers on a shop floor using phones. Every interaction must be achievable with one thumb.
- **Zero Typing for Workers:** All worker input is tap, swipe, or select. No keyboard required for any worker task.
- **10-Second Truth:** The Board view must allow a Manager to assess all active bottlenecks in under 10 seconds.
- **Full Transparency:** No silos. All items visible to all workers from PO creation.

### Typography
- **Primary Font:** DM Sans (Google Fonts CDN)
- **Weights used:** 400 (body), 500 (labels), 600 (card titles), 700 (headers)
- **Base size:** 16px. Never go below 14px on mobile.

| Element | Weight | Size |
|---|---|---|
| Page Title | 700 | 24px |
| Card Title (Item) | 600 | 18px |
| Client Name | 400 | 13px |
| PO Number | 400 | 12px |
| Button Text | 500 | 14px |
| Badge Text | 500 | 12px |
| Nav Label | 500 | 12px |

### Color Palette (Dynamic via `.env`)

| Role | CSS Variable | Default Hex |
|---|---|---|
| Brand Primary | `--color-brand` | `#2A7B76` |
| Brand Dark | `--color-brand-dark` | `#1D5E5A` |
| Warning / Pending | `--color-warning` | `#DE8F26` |
| Danger / Issue | `--color-danger` | `#B33941` |
| Headers / Borders | `--color-navy` | `#1D3B4D` |
| Background | `--color-bg` | `#F8F9FA` |
| Surface | `--color-surface` | `#FFFFFF` |
| Text Primary | `--color-text` | `#1A1A2E` |
| Text Muted | `--color-muted` | `#6B7280` |

### Tailwind CSS Variable Injection
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
        'brand-dark': 'var(--color-brand-dark)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        navy: 'var(--color-navy)',
      }
    }
  }
}
```
```css
/* app/globals.css */
:root {
  --color-brand: #2A7B76;
  --color-brand-dark: #1D5E5A;
  --color-warning: #DE8F26;
  --color-danger: #B33941;
  --color-navy: #1D3B4D;
  --color-bg: #F8F9FA;
  --color-surface: #FFFFFF;
  --color-text: #1A1A2E;
  --color-muted: #6B7280;
}
```

### Stage Badge Chips

| Stage | Background | Text | Notes |
|---|---|---|---|
| `DRAFTING` | `#E5E7EB` | `#374151` | |
| `PURCHASING` | `#FEF3C7` | `#DE8F26` | |
| `MACHINING` | `#1D3B4D` | `#FFFFFF` | |
| `FABRIKASI` | `#1D3B4D` | `#FFFFFF` | |
| `QC` | `#D1FAE5` | `#2A7B76` | |
| `DELIVERY` | `#D1FAE5` | `#2A7B76` | |
| `DONE` | `#D1FAE5` | `#065F46` | |
| `ISSUE` | `#B33941` | `#FFFFFF` | Overrides ALL — highest priority |
| `URGENT` | `#DE8F26` | `#FFFFFF` | Pulsing animation |
| `VENDOR` | `#9CA3AF` | `#FFFFFF` | |
| `RETURN` | `#B33941` | `#FFFFFF` | |

**Badge render priority (highest wins):**
`ISSUE` > `URGENT` > `RETURN` > stage badge

### Worker ItemCard — Full Anatomy (LOCKED)

```
┌──────────────────────────────────────────┐
│ [PO Number]              [STAGE BADGE]   │
│ Item Name (600 weight, 18px)             │
│ Client Name (muted, 13px)               │
│ ↩ RW dari [ParentName]  (if rework)      │
│ ↩ RETURN dari [POName]  (if return)      │
│                                          │
│ ──────────────────────────────────────── │
│                                          │
│  Qty = 1:   [━━━━━━━━━━○──────] 68%     │
│  Qty > 1:   [  −  ]  7 / 10  [  +  ]   │
│                                          │
│ ──────────────────────────────────────── │
│                                          │
│ [Batalkan (gray/active)]  [🚩 Laporkan] │
└──────────────────────────────────────────┘
```

**Rules:**
- PO Number: small, muted, top-left.
- Stage Badge: top-right, renders per priority table above.
- Item Name: large, bold, prominent.
- Client Name: small muted below item name.
- Rework / Return pill: orange/red pill below item name (conditional).
- Progress Control: Slider for Qty=1, +/- for Qty>1. Large touch targets (min 48px height).
- Units display: `7 / 10 units` — never percentage for Qty>1. Percentage for Qty=1.
- Batalkan: left-aligned, gray when disabled, active when progress unsaved.
- Laporkan: right-aligned, always active, opens Issue bottom-sheet.

### Non-Worker View Card (Manager/Admin/Sales/Finance)

```
┌──────────────────────────────────────────┐
│ PO-2026-001             [STATUS BADGE]   │
│ PT. Maju Jaya                            │
│ Due: 30 Mar 2026         [URGENT]        │
│                                          │
│  3 items  |  1 DONE  |  1 ISSUE  |  1↩  │
│  ████████████░░░░░░░░  60% overall       │
│                                          │
│ [View Details]          [Export PDF]     │
└──────────────────────────────────────────┘
```

### Card Fade-Out Micro-Interaction (Worker only)
```css
.item-card-exit {
  animation: fadeOut 250ms ease-out forwards;
}
@keyframes fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}
.item-card-enter {
  animation: fadeIn 250ms ease-in forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
- After `fadeOut` completes (250ms): open Terminal Gate bottom-sheet.
- If worker cancels gate (taps outside): `fadeIn` plays, card re-appears at saved state.

### Bottom Navigation — Dynamic by Role (See §13)
- Fixed at bottom of screen.
- Renders tabs based on `user.department`.
- Active tab uses `--color-brand`.
- Inactive tabs use `--color-muted`.

### Board Filter Chips
Horizontal scrollable row at top of Board view:
```
[All]  [Urgent]  [Issue]  [Drafting]  [Purchasing]  [Machining]  [Fabrikasi]  [QC]  [Delivery]  [By Client ▾]
```
- Single tap to activate. Tap again to deactivate.
- `All` clears all active filters.
- `By Client` opens a bottom drawer with client list.

### History Tab
- Available on My Jobs for all workers.
- Shows items that have passed the Terminal Gate for that department.
- Sorted by `updatedAt DESC` (most recently completed first).
- Tap to view ItemCard in read-only mode.
- Default: hidden. Toggle `Lihat Selesai` chip to show.

---

## §8. COMPETITIVE POSITIONING & FEATURE BOUNDARY

The following features are **out of scope forever:**

| Feature | Reason Rejected |
|---|---|
| Bill of Materials (BOM) | POGrid tracks PO execution, not production recipes |
| Material Resource Planning (MRP) | SME clients do not run formal replenishment cycles |
| Gantt Chart / Capacity Scheduling | No per-stage deadlines by design |
| Supplier / Vendor Portal | Suppliers do not log in |
| Barcode / IoT Integration | Phone-first slider UX is a deliberate product decision |
| Accounting Sync (QuickBooks, Xero) | Status tracking only — no ledger entries |
| AI Forecasting / Demand Planning | Insufficient data volume at SME scale |
| Multi-location / Warehouse Management | Single-facility clients only |
| Serial Number / Lot Traceability | Item-level Qty tracking is sufficient |
| In-app Chat or Comments | Communication is outside scope |
| "Ready to Start" Stage Filter | Rejected. Full floor transparency is a core design value |
| Per-item pricing or invoice amounts | POGrid tracks status only — no financial data |
| Invoice numbers | Out of scope — Finance handles externally |

**The Feature Litmus Test:**
> Before adding any new feature: *"Does this help the owner see what is blocked in under 10 seconds?"* If no — it does not belong in POGrid.

---

## §9. THE QC PASS GATE PROTOCOL

### Trigger
Worker in QC department updates Item progress to 100%. Card fade-out animation plays (250ms). Then bottom-sheet opens.

### Bottom-Sheet: Path A — All Good
```
┌─────────────────────────────────────────┐
│   ✅ Semua unit lolos QC?               │
│                                         │
│   Bracket Siku — 10 units              │
│                                         │
│   [Batalkan]        [Kirim ke Delivery] │
└─────────────────────────────────────────┘
```
- Tapping "Kirim ke Delivery":
  - Item stage → `DELIVERY`
  - Progress resets to 0
  - Logged as `ItemTrack { department: 'QC', action: 'PASS_GATE' }`
  - Pusher broadcasts `item-updated` event
  - Delivery worker sees item appear in their My Jobs

### Bottom-Sheet: Path B — NG Found
```
┌─────────────────────────────────────────┐
│   ⚠️ Ada unit NG?                       │
│                                         │
│   Jumlah NG:  [ − ]  2  [ + ]          │
│                                         │
│   Alasan:                               │
│   ○ Dimensi tidak sesuai                │
│   ○ Surface / finishing NG              │
│   ○ Retak / crack                       │
│   ○ Salah material                      │
│   ○ Lainnya → [short text field]        │
│                                         │
│   [Batalkan]        [Laporkan Rework]   │
└─────────────────────────────────────────┘
```
- NG quantity input: +/- tappable buttons (zero typing).
- Reason: radio button preset. "Lainnya" is the only option that unlocks a text field.
- Tapping "Laporkan Rework": executes Item Split Protocol (§5).

### Batalkan Button — Full Behavior Spec

| State | Batalkan Behavior |
|---|---|
| Slider being dragged / +/- tapped but not saved | Active — resets to last saved value (local Zustand state, no API call) |
| Slider at saved position, no change | Visible but disabled (gray, non-interactive) |
| After save (mutation fired) | 5-second toast: `"Progress disimpan ✓ — Batalkan?"`. Tap fires compensating `PATCH /api/items/:id/progress`. After 5s, toast disappears, change is permanent. Pusher fires ONLY after 5-second window closes. |

**Technical Rules:**
- Batalkan state in Zustand `uiStore`. NOT React Query.
- `setTimeout` stored in `useRef`, cleared on tap or component unmount.
- Compensating API: `PATCH /api/items/:id/progress` with previous value in body.

---

## §10. THE REWORK BREADCRUMB

Any item where `parentItemId !== null` MUST display a **Rework Origin Pill** on its card. **Required from Phase 1.**

```
↩ RW dari Bracket Siku A
```

**Visual Spec:**
- Orange pill (`#DE8F26` bg, white text)
- 12px DM Sans, 500 weight
- Rendered below Item name on card
- Read-only, no interaction
- Always points to immediate parent, not the root ancestor

**Query Requirement:**
```typescript
include: {
  parent: { select: { name: true } }
}
```

---

## §11. OFFLINE AWARENESS

- Custom hook wrapping `navigator.onLine` + `online`/`offline` window events.
- Connection state stored in Zustand `connectionStatus` atom: `'online' | 'offline' | 'reconnecting'`.
- Offline banner: non-blocking top banner, Warning Orange (`#DE8F26`), text: `"Koneksi terputus. Coba lagi sebentar."`
- Reconnected toast: `"Terhubung kembali ✓"` (2s, auto-dismiss).
- No offline mutation queuing. Failed mutations show inline error state on the card.
- React Query: `refetchOnReconnect: true` (default — do not override).
- Mutations: `retry: 2` for automatic re-attempt on transient failures.
- Pusher hook handles `disconnected` and `reconnecting` states → updates `connectionStatus` atom.

---

## §12. THE DELIVERY CONFIRMATION GATE & RETURN PROTOCOL

### Trigger
Delivery worker updates Item progress to 100%. Card fade-out plays (250ms). Bottom-sheet opens.

### Bottom-Sheet: Delivery Confirmation
```
┌─────────────────────────────────────────┐
│   🚚 Konfirmasi Pengiriman              │
│                                         │
│   Bracket Siku — 8 units               │
│   Client: PT. Maju Jaya                │
│                                         │
│   [Batalkan]     [✅ Sudah Dikirim]    │
└─────────────────────────────────────────┘
```
- Confirming:
  - Item stage → `DONE` **(terminal and irreversible — no rollback, no manager approval)**
  - Finance invoicing unlocked for this item
  - Logged as `ItemTrack { department: 'DELIVERY', action: 'DELIVERY_GATE' }`
  - Pusher broadcasts `item-updated` + `finance-unlocked` events
- Cancelling (tap outside): progress returns to 99%. Card re-appears (fadeIn animation).

### Partial Delivery
- Delivery worker can use +/- to set partial progress (e.g., 5/8 units).
- Saving partial progress is a standard progress update — no gate triggered.
- Gate only triggers at 100%.
- Finance cannot invoice until Delivery Gate is fully passed (all units delivered).

### Return Protocol (Client Returns)
> **⚠ LOCKED DECISION (Workflow Truth v1.1):** Client returns do NOT spawn a new Item record. The original item is regressed to QC. A `ReturnItem` log entry is written.

1. Delivery worker taps `Return` button on a DELIVERY-stage ItemCard.
2. Worker inputs return qty (+/- buttons) + selects reason (preset list):
   - Rusak saat pengiriman
   - Spesifikasi tidak sesuai
   - Salah item
   - Lainnya → text field
3. System executes (inside `$transaction`):
   - Original Item `stage` → `QC`, `progress` reset to `0`
   - A `ReturnItem` log record is written: `id`, `originalItemId`, `qty`, `reason`, `filedById`, `createdAt`
   - `ItemTrack` entry written with `action: 'CLIENT_RETURN'`
4. Pusher emits `item:updated` — item reappears in QC on all clients.

> **`ReturnItem` is a LOG RECORD ONLY.** It has no `stage`, no `progress`, no active lifecycle. It records that a return event happened, nothing more.

---

## §13. ROLE-BASED NAVIGATION & VIEW RULES

### User Roles & Access Matrix

| Role | Login Route | Write Permissions |
|---|---|---|
| Super Admin | `/admin` | System config (branding, env). See §21. |
| Admin | `/login` (PIN) | Full CRUD: POs, Items, Users, Departments. Reset PINs. Upload logo. |
| Manager / Owner | `/login` (PIN) | Read all + Export PDF/Presentation |
| Sales | `/login` (PIN) | Read active POs + Export PDF |
| Finance | `/login` (PIN) | Mark Invoice PAID (per item). Read all. Export PDF. |
| Workers (all dept) | `/login` (PIN) | Progress updates on own-stage items. File/resolve Issues. |

> **⚠ LOCKED DECISION:** Sales exists in the system as a read-only role. Sales cannot create POs. Sales cannot touch items. `role = "sales"` is a valid string value.

### Bottom Navigation — Dynamic by Department

| Department | Visible Tabs |
|---|---|
| Admin | Board, POs, Issues, Departments, Users, Settings |
| Manager / Owner | Board, POs, Issues, Analytics, Export |
| Sales | Board, POs, Analytics |
| Finance | Board, Invoicing, POs (read-only), Analytics |
| Drafter | My Jobs, Board, History |
| Purchasing | My Jobs, Board, History |
| Machining | My Jobs, Board, Issues, History |
| Fabrikasi | My Jobs, Board, Issues, History |
| QC | My Jobs, Board, Issues, History |
| Delivery | My Jobs, Board, Issues, History |

### PO Management Access Rules
- Workers: no PO list, no PO controls.
- Sales: sees active POs (read-only, detailed summary).
- Finance: sees all POs grouped by invoicing status (read-only, with payment toggles).
- Admin: full CRUD on POs.
- Manager: reads all POs. No creation. Can mark PO COMPLETE/CLOSED manually if needed (override).

### Full Floor Visibility Rule
All items are visible on the Board to all roles. Workers' My Jobs tab filters to their department's actionable items only. The Board never filters by default — it shows all items across all stages.

---

## §14. JOB LIST BEHAVIOR RULES

### My Jobs Tab — Default State
- Shows items in the worker's current department stage.
- Sorted: **Urgent items first** (pinned), then **stale jobs** (`updatedAt ASC`).
- Completed items (passed Terminal Gate) hidden by default.

### History Tab
- Shows items that have completed the worker's stage (passed Terminal Gate).
- Sorted: `updatedAt DESC` (most recently completed first).
- Read-only ItemCards.
- Access: `Lihat Selesai` toggle chip at top of My Jobs, or dedicated `History` tab in bottom nav.

### Hari Ini Filter Chip
- Filters list to items with `createdAt` or `updatedAt` matching today's date.
- **Default:** Active for all worker roles.
- **Default:** Inactive for Manager/Owner/Admin.
- Toggle chip. Tap to activate/deactivate.

### Urgent Pin Rule
- Urgent items always at top of My Jobs AND Board.
- Urgent items display pulsing orange `URGENT` badge.
- Multiple urgent items: sub-sorted by `updatedAt ASC` (stale urgent first).

### Board View (Global)
- All items, all stages.
- Sorted: Urgent first, then `po.createdAt DESC`.
- Filter chips available (§7).
- No active filters by default.

### Stage Transition — Item Movement
When an item advances to a new stage:
- It disappears from the originating department's My Jobs immediately.
- It appears on the destination department's My Jobs instantly (via Pusher invalidation).
- It moves to the originating department's History tab.

---

## §15. ANALYTICS DASHBOARD

### Access
Admin, Manager/Owner, Sales. Not visible to workers or Finance.

### Primary KPIs (Top Row)
- Total POs (in selected period)
- On-Time Delivery Rate (%)
- Average Completion Time (days)
- Total RW/NG Items
- Total Return Items

### Secondary Metrics
- On-Time vs Delayed breakdown (by item count)
- Bottleneck Department (dept with highest average stage dwell time)
- Per-Client Performance (breakdown by client name)
- RW Rate by Department (which dept generates most rework)
- Return Rate (return items / total delivered items)

### On-Time Logic
- Item is ON-TIME if: `delivery_gate_timestamp <= po.deliveryDate`
- Item is LATE if: `delivery_gate_timestamp > po.deliveryDate` OR item not DONE and `today > po.deliveryDate`
- PO is ON-TIME if: ALL items are on-time.
- PO is LATE if: ANY item is late.

### Bottleneck Calculation
- For each item, compute time spent in each stage: `current_itemtrack.createdAt - previous_itemtrack.createdAt`
- Average stage dwell times across all items in the period.
- Department with highest average dwell time = Bottleneck.
- If no progress in 24h+ in a stage → item flagged as `STALLED`.

### Timeline Selection
- `1 month | 3 months | 6 months | 12 months`
- Each period compared to the equivalent previous period.
- Comparison displayed as: value + delta (▲12% ▼5%).

### Analytics Dashboard Layout (Mobile)
```
[Period Selector: 1M | 3M | 6M | 12M]

── KPI Row (horizontal scroll) ──────────
│ 24 POs │ 87% On-Time │ 4.2d Avg │ 3 RW │
─────────────────────────────────────────
── On-Time vs Delayed ───────────────────
[Horizontal bar chart — current vs previous period]
── Bottleneck Department ────────────────
[Bar chart: avg dwell time per department]
── Per-Client Performance ───────────────
[List: client name | POs | on-time rate]
── RW / Returns ─────────────────────────
[Pie chart: RW reasons] [Count: Returns this period]
```

### Empty State
- Show empty chart skeletons with placeholder shapes.
- Text: `"Belum ada data untuk periode ini"`
- No hiding of dashboard. Always visible.

---

## §16. NOTIFICATION TIER SYSTEM

### Architecture
- Notifications stored in `Notification` DB model.
- Delivered via Pusher on real-time events.
- Consumed via in-app Notification Drawer (bell icon in header).
- Bell icon shows unread badge count.
- No device push notifications. In-app only.

### Tier 1 — Floor-Wide (All Users)

| Event | Message |
|---|---|
| Urgent PO created/activated | `"PO [number] ditandai URGENT — [client]"` |
| New PO activated | `"PO baru [number] dari [client] telah aktif"` |

### Tier 2 — Role-Relevant

| Event | Recipients | Message |
|---|---|---|
| Issue filed on item | All workers + Manager + Admin | `"Issue dilaporkan: [item name] — [reason]"` |
| Issue resolved | All workers + Manager + Admin | `"Issue diselesaikan: [item name]"` |
| RW item spawned | All workers + Manager + Admin | `"Rework dibuat: [item name] - RW[n]"` |
| Delivery Gate passed | Finance + Manager + Admin | `"[item name] siap diinvoice"` |
| QC Gate passed | Delivery workers + Manager | `"[item name] masuk Delivery"` |
| Item enters dept stage | That department's workers | `"Item baru: [item name] siap dikerjakan"` |

### Tier 3 — Management Only

| Event | Recipients | Message |
|---|---|---|
| Issue unresolved 3 days | Manager + Admin | `"⚠ Issue belum diselesaikan 3 hari: [item name]"` |
| PO nearing delivery date (3 days out) | Manager + Admin + Sales | `"PO [number] jatuh tempo dalam 3 hari"` |
| PO auto-closed | Manager + Admin + Finance | `"PO [number] telah ditutup (CLOSED)"` |

---

## §17. FINANCE INVOICING FLOW

Finance sees a single flat list of ALL items that have passed the Delivery Gate (`stage = 'DONE'`), grouped by PO name, sorted by `po.deliveryDate ASC` (oldest delivery first = most urgent to invoice).

### Rules
- UNPAID toggle → PAID: single tap confirmation. No modal.
- When all items in a PO group are PAID → PO row collapses with green `CLOSED` badge. Auto-close triggered.
- Finance also sees IN-PROGRESS items in a separate `"Segera Tiba"` (Upcoming) section — read-only, no toggle.
- Return items being re-processed: shown as `PENDING RETURN` — not toggleable until resolved.

### PO Status Auto-Computation on PAID Toggle
```typescript
const allItems = await prisma.item.findMany({ where: { poId } });
const allPaid  = allItems.every(item => item.invoiceStatus === 'PAID');
const allDone  = allItems.every(item => item.stage === 'DONE');
let newStatus = 'ACTIVE';
if (allPaid)                                          newStatus = 'CLOSED';
else if (allDone)                                     newStatus = 'COMPLETE';
else if (allItems.some(i => i.invoiceStatus === 'PAID')) newStatus = 'PARTIAL';
await prisma.po.update({ where: { id: poId }, data: { status: newStatus } });
```

---

## §18. PO NUMBERING SYSTEM

### Auto-Number System
- Admin configures a **prefix template** in Settings (Admin only).
- Default template: `PO-[YYYY]-[SEQ]`
- Sequence: auto-incremented per client instance, zero-padded to 3 digits: `001, 002, 003...`

### Manual Override
- Admin can manually type a PO number at creation time.
- Sequence counter is NOT affected by manual inputs.

### Template Variables

| Variable | Replacement |
|---|---|
| `[YYYY]` | 4-digit current year |
| `[YY]` | 2-digit current year |
| `[MM]` | 2-digit current month |
| `[SEQ]` | Auto-incrementing sequence (3 digits, resets per year) |
| `[CLIENT]` | First 3 chars of client name, uppercase |

---

## §19. EXPORT SYSTEM (PDF + PRESENTATION)

### Export Types

| Export Type | Trigger | Format | Access |
|---|---|---|---|
| Detail PDF (Per-PO) | PO detail view | A4 portrait, clean table layout | Admin, Manager, Sales, Finance |
| Analytics PDF | Analytics dashboard | A4 portrait, multi-page | Admin, Manager, Sales |
| Presentation PDF | Analytics dashboard | A4 landscape / 16:9 | Admin, Manager only |

### Technical Implementation
- Use `@react-pdf/renderer` for PDF generation server-side.
- Charts: render Chart.js to canvas → convert to base64 image → embed in PDF.
- All exports generated in API route (`/api/export/[type]`) and streamed as file download.
- No third-party PDF service. All server-side.

---

## §20. RETURN/NG DELIVERY PROTOCOL

> **⚠ LOCKED DECISION (Workflow Truth v1.1):** Returns regress the original Item back to QC. No new Item record is created. `ReturnItem` is a log-only record.

See §12 for the full flow. Data model summary:

```prisma
// ReturnItem — LOG ONLY. No stage, no progress, no resolved flag.
model ReturnItem {
  id             String   @id
  originalItemId String
  qty            Int
  reason         String
  filedById      String
  createdAt      DateTime @default(now())
}
```

### Return Analytics
- Return items do NOT affect on-time calculation.
- Tracked in their own Analytics section.
- Metrics: total returns, return by reason, return by client, return resolution rate.

### Finance Behavior with Returns
- Original item (regressed to QC): not invoiceable until it passes QC and DELIVERY again.
- Shown as `PENDING RETURN` in Finance view until re-delivered.

---

## §21. SUPER ADMIN (`/admin`) SPEC

### Access
- Route: `/admin` (completely separate from main app `/login`)
- Authentication: hardcoded PIN from `.env`: `SUPER_ADMIN_PIN`
- Not stored in DB. Stateless auth via iron-session.
- Only accessible by the system operator (not clients).

### Super Admin Capabilities
- View all system health metrics (DB size, active sessions)
- Update branding: Client Name, Brand Color, Logo upload
- Manage `.env`-equivalent settings (stored in `SystemConfig` DB table, not actual .env)
- Reset all user PINs (bulk reset)
- View system audit logs
- Seed/reset database (dangerous actions require PIN re-confirmation)

### Super Admin UI
- Minimal, functional. No brand theming — uses neutral gray system.
- Resembles a WordPress wp-admin panel: sidebar nav, content area.
- NOT mobile-first. Desktop-optimized.

---

## §22. TECH STACK & ARCHITECTURE REFERENCE (LOCKED)

### 🚨 CRITICAL: Environment Loading Protocol
**This is the #1 cause of initialization failures.**

ES modules hoist static imports BEFORE `dotenv.config()` can load `.env.local`.

```typescript
// ❌ FORBIDDEN — import runs before dotenv.config()
import { prisma } from '@/lib/db';
import dotenv from 'dotenv';
dotenv.config();

// ✅ REQUIRED — dotenv first, then dynamic import
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { prisma } = await import('@/lib/db');
  // ... use prisma
}
```

### Where Dynamic Import Applies

| File Type | Import Pattern |
|---|---|
| `prisma/seed.ts` | MUST use dynamic imports |
| `scripts/*.ts` | MUST use dynamic imports |
| Next.js API routes | Standard imports OK (Next.js loads env) |
| Next.js pages | Standard imports OK (Next.js loads env) |
| React components | Standard imports OK (Next.js loads env) |

### 🚨 CRITICAL: File Naming Convention
**Kimi and all AI agents must use these exact names. No exceptions.**

| Purpose | Correct File Name | FORBIDDEN Names |
|---|---|---|
| Prisma client with Turso adapter | `lib/db.ts` | `lib/prisma.ts`, `lib/database.ts` |
| Iron Session helpers | `lib/session.ts` | `lib/auth.ts`, `lib/iron-session.ts` |
| Pusher server & client | `lib/pusher.ts` | `lib/pusher-server.ts`, `lib/pusher-client.ts` |
| Utilities & helpers | `lib/utils.ts` | `lib/helpers.ts`, `lib/cuid.ts` |
| Constants & config | `lib/constants.ts` | `lib/config.ts`, `lib/const.ts` |

### Core Technology Stack (LOCKED — DO NOT DEVIATE)

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 14 (App Router) | No Next.js 15 |
| UI Library | React | 18 | No React 19 |
| Styling | Tailwind CSS | v3 | No Tailwind v4. Use `tailwind.config.js` |
| Component Library | shadcn/ui | latest (for v3) | Radix UI primitives |
| Database ORM | Prisma | 5.22.x | No migration to Prisma 6 |
| Database | Turso (libSQL) | — | Via `@prisma/adapter-libsql` |
| Prisma Adapter | **PrismaLibSQL** | — | **ALL CAPS**. From `@prisma/adapter-libsql` |
| Global State | Zustand | v5 | UI state only |
| Server State | React Query (TanStack) | v5 | Server data, mutations |
| Real-time | Pusher Channels | ap1 cluster | `pusher-js` client, `pusher` server |
| Auth | iron-session | latest | Non-edge. No Prisma in `middleware.ts` |
| PDF Generation | @react-pdf/renderer | latest | Server-side API route |
| Icons | lucide-react | latest | — |
| Script Runner | **tsx** | latest | **REQUIRED. Replaces ts-node everywhere.** |

### Architecture Rules
1. **No Prisma in `middleware.ts`** — middleware only checks iron-session cookie existence.
2. **All API routes:** `export const dynamic = 'force-dynamic'`
3. **No tenantId:** Single-tenant DB. Never add company/tenant fields.
4. **No Enums in Prisma schema:** Use String with default values. Turso/libSQL does not support Prisma enums reliably.
5. **Transactions:** All multi-table writes use `prisma.$transaction`.
6. **ID generation:** Generate cuid/uuid in the API route, not via DB defaults when inside transactions.
7. **Data transformation:** In API route / React Query layer only. Never in UI components.
8. **No `top-14` in CSS:** Mobile scroll headers use `sticky top-0`.

### Prisma Client Setup — `lib/db.ts`
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  throw new Error(
    '[lib/db.ts] TURSO_DATABASE_URL is undefined.\n' +
    'Fix: Ensure dotenv.config() runs BEFORE any import of lib/db'
  );
}

const libsql  = createClient({ url: dbUrl, authToken });
const adapter = new PrismaLibSQL(libsql);

declare global { var prisma: PrismaClient | undefined; }
const prisma = global.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma };
```

### Pusher Setup — `lib/pusher.ts`
```typescript
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

export const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS:  true,
});

export const getPusherClient = () => {
  if (typeof window === 'undefined') throw new Error('Pusher client: browser only');
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
};
```

### Iron Session Setup — `lib/session.ts`
```typescript
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId:     string;
  name:       string;
  department: string;
  role:       string;
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password:      process.env.IRON_SESSION_PASSWORD!,
  cookieName:    'pogrid-session',
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge:   60 * 60 * 24 * 7,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Unauthorized');
  return session;
}
```

---

## §23. DATABASE SCHEMA REFERENCE (LOCKED)

### 🚨 CRITICAL: Two-Tier Database Strategy

| Tier | Purpose | URL Source |
|---|---|---|
| Schema Definition | Prisma CLI validation & client generation | `file:./dev.db` **(hardcoded in schema)** |
| Runtime Data | Actual application data | `TURSO_DATABASE_URL` (via adapter) |

### Database Initialization Workflow
```bash
# Step 1: Generate Prisma Client (uses file:./dev.db)
npx prisma generate

# Step 2: Create local dev.db (for Prisma Studio, optional)
npx prisma db push

# Step 3: Seed Turso database
npx dotenv -e .env.local -- npx tsx prisma/seed.ts
# OR:
npm run db:seed
```

### Seed Script Pattern — `prisma/seed.ts`
```typescript
import dotenv from 'dotenv';
import path from 'path';
import { hashSync } from 'bcryptjs';

// Step 1: Load env FIRST
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (result.error) { console.error('Failed to load .env.local:', result.error); process.exit(1); }

// Step 2: Validate env
if (!process.env.TURSO_DATABASE_URL) { console.error('TURSO_DATABASE_URL not set'); process.exit(1); }

// Step 3: Dynamic imports AFTER env is loaded
async function seed() {
  const { prisma } = await import('../lib/db');
  // ... seed logic
  await prisma.$disconnect();
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
```

### Prisma Schema — Complete (LOCKED)
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"  // ← HARDCODED — NEVER env()
}

model User {
  id             String        @id
  name           String        @unique
  pin            String        // bcrypt hashed
  department     String        // matches Department.name
  role           String        @default("worker")
  // role values: "worker" | "admin" | "manager" | "sales" | "finance"
  active         Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  itemTracks     ItemTrack[]
  issues         Issue[]       @relation("FiledBy")
  resolvedIssues Issue[]       @relation("ResolvedBy")
  notifications  Notification[]
  returnItems    ReturnItem[]
}

model Department {
  id        String   @id
  name      String   @unique
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}

model PO {
  id           String   @id
  number       String   @unique
  clientName   String
  deliveryDate DateTime
  status       String   @default("ACTIVE")
  // status values: "ACTIVE" | "PARTIAL" | "COMPLETE" | "CLOSED" | "LATE"
  urgent       Boolean  @default(false)
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  items        Item[]
}

model Item {
  id             String     @id
  poId           String
  po             PO         @relation(fields: [poId], references: [id])
  name           String
  qty            Int
  progress       Int        @default(0)
  stage          String     @default("DRAFTING")
  // stage values: "DRAFTING" | "PURCHASING" | "MACHINING" | "FABRIKASI" | "QC" | "DELIVERY" | "DONE"
  productionType String     @default("machining")
  // productionType values: "machining" | "fabrication" | "both"
  vendorJob      Boolean    @default(false)
  urgent         Boolean    @default(false)
  allNG          Boolean    @default(false)
  parentItemId   String?
  parent         Item?      @relation("ReworkChain", fields: [parentItemId], references: [id])
  children       Item[]     @relation("ReworkChain")
  invoiceStatus  String     @default("UNPAID")
  // invoiceStatus values: "UNPAID" | "PAID"
  invoicedAt     DateTime?
  invoicedById   String?
  notes          String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  tracks         ItemTrack[]
  issues         Issue[]
  returns        ReturnItem[]
}

model ItemTrack {
  id         String   @id
  itemId     String
  item       Item     @relation(fields: [itemId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  department String
  action     String
  // action values: "PROGRESS_UPDATE" | "STAGE_ADVANCE" | "PASS_GATE" | "DELIVERY_GATE"
  //              | "SPLIT_PASS" | "CLIENT_RETURN" | "QC_FAIL" | "UNDO"
  progress   Int?
  createdAt  DateTime @default(now())
}

model Issue {
  id           String    @id
  itemId       String
  item         Item      @relation(fields: [itemId], references: [id])
  filedById    String
  filedBy      User      @relation("FiledBy",    fields: [filedById],    references: [id])
  reason       String
  resolved     Boolean   @default(false)
  resolvedAt   DateTime?
  resolvedById String?
  resolvedBy   User?     @relation("ResolvedBy", fields: [resolvedById], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

// LOG-ONLY — no stage, no progress, no resolved flag (Workflow Truth v1.1)
model ReturnItem {
  id             String   @id
  originalItemId String
  originalItem   Item     @relation(fields: [originalItemId], references: [id])
  qty            Int
  reason         String
  filedById      String
  filedBy        User     @relation(fields: [filedById], references: [id])
  createdAt      DateTime @default(now())
}

model Notification {
  id        String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String
  message   String
  itemId    String?
  poId      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model PoSequence {
  id       String @id @default("singleton")
  year     Int
  sequence Int    @default(0)
}

model SystemConfig {
  id             String   @id @default("singleton")
  clientName     String   @default("POGrid Client")
  brandColor     String   @default("#2A7B76")
  brandColorDark String   @default("#1D5E5A")
  logoUrl        String?
  poPrefix       String   @default("PO-[YYYY]-[SEQ]")
  updatedAt      DateTime @updatedAt
}
```

---

## §24. API ROUTE REFERENCE

All routes: `export const dynamic = 'force-dynamic'`
All routes: verify iron-session user via `lib/session.ts` before any DB operation.

| Method | Route | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/login` | PIN login → set iron-session | None |
| POST | `/api/auth/logout` | Clear session | Any |
| GET | `/api/me` | Get session user | Any |
| GET | `/api/pos` | List POs (filtered by role) | Any |
| POST | `/api/pos` | Create PO | Admin |
| GET | `/api/pos/:id` | PO detail with items | Any |
| PATCH | `/api/pos/:id` | Edit PO | Admin |
| DELETE | `/api/pos/:id` | Delete PO (no progress) | Admin |
| GET | `/api/items` | List items (filtered by dept/role) | Any |
| PATCH | `/api/items/:id/progress` | Update progress | Worker (own dept) |
| POST | `/api/items/:id/advance` | Advance stage (Terminal Gate) | Worker (own dept) |
| POST | `/api/items/:id/split` | Item Split Protocol (RW) | QC Worker |
| POST | `/api/items/:id/return` | File client return | Delivery Worker |
| GET | `/api/issues` | List issues | Any |
| POST | `/api/issues` | File issue | Worker |
| PATCH | `/api/issues/:id/resolve` | Resolve issue | Filer / Admin / Manager |
| GET | `/api/users` | List users | Admin |
| POST | `/api/users` | Create user | Admin |
| PATCH | `/api/users/:id` | Edit user / reset PIN | Admin |
| PATCH | `/api/users/:id/pin` | Worker self-change PIN | Self |
| GET | `/api/departments` | List departments | Any |
| POST | `/api/departments` | Create department | Admin |
| DELETE | `/api/departments/:id` | Delete dept (guard: no active items) | Admin |
| PATCH | `/api/items/:id/invoice` | Mark item PAID | Finance |
| GET | `/api/analytics` | Analytics data (period param) | Admin/Manager/Sales |
| POST | `/api/export/pdf` | Generate PDF (type param) | Role-gated |
| GET | `/api/notifications` | Get user notifications | Any |
| PATCH | `/api/notifications/read` | Mark all read | Any |
| GET | `/api/config` | Get SystemConfig | Admin |
| PATCH | `/api/config` | Update SystemConfig | Super Admin |

---

## §25. STATE MANAGEMENT REFERENCE

### Zustand Store (`store/uiStore.ts`) — UI State Only
```typescript
interface UIStore {
  // Batalkan / Undo
  pendingProgress: Record<string, { previous: number; timeoutRef: NodeJS.Timeout | null }>
  setPendingProgress: (itemId: string, prev: number, ref: NodeJS.Timeout) => void
  clearPendingProgress: (itemId: string) => void

  // Bottom sheets
  activeBottomSheet: 'qc-gate' | 'delivery-gate' | 'issue' | 'split' | 'return' | null
  bottomSheetItemId: string | null
  openBottomSheet: (sheet: UIStore['activeBottomSheet'], itemId: string) => void
  closeBottomSheet: () => void

  // Connection
  connectionStatus: 'online' | 'offline' | 'reconnecting'
  setConnectionStatus: (status: UIStore['connectionStatus']) => void

  // Filters
  boardFilters: string[]
  setBoardFilters: (filters: string[]) => void
  showCompleted: boolean
  toggleShowCompleted: () => void
  hariIniActive: boolean
  toggleHariIni: () => void
}
```

### React Query Keys (Standard)
```typescript
['items']                       // All items
['items', { department }]       // Items by department
['items', { poId }]             // Items by PO
['item', id]                    // Single item
['pos']                         // All POs
['po', id]                      // Single PO
['issues']                      // All issues
['issues', { itemId }]          // Issues by item
['notifications', userId]       // User notifications
['analytics', { period }]       // Analytics data
['users']                       // All users
['departments']                 // All departments
```

### Pusher Channel & Events
```typescript
// Channel: 'pogrid-channel'
'item-updated'       // Any item progress/stage change
'issue-filed'        // New issue
'issue-resolved'     // Issue resolved
'po-status-changed'  // PO status update
'finance-unlocked'   // Item reached DONE
'notification'       // New notification for user
```

### Pusher Invalidation Pattern
```typescript
// On 'item-updated' event received on client:
queryClient.invalidateQueries({ queryKey: ['items'] })
queryClient.invalidateQueries({ queryKey: ['items', { department: user.department }] })
queryClient.invalidateQueries({ queryKey: ['pos'] })
```

---

## §26. WORKFLOW TRUTH v1.1 (LOCKED DECISIONS)

> This section records all product decisions made in the Q&A session of 2026-03-31.
> These decisions override any ambiguity in §1–§25. If a conflict exists between this section and an earlier section, THIS SECTION WINS.

---

### W1 — System Identity

POGrid is a production tracking system, not a task manager. Its purpose is complete floor transparency — every worker and manager sees the same live reality at all times. There are no silos, no approval gates between stages (except QC and Delivery terminal gates), no hidden work.

The **Item** is the atomic unit. The **PO** is its container. The **stage** is its current position in the pipeline. The **ItemTrack log** is the immutable history of every state change.

---

### W2 — Authentication Flow (Single Page, 3 Inline States)

The login experience is a **single `/login` page** that transitions through three inline states without any page navigation.

**State 1 — Department Grid**
All active departments are displayed as a grid of tappable tiles. User taps their department.

**State 2 — User Selection Sheet**
A bottom sheet slides up showing all active users belonging to the selected department. User taps their name.

**State 3 — PIN Pad**
A PIN entry pad appears. User enters their PIN. On success: session is created, user is routed to their home view by role. On failure: pad resets, name selection is preserved (user does not re-select department and name).

**Invariants:**
- No separate pages. One route, three visual states.
- PIN is bcrypt-hashed in DB. Never stored or transmitted in plain text.
- Session established via iron-session upon PIN verification.
- One hardcoded Administrator user exists in seed (PIN 0000). All other users created via Admin UI.

---

### W3 — Worker Floor View & Job List

When a worker logs in, they land on **My Jobs** — a vertically scrolled feed filtered to items currently at their department's stage.

**My Jobs (default landing):** Items in the worker's department stage only. Actionable with progress controls.

**Board (second tab):** All items, all stages, all departments. Full floor transparency. No default filter. Read-only for items not in the worker's department.

**What makes an item actionable:** The item's current `stage` matches the worker's `department`. Only then do the progress controls activate. All other items are visible but read-only.

---

### W4 — Progress Reporting & Stage Advancement (Single Atomic Action)

When a worker submits progress on an actionable item, both the progress value and potential stage advancement are submitted in **one atomic transaction**. These are never two separate writes.

**Inputs:** item ID, new progress value, target stage, user ID.

**Validations:**
- User's department must match item's current stage.
- Progress value must be ≥ 0 and ≤ quantity (or 100 for slider).
- If advancing stage, target must be the next valid stage per routing rules.

**State Transition (inside single `$transaction`):**
1. Item `progress` updated.
2. If stage advance: Item `stage` updated to next stage.
3. `ItemTrack` record written: userId, department, action, progress, createdAt.

**Side Effect:** Pusher emits `item:updated` after successful commit. All connected clients re-render instantly.

---

### W5 — PO Creation (Admin Only)

Only Admin creates POs and adds Items to them. The moment Admin submits a PO its status becomes `ACTIVE` and **all items are immediately visible on the floor** to all workers. There is no draft-to-active approval step between Admin and any other role.

Sales has read-only access to POs. Sales cannot create, edit, or delete POs.

---

### W6 — Issue Behavior

Filing an issue never blocks work. The item receives the ISSUE badge (highest visual priority). Work continues. Only Manager, Admin, or the filing worker can resolve the issue. When all issues on an item are resolved, the ISSUE badge clears and the stage badge resumes normal display.

---

### W7 — QC Failure: Item Split Protocol (Spawn Child)

> **This is the authoritative decision. It supersedes any conflicting description.**

When QC identifies NG units, the system **spawns a child Item record (Card B)**. The original is NOT deleted or simply regressed.

**Partial fail:**
- Card A (original): `qty` decremented by NG count. Advances to DELIVERY.
- Card B (rework child): new Item created. `qty` = NG count. `stage = QC`. `progress = 0`. `parentItemId` = Card A's ID. Name = `[OriginalName] - RW1`. Issue auto-attached.
- Both writes inside a single `$transaction`.

**Total fail (allNG):**
- Card A: `allNG = true`. Does NOT advance. Removed from active lists. Visible in History.
- Card B: spawned with full original qty.

**RW generation chain:** If Card B fails QC again → spawns Card C named `[Name] - RW1 - RW2`. `parentItemId` chain tracks every generation. No generation limit.

---

### W8 — Client Returns: Regression + Log (No New Item)

> **This is the authoritative decision. It supersedes §20's original description.**

When a Delivery worker files a client return:
- The **original Item** is regressed: `stage → QC`, `progress → 0`.
- A `ReturnItem` **log record** is written (id, originalItemId, qty, reason, filedById, createdAt).
- An `ItemTrack` record is written with `action: 'CLIENT_RETURN'`.
- Pusher emits `item:updated`.

**No new Item record is created.** The original item flows back through QC and DELIVERY before Finance can invoice it again.

---

### W9 — Delivery → DONE (Terminal)

When a Delivery worker confirms delivery, the system immediately and irreversibly sets `stage = DONE`. No manager approval. No secondary confirmation. This is terminal.

**State Transition:**
1. Item `stage → DONE`
2. Item `progress → qty` (100%)
3. `ItemTrack` written with `action: 'DELIVERY_GATE'`
4. Pusher emits `item:updated` + `finance-unlocked`

---

### W10 — Urgent Flag (Phase 1 Required)

Urgent items are:
- Always pinned to the top of My Jobs and Board, above all non-urgent items.
- Within urgent items, sub-sorted by `updatedAt ASC` (stalest urgent first).
- Display a pulsing orange URGENT badge.

This is required from Phase 1. Not deferrable.

---

### W11 — Rework Breadcrumb (Phase 1 Required)

Any item where `parentItemId` is not null must display the pill:

```
↩ RW dari [ParentName]
```

Orange pill (`#DE8F26` bg, white text). Always references the immediate parent. Required from Phase 1. Not deferrable.

---

### W12 — Real-Time Contract

Every state change emits a Pusher event on channel `pogrid-channel` **after** the transaction commits successfully. Never before. Never on failure.

| Trigger | Event | Client Effect |
|---|---|---|
| Progress updated | `item-updated` | Re-render item card |
| Stage advanced | `item-updated` | Item moves stage, My Jobs updates |
| Issue filed | `item-updated` | ISSUE badge appears |
| Issue resolved | `item-updated` | ISSUE badge clears (if no remaining) |
| QC fail / RW spawn | `item-updated` (×2) | Card A updates, Card B appears |
| Client return | `item-updated` | Item regresses to QC on all clients |
| Delivery confirmed | `item-updated` + `finance-unlocked` | Item moves to DONE |

React Query cache is invalidated per event. No full re-fetch.

---

### W13 — Invariants That Must Never Break

1. An item is always visible to all users, regardless of stage.
2. Only a worker whose department matches the item's current stage can submit progress.
3. Progress update and stage advance are one atomic transaction — never two separate writes.
4. QC failure spawns a child Item record. The original is not deleted.
5. Client returns do not spawn new Item records — they regress the original and log a ReturnItem entry.
6. DONE is terminal and irreversible. No item can leave DONE state.
7. An issue never blocks floor work or locks an item.
8. Admin is the sole creator of POs and Items.
9. Every state change produces an ItemTrack entry. No exceptions.
10. Pusher fires only after a successful transaction commit.
11. Urgent items are always visually first in My Jobs and Board.
12. The RW breadcrumb pill is rendered on every item where `parentItemId` is not null.
13. Session trust signals are: userId, name, department, role — nothing else.
14. ReturnItem is a log record only. It has no stage, no progress, no active lifecycle.
15. Sales is a valid read-only role. Sales cannot write anything.
16. `lib/db.ts` — not `lib/prisma.ts`. This is non-negotiable.
17. No Prisma enums. All status fields are plain strings.
18. No `tenantId`. No `companyId`. Single-tenant. Never.

---

*End of Manifesto v3.5 — All sections locked.*
*This document is the Single Source of Truth for POGrid.*
*Any deviation by AI coding agents, developers, or product decisions must be flagged and this document updated before implementation.*
