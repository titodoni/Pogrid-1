**POGrid - Unified UI/UX Guideline v1.0**

**POGrid - Unified UI/UX Guideline v1.1**

**Master Reference Document** - Consolidated from UI_UX_DESIGN_GUIDELINES v1.0, COMPONENT_LIBRARY v1.1, NAVIGATION_MATRIX v1.2, Screens v1.2, POGrid-Manifesto v3.5  
**Updated:** 2026-04-01 · **Amended:** 2026-04-01 (Amendment #13 - Worker Flow Redesign)  
**Authority:** System Architecture  
**For:** AI Agents (Kimi), Senior Developers, UI Builders  
**Rule:** Read in full before writing a single line of UI code.

**TABLE OF CONTENTS**

- [⚠️ AGENT HARD RULES](#agent_hard_rules)
- [Design Principles](#design_principles)
- [Color System](#color_system)
- [Typography System](#typography_system)
- [Spacing & Layout Grid](#spacing_layout_grid)
- [Touch Target Rules](#touch_target_rules)
- [Badge System](#badge_system)
- [Animation & Transition Library](#animation_transition_library)
- [Component Specifications](#component_specifications)
  - [9.1 Layout Components](#bm_91_layout_components)
  - [9.2 ItemCard (Worker View)](#bm_92_itemcard_worker_view)
  - [9.3 POCard (Manager/Admin/Sales View)](#bm_93_pocard_manageradminsales_view)
  - [9.4 Input Components](#bm_94_input_components)
  - [9.5 BatalkanControl (3-State Machine)](#bm_95_batalkancontrol_3_state_machine)
  - [9.6 QCGateSheet (Terminal Gate)](#bm_96_qcgatesheet_terminal_gate)
  - [9.7 DeliveryGateSheet (Terminal Gate)](#bm_97_deliverygatesheet_terminal_gate)
  - [9.8 ProfileDrawer (Amendment #4)](#bm_98_profiledrawer_amendment_4)
  - [9.9 Navigation & Badges](#bm_99_navigation_badges)
  - [9.10 Special UI Elements](#bm_910_special_ui_elements)
- [Navigation System (Role-Based)](#navigation_system_role_based)
- [Screen Specifications](#screen_specifications)
- [Tailwind Config & Global CSS](#tailwind_config_global_css)

**⚠️ AGENT HARD RULES**

**Internalize these non-negotiable constraints before implementation:**

1\. STACK LOCK Next.js 14 | React 18 | Tailwind v3 | NO v15/v19/v4  
2\. NO ENUMS All stage/status values are Strings (NOT Prisma enum)  
3\. NO TENANT_ID Single-tenant DB. Never add company/tenant fields.  
4\. ZERO TYPING Workers never use keyboard except "Lainnya" freetext in QC Gate  
5\. MANIFESTO IS LAW No feature not in Manifesto. No Gantt, no BOM, no chat.  
6\. STAGE NAME "DRAFTING" not "DRAFT". String value is "DRAFTING" everywhere.  
7\. AMBER TOKEN #DE8F26 is the ONLY amber/warning color. #92400E is dead.  
8\. NO top-14 All sticky headers use sticky top-0, not top-14 or top-16.  
9\. DESIGN_GRID RETIRED Do not reference design_grid. Use this document EXCLUSIVELY.  
10\. PUSHER DELAY item-updated fires ONLY after 5s Batalkan window closes.  
11\. RETURN MODEL Return work unit = Item with source='RETURN'. ReturnItem = audit only.  
12\. HISTORY ACCESS History = Lihat Selesai chip in My Jobs only. No History tab in nav.  
13\. LOGO STORAGE logoUrl as base64 data URI in SystemConfig. Max 100KB. No CDN.  
14\. allNG ITEMS Hidden from My Jobs active list + Board default. Visible in History + Issues only.  
15\. STALLED ITEMS Computed server-side in /api/analytics. Jakarta timezone (Asia/Jakarta). Not stored in DB.

**Design Principles**

These four principles filter every UI decision. Reject any choice that violates them.

**P1 - Mobile-First, One Thumb**

Primary users are factory floor workers on phones. Every interactive element must be reachable and operable with a single thumb. No hover-dependent interactions. No desktop-only patterns.

**P2 - Zero Typing for Workers**

Workers complete all tasks - progress, QC gates, issue reports - **without opening a keyboard**. Worker input: tap, drag, or stepper buttons only.  
**Exception:** "Lainnya" freetext field in QC Gate NG reason selector (only option unlocking keyboard).

**P3 - 10-Second Truth**

A Manager opening the Board must assess ALL active bottlenecks across all stages within 10 seconds. The Board is **never filtered by default**. Everything is visible.

**P4 - Full Transparency, No Silos**

All items visible to all departments from PO creation. No "not your stage, can't see it" gating. My Jobs filters actionable items only; it does not hide the rest.

**Color System**

**CSS Variables (Injected via globals.css)**

:root {  
\--color-brand: #2A7B76;  
\--color-brand-dark: #1D5E5A;  
\--color-warning: #DE8F26;  
\--color-danger: #B33941;  
\--color-navy: #1D3B4D;  
\--color-bg: #F8F9FA;  
\--color-surface: #FFFFFF;  
\--color-text: #1A1A2E;  
\--color-muted: #6B7280;  
}

**Token Reference Table**

| Token         | Hex     | Tailwind                  | Usage                                          |
| ------------- | ------- | ------------------------- | ---------------------------------------------- |
| Brand         | #2A7B76 | bg-brand / text-brand     | Buttons, active nav, progress fill, sliders    |
| Brand Dark    | #1D5E5A | bg-brand-dark             | Hover on brand elements                        |
| Warning       | #DE8F26 | bg-warning / text-warning | URGENT badge, PURCHASING badge, ALL amber text |
| Danger        | #B33941 | bg-danger / text-danger   | ISSUE/RETURN badges, Laporkan button           |
| Navy          | #1D3B4D | bg-navy / text-navy       | MACHINING/FABRIKASI badges, headers            |
| Background    | #F8F9FA | bg-\[#F8F9FA\]            | Page background                                |
| Surface       | #FFFFFF | bg-white                  | Cards, sheets, nav                             |
| Text Primary  | #1A1A2E | text-\[#1A1A2E\]          | Item names, headings                           |
| Text Muted    | #6B7280 | text-\[#6B7280\]          | PO numbers, client names, metadata             |
| Border        | #E5E7EB | border-\[#E5E7EB\]        | Card borders, dividers                         |
| Success Light | #D1FAE5 | bg-\[#D1FAE5\]            | QC/DELIVERY/DONE badge bg                      |
| Success Dark  | #065F46 | text-\[#065F46\]          | DONE badge text                                |

**Amber Standardization Rule**

**#DE8F26 is the ONLY amber/warning color in the system.**

# 92400E is permanently retired. Any use of it is a bug.

**Typography System**

**Font:** DM Sans (load via Google Fonts CDN)

&lt;link href=\\"<https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap\\>" rel=\\"stylesheet\\"&gt;

**Type Scale**

| Role            | Weight | Size | Line-Height | Tailwind              |
| --------------- | ------ | ---- | ----------- | --------------------- |
| Page Title      | 700    | 24px | 32px        | text-2xl font-bold    |
| Card Title      | 600    | 18px | 24px        | text-lg font-semibold |
| Section Header  | 600    | 14px | 20px        | text-sm font-semibold |
| Button Text     | 500    | 14px | 20px        | text-sm font-medium   |
| Badge Text      | 500    | 12px | 16px        | text-xs font-medium   |
| Nav Label       | 500    | 12px | 16px        | text-xs font-medium   |
| Client Name     | 400    | 13px | 18px        | text-\[13px\]         |
| PO Number       | 400    | 12px | 16px        | text-xs               |
| Body / Metadata | 400    | 14px | 20px        | text-sm               |

**Hard Rule:** Minimum text size on mobile is **14px**. Never render text below 14px.

**Spacing & Layout Grid**

**Base Layout (375px Mobile)**

| Property                 | Value            | Tailwind     |
| ------------------------ | ---------------- | ------------ |
| Page horizontal padding  | 16px             | px-4         |
| Card padding             | 16px             | p-4          |
| Card border-radius       | 12px             | rounded-xl   |
| Card gap (vertical list) | 12px             | gap-3        |
| Section gap              | 24px             | gap-6        |
| Bottom nav height        | 64px + safe-area | h-16 pb-safe |
| Sticky header height     | 56px             | h-14         |

**Bottom Nav Safe Area**

.pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }

Apply pb-safe to bottom nav container AND page scroll container to prevent content hiding behind nav.

**Content Scroll Area**

Page content must account for:

- **Top:** StickyHeader height (56px)
- **Bottom:** BottomNav height (64px) + safe-area

// LayoutWrapper pattern  
&lt;div className=\\"min-h-screen bg-\[#F8F9FA\]\\"&gt;  
&lt;StickyHeader /&gt;  
&lt;main className=\\"pt-14 pb-24 px-4\\"&gt;  
{children}  
&lt;/main&gt;  
&lt;BottomNav /&gt;  
&lt;/div&gt;

**Touch Target Rules**

All interactive elements must meet these minimum touch target sizes. No exceptions on mobile.

| Element               | Min Width         | Min Height    | Notes                          |
| --------------------- | ----------------- | ------------- | ------------------------------ |
| All tappable elements | 48px              | 48px          | Global minimum                 |
| Stepper buttons (−/+) | 56px              | 48px          | Extra wide for thumb accuracy  |
| PIN pad keys          | 72px              | 72px          | Large for floor environment    |
| Bottom nav tabs       | full-width/n-tabs | 64px          | Includes label                 |
| Progress slider thumb | 24px dia          | 48px tap area | Use padding to expand tap area |
| Toggle switch         | 44px              | 24px          | Finance invoicing              |
| Radio preset options  | full-width        | 48px          | QC Gate reason list            |
| Filter chips          | auto              | 36px          | Horizontal scroll row          |

**Badge System**

**Priority Rule (Item-Level) - Render ONE Badge Only**

1\. ISSUE → overrides ALL → bg #B33941, text white  
2\. URGENT → overrides stage → bg #DE8F26, text white, pulse animation  
3\. RETURN → overrides stage → bg #B33941, text white  
4\. Stage → default rendering

**Stage Badge Specs (Item-Level)**

| Stage      | Background | Text    | Notes           |
| ---------- | ---------- | ------- | --------------- |
| DRAFTING   | #E5E7EB    | #374151 | Gray pill       |
| PURCHASING | #FEF3C7    | #DE8F26 | Soft amber pill |
| MACHINING  | #1D3B4D    | #FFFFFF | Navy pill       |
| FABRIKASI  | #1D3B4D    | #FFFFFF | Navy pill       |
| QC         | #D1FAE5    | #2A7B76 | Green-tint pill |
| DELIVERY   | #D1FAE5    | #2A7B76 | Green-tint pill |
| DONE       | #D1FAE5    | #065F46 | Dark green text |
| VENDOR     | #9CA3AF    | #FFFFFF | Gray pill       |

**Override Badge Specs**

| Badge  | Background | Text    | Animation                |
| ------ | ---------- | ------- | ------------------------ |
| ISSUE  | #B33941    | #FFFFFF | None                     |
| URGENT | #DE8F26    | #FFFFFF | pulse-urgent 2s infinite |
| RETURN | #B33941    | #FFFFFF | None                     |

**Badge Anatomy**

- Padding: px-2 py-0.5
- Border-radius: rounded-full
- Font: 12px DM Sans 500
- No border - background only

**StageBadge Priority Logic**

function StageBadge({ item }) {  
if (item.issues?.some(i => !i.resolved)) return &lt;Badge type=\\"ISSUE\\" /&gt;  
if (item.urgent) return &lt;Badge type=\\"URGENT\\" animate /&gt;  
if (item.source === 'RETURN') return &lt;Badge type=\\"RETURN\\" /&gt;  
return &lt;Badge type={item.stage} /&gt;  
}

**Animation & Transition Library**

All animations defined in globals.css. Reference by class name only - never inline.

/\* globals.css - Animation Definitions \*/  
<br/>@keyframes slide-up {  
from { transform: translateY(100%); }  
to { transform: translateY(0); }  
}  
.animate-slide-up { animation: slide-up 300ms ease-out forwards; }  
<br/>@keyframes fadeOut {  
from { opacity: 1; transform: translateY(0); }  
to { opacity: 0; transform: translateY(-8px); }  
}  
.animate-fade-out { animation: fadeOut 250ms ease-out forwards; }  
<br/>@keyframes fadeIn {  
from { opacity: 0; transform: translateY(-8px); }  
to { opacity: 1; transform: translateY(0); }  
}  
.animate-fade-in { animation: fadeIn 250ms ease-in forwards; }  
<br/>@keyframes pulse-urgent {  
0%, 100% { opacity: 1; }  
50% { opacity: 0.7; }  
}  
.animate-pulse-urgent { animation: pulse-urgent 2s ease-in-out infinite; }  
<br/>@keyframes shake {  
0%, 100% { transform: translateX(0); }  
20%, 60% { transform: translateX(-8px); }  
40%, 80% { transform: translateX(8px); }  
}  
.animate-shake { animation: shake 400ms ease-in-out; }  
<br/>.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }  
.scrollbar-hide::-webkit-scrollbar { display: none; }

**Animation Usage Rules**

| Animation    | When                         | Duration | After                    |
| ------------ | ---------------------------- | -------- | ------------------------ |
| fadeOut      | Worker submits 100% progress | 250ms    | Open Terminal Gate sheet |
| fadeIn       | Worker cancels Terminal Gate | 250ms    | Card re-appears at 99%   |
| slide-up     | Any bottom-sheet opens       | 300ms    | -                        |
| pulse-urgent | URGENT badge render          | 2s loop  | Until urgent cleared     |
| shake        | PIN entry error              | 400ms    | Show error text          |

**Component Specifications**

**9.1 Layout Components**

**LayoutWrapper**

- Min-height full screen
- Background #F8F9FA
- Padding-bottom accounts for bottom nav height (64px + safe-area)
- Pattern:

&lt;div className=\\"min-h-screen bg-\[#F8F9FA\]\\"&gt;  
&lt;StickyHeader /&gt;  
&lt;main className=\\"pt-14 pb-24 px-4\\"&gt;{children}&lt;/main&gt;  
&lt;BottomNav /&gt;  
&lt;/div&gt;

**StickyHeader**

- sticky top-0 z-index 40
- Border-bottom #E5E7EB
- White background
- Includes: ProfileAvatar (left) | PageTitle (center) | NotificationBell (right)
- Height: 56px (h-14)

**9.2 ItemCard (Worker View)**

**Props:** item { id, name, qty, progress, stage, urgent, parentItemId, parent.name, issues\[\], poNumber, clientName }

**Anatomy (top → bottom):**

- **Top row:** PO# (muted 12px left) | StageBadge (right, priority-ordered)
- **Item name:** 18px 600 weight, #1A1A2E
- **Client name:** 13px muted #6B7280
- **Rework pill** (conditional): orange #DE8F26 bg - ↩ RW dari \[parent.name\]
- **Return pill** (conditional): red #B33941 bg - ↩ RETURN dari \[PONumber\]
- **Progress control:** StepperControl (qty > 1) OR ProgressSlider (qty = 1)
- **Action row:** BatalkanControl (left) | LaporkanButton (right)

**Animations:**

- **Fade-out on 100% submit:** animation: fadeOut 250ms ease-out forwards → then open Terminal Gate sheet
- **Fade-in on cancel gate:** animation: fadeIn 250ms ease-in forwards

**9.3 POCard (Manager/Admin/Sales View)**

**Props:** po { number, clientName, deliveryDate, status, urgent, items\[\] }

**Anatomy:**

┌──────────────────────────────────────────┐  
│ PO-2026-001 \[STATUS BADGE\] │  
│ PT. Maju Jaya │  
│ Due: 30 Mar 2026 \[URGENT\] │  
│ │  
│ 3 items | 1 DONE | 1 ISSUE | 1↩ │  
│ ████████████░░░░░░░░ 60% overall │  
│ │  
│ \[View Details\] \[Export PDF\] │  
└──────────────────────────────────────────┘

**9.4 Input Components**

**StepperControl**

**Used when:** item.qty > 1

- Two buttons: \[ − \] and \[ + \]
- Minimum touch target: 56px × 48px each
- Center display: 7 / 10 units - always units, never percentage
- Button bg: #F3F4F6, rounded-lg
- Tap increments/decrements by 1
- At min (0) or max (qty): button visually disabled (opacity-40), still tappable but no-op

**ProgressSlider**

**Used when:** item.qty === 1

- Range input 0-100
- Track height: 8px, brand color #2A7B76 for filled portion
- Thumb: 24px circle, brand color, min 48px tap area via padding
- Label right of slider: 68% - updates live on drag

**ToggleSwitch (Finance/Invoicing)**

- Animated knob, 44px × 24px track
- **OFF state:** #E5E7EB track, white knob
- **ON state:** #2A7B76 track, white knob
- Transition: transition-all 200ms ease
- Single tap confirmation - NO modal

**9.5 BatalkanControl (3-State Machine)**

**⚠️ CRITICAL:** Most complex stateful UI component.  
**State location:** Zustand uiStore - NOT React Query, NOT local useState.  
**Timeout ref:** stored in useRef - cleared on tap or unmount.

**State 1 - Unsaved Local Change**

- **Condition:** dragging/tapping, not yet submitted
- **Batalkan button:** ACTIVE (brand-colored or active styling)
- **Behavior on tap:** resets progress to last saved value from Zustand store
- **API call:** NO API call fired
- **Implementation:** read uiStore.pendingProgress\[itemId\].previous, call setPendingProgress reset

**State 2 - At Saved Position**

- **Condition:** no unsaved change
- **Batalkan button:** VISIBLE but DISABLED (gray, non-interactive, opacity-40)
- **Behavior on tap:** no action

**State 3 - Post-Save 5-Second Window**

- **Condition:** mutation just fired
- **Batalkan button:** replaced by toast: \\"Progress disimpan ✓ - Batalkan?\\"
- **Toast duration:** 5 seconds
- **On tap during 5s:** fires compensating PATCH /api/items/:id/progress with previous value
- **On 5s expiry:** toast disappears, change is permanent
- **Pusher event:** item-updated fires ONLY after the 5-second window closes - never immediately on save
- **Timeout management:** stored in useRef, cleared on tap (undo) or component unmount

**Zustand Interface**

uiStore.pendingProgress: Record<string, {  
previous: number  
timeoutRef: NodeJS.Timeout | null  
failedUndo: boolean // Amendment #8 - network failure tracking  
retryCount: number // Amendment #8 - retry attempts (max 5)  
}>  
uiStore.setPendingProgress(itemId, prev, ref)  
uiStore.clearPendingProgress(itemId)  
uiStore.setUndoFailed(itemId, failed)  
uiStore.incrementRetryCount(itemId)

**Network Failure Sub-State (Amendment #8)**

**Trigger:** undo PATCH /api/items/:id/progress fails during 5s window

**Behavior:**

- Toast: \\"Gagal membatalkan. Menunggu koneksi...\\" bg #FEF2F2, text #B33941
- Original setTimeout CLEARED, retry loop starts (every 2s, max 5 retries)
- On retry success: revert progress, return to State 2
- On app close during failure: permanent at timeout + 30s grace
- On reconnect within grace: one final retry allowed
- On reconnect after grace: permanent, move to State 2

**Compensating API**

PATCH /api/items/:id/progress  
**Body:** { progress: previousValue }  
**When:** Called only on tap-to-undo within the 5s window

**9.6 QCGateSheet (Terminal Gate)**

**⚠️ CRITICAL:** Triggers Item Split Protocol on Path B.

**Trigger:** Worker in QC department submits 100% progress  
**Animation:** After ItemCard fadeOut animation completes (250ms) → open this sheet

**Dismiss Behavior:** Tap outside sheet OR tap Batalkan → sheet closes, fadeIn plays, card re-appears at 99%

**Path A - All Good**

✅ Semua unit lolos QC?  
\[Item Name\] - \[qty\] units  
<br/>\[Batalkan\] \[Kirim ke Delivery\]

**On "Kirim ke Delivery":**

- POST /api/items/:id/advance → stage: DELIVERY, progress: 0
- Log ItemTrack { department: 'QC', action: 'PASS_GATE' }
- Pusher broadcasts item-updated
- Sheet closes

**Path B - NG Found**

⚠️ Ada unit NG?  
Jumlah NG: \[ − \] \[n\] \[ + \] ← StepperControl, max = item.qty  
<br/>Alasan: (radio preset)  
○ Dimensi tidak sesuai  
○ Surface / finishing NG  
○ Retak / crack  
○ Salah material  
○ Lainnya → \[text input - ONLY option that shows keyboard\]  
<br/>\[Batalkan\] \[Laporkan Rework\]

**On "Laporkan Rework":**

- Validates: ngQty > 0, reason selected
- POST /api/items/:id/split - body: { ngQty, reason }
- Server executes Item Split Prisma \$transaction
- Pusher broadcasts item-updated
- Sheet closes

**Zero-Typing Enforcement:**

- NG qty: StepperControl only - no keyboard
- Reason: radio preset - no keyboard UNLESS "Lainnya" selected
- "Lainnya" text field: short, optional detail only

**9.7 DeliveryGateSheet (Terminal Gate)**

**⚠️ CRITICAL:** Triggers DONE status and unlocks Finance invoicing.

**Trigger:** Worker in Delivery department submits 100% progress  
**Animation:** After ItemCard fadeOut animation completes (250ms) → open this sheet

**Confirmation Layout**

🚚 Konfirmasi Pengiriman  
\[Item Name\] - \[qty\] units  
Client: \[clientName\]  
<br/>\[Batalkan\] \[✅ Sudah Dikirim\]

**On "Sudah Dikirim":**

- POST /api/items/:id/advance → stage: DONE, progress: 100
- Log ItemTrack { department: 'DELIVERY', action: 'DELIVERY_GATE' }
- Pusher broadcasts item-updated + finance-unlocked
- Finance invoicing unlocked for this item
- Sheet closes

**Dismiss Behavior:** Tap outside OR Batalkan → sheet closes, fadeIn plays, card re-appears at 99% progress

**Partial Delivery Rule:**

- Worker can set partial progress (e.g., 5 of 8 units) via StepperControl
- Saving partial progress = standard progress update, NO gate triggered
- Gate ONLY fires at 100%
- Finance cannot invoice until full 100% Delivery Gate is passed

**9.8 ProfileDrawer (Amendment #4)**

**⚠️ CRITICAL:** Workers have no Settings tab. PIN change is surfaced via ProfileAvatar in StickyHeader.

**Trigger:** Tap ProfileAvatar (user initials circle) in StickyHeader - left side  
**Availability:** ALL roles (workers, management, admin)

**Avatar Spec**

Size: 32px circle in StickyHeader  
Background: #2A7B76  
Text: User initials (firstName\[0\] + lastName\[0\])  
Font: 14px DM Sans 600, white  
Position: Left side of StickyHeader, before page title

**Drawer Layout (Bottom-sheet on mobile)**

┌────────────────────────────────────────┐  
│ \[Avatar 48px\] Full Name │  
│ Department · Role │  
│ ──────────────────────────────────── │  
│ 🔑 Ganti PIN │  
│ ──────────────────────────────────── │  
│ Keluar │  
└────────────────────────────────────────┘

**Ganti PIN - Inline 3-Step Flow (no page navigation)**

**Step 1:** "Masukkan PIN lama"

- 4-dot indicator + numeric keypad (same as /login keypad)
- Submit → validate against current PIN hash (client-side optimistic, server validates)

**Step 2:** "Masukkan PIN baru"

- Same 4-dot + keypad UI
- 4-digit requirement enforced

**Step 3:** "Konfirmasi PIN baru"

- Same 4-dot + keypad UI
- Must match Step 2 value

**Error states:**

- Step 1 wrong PIN: animate-shake on dots, \\"PIN lama salah\\" #B33941, clear input
- Step 3 mismatch: animate-shake on dots, \\"PIN tidak cocok\\" #B33941, return to Step 2
- API failure: inline error \\"Gagal menyimpan. Coba lagi.\\" #B33941

**Success:**

- Toast: \\"PIN berhasil diubah ✓\\" - bg #D1FAE5, text #065F46, 2s auto-dismiss
- Drawer closes automatically

**API:** PATCH /api/users/:id/pin body: { currentPin, newPin }

**Keluar (Logout)**

Single tap → POST /api/auth/logout → clear iron-session → redirect /select-dept  
No confirmation modal - single tap is sufficient (user is choosing to leave).

**9.9 Navigation & Badges**

**StageBadge Component Logic**

function StageBadge({ item }) {  
// Priority resolution  
if (item.issues?.some(i => !i.resolved)) return &lt;Badge type=\\"ISSUE\\" /&gt;  
if (item.urgent) return &lt;Badge type=\\"URGENT\\" animate /&gt;  
if (item.source === 'RETURN') return &lt;Badge type=\\"RETURN\\" /&gt;  
return &lt;Badge type={item.stage} /&gt;  
}

**BottomNav**

Fixed bottom, height 64px + env(safe-area-inset-bottom, 0px). White bg, 1px border-top #E5E7EB.

- **Active tab:** icon filled/solid in #2A7B76 + label text-brand.
- **Inactive:** icon outline in #9CA3AF + label text-\[#9CA3AF\].
- Tabs rendered dynamically from NAVIGATION_MATRIX (role-based).

**Worker bottom nav tabs (Amendment #13):**

| Tab     | Icon           | Route               | Visibility                              |
| ------- | -------------- | ------------------- | --------------------------------------- |
| Beranda | grid/apps      | /jobs               | All workers                             |
| Masalah | alert-triangle | /issues             | Machining, Fabrikasi, QC, Delivery only |
| Cari    | search         | /board              | All workers                             |
| Profil  | user           | opens ProfileDrawer | All workers - no route change           |

Rules:

- Active tab by pathname: /jobs → Beranda, /issues → Masalah, /board → Cari.
- Profil tap: opens ProfileDrawer over current route; active tab stays as-is.
- Masalah tap for Drafting/Purchasing: non-blocking tooltip "Tidak tersedia untuk departemen ini".
- Tab width: 25% of screen. Touch area ≥ 64px height. Label: 12px 500 DM Sans.

**FilterChips (Board)**

- Horizontal scroll, scrollbar-hide, 8px gap
- **Active:** bg #2A7B76 or #1D3B4D (per chip type), text white
- **Inactive:** bg white, border #E5E7EB, text #374151
- **Chips:** \[All\] \[Urgent\] \[Issue\] \[Drafting\] \[Purchasing\] \[Machining\] \[Fabrikasi\] \[QC\] \[Delivery\] \[By Client ▾\]

**9.10 Special UI Elements**

**Vendor Job Pill (Amendment #11)**

- Gray pill: bg #9CA3AF, text white, 12px DM Sans 500, rounded-full, px-2 py-0.5
- Content: VENDOR
- Shown ONLY when item.vendorJob === true
- Read-only, no interaction

**Routing Type Pill (Amendment #11)**

- Muted style: bg #F3F4F6, text #6B7280, 12px DM Sans 500, rounded-full, px-2 py-0.5
- Content: MACHINING | FABRIKASI | BOTH (from item.productionType)
- Always shown on ItemCard
- Read-only, no interaction
- Admin can edit productionType via Item Edit form (re-routing recalculates on server)

**Rework Breadcrumb Pill**

- Orange pill: bg #DE8F26, text white, 12px DM Sans 500
- Content: ↩ RW dari \[parent.name\]
- Rendered below item name on card
- Read-only, no tap interaction
- Always references immediate parent (not root)

**Return Breadcrumb Pill**

- Red pill: bg #B33941, text white, 12px DM Sans 500
- Content: ↩ RETURN dari \[item.returnBreadcrumb\]
- Shown ONLY when item.source === 'RETURN'
- Read-only

**NotificationBell**

- Bell icon (lucide-react), relative container
- Unread badge: red circle, white numeric count, absolute top-right of bell
- Taps open Notification Drawer (slide-up from right or top)

**Navigation System (Role-Based)**

**GLOBAL: ProfileAvatar (Amendment #4)**

Present in StickyHeader for ALL roles.  
Left side of StickyHeader → taps to open ProfileDrawer (Ganti PIN + Keluar).  
This is how workers access PIN change - they have no Settings tab.

**Worker (Department-based)**

| Department     | My Jobs | Board | Issues | POs | Users | Analytics | Invoicing | Departments | Settings | Export |
| -------------- | ------- | ----- | ------ | --- | ----- | --------- | --------- | ----------- | -------- | ------ |
| **Drafting**   | ✅      | ✅    | ❌     | ❌  | ❌    | ❌        | ❌        | ❌          | ❌       | ❌     |
| **Purchasing** | ✅      | ✅    | ❌     | ❌  | ❌    | ❌        | ❌        | ❌          | ❌       | ❌     |
| **Machining**  | ✅      | ✅    | ✅     | ❌  | ❌    | ❌        | ❌        | ❌          | ❌       | ❌     |
| **Fabrikasi**  | ✅      | ✅    | ✅     | ❌  | ❌    | ❌        | ❌        | ❌          | ❌       | ❌     |
| **QC**         | ✅      | ✅    | ✅     | ❌  | ❌    | ❌        | ❌        | ❌          | ❌       | ❌     |
| **Delivery**   | ✅      | ✅    | ✅     | ❌  | ❌    | ❌        | ❌        | ❌          | ❌       | ❌     |

My Jobs chip includes Lihat Selesai toggle to surface History. No dedicated History tab in nav.

**Management, Admin & Support**

| Role        | My Jobs | Board | Issues | POs | Users | Analytics | Invoicing | Departments | Settings | Export |
| ----------- | ------- | ----- | ------ | --- | ----- | --------- | --------- | ----------- | -------- | ------ |
| **Admin**   | ❌      | ✅    | ✅     | ✅  | ✅    | ✅        | ❌        | ✅          | ✅       | ❌     |
| **Manager** | ❌      | ✅    | ✅     | ✅  | ❌    | ✅        | ❌        | ❌          | ❌       | ✅     |
| **Sales**   | ❌      | ✅    | ❌     | ✅  | ❌    | ✅        | ❌        | ❌          | ❌       | ❌     |
| **Finance** | ❌      | ✅    | ❌     | ✅  | ❌    | ❌        | ✅        | ❌          | ❌       | ❌     |

Finance has NO Analytics tab (C-01 locked).  
Manager has Export tab (PDF + Presentation).  
Admin has Departments + Settings tabs.  
Sales POs tab is read-only (active POs only).  
Finance POs tab is read-only (grouped by invoicing status).

**Route Reference**

| Route        | Access                                             | Notes                                  |
| ------------ | -------------------------------------------------- | -------------------------------------- |
| /select-dept | Public                                             | Pre-login: department + user selection |
| /login       | Public                                             | PIN pad entry                          |
| /jobs        | Worker only                                        | My Jobs + Lihat Selesai chip           |
| /board       | All roles                                          | Global floor view                      |
| /pos         | Admin, Manager, Sales, Finance                     | Role-filtered                          |
| /issues      | Admin, Manager, Machining, Fabrikasi, QC, Delivery | Role-filtered                          |
| /users       | Admin only                                         | User CRUD                              |
| /departments | Admin only                                         | Department management                  |
| /settings    | Admin only                                         | SystemConfig (PO prefix, branding)     |
| /analytics   | Admin, Manager, Sales                              | Blocked for Finance, Workers           |
| /invoicing   | Finance only                                       | Item-level PAID toggles                |
| /export      | Admin, Manager                                     | PDF + Presentation generation          |
| /admin       | Super Admin only                                   | Separate app. Neutral gray UI.         |

**Screen Specifications**

**Screen 1: Department Selection (Pre-Login) - REDESIGNED (Amendment #13)**

**Route**: /select-dept | **Access**: Public  
**Required**: export const dynamic = 'force-dynamic' - prevents Vercel edge caching of user list (Amendment #3).  
**Security model**: Public endpoint is intentional. PIN is the sole security gate. Single-tenant isolated instance - no obscurity benefit.

**Layout**

- **Logo:** Circle 80px, bg #2A7B76, text PG white, centered top.
- **Heading:** Pilih Departemen - 24px 700 DM Sans, centered.
- **Main content:** 3×3 grid of department/role cards with icons.
- **Cards:** Drafting, Purchasing, Machining, Fabrikasi, QC, Delivery, Admin, Manager, Sales.
- **Bottom link:** Lupa PIN? Hubungi Admin - always visible, non-blocking.

**Department / Role Cards**

Each card:

- Layout: icon (top, 32px) + label (bottom, 14px 500 DM Sans).
- Style: bg-white, border-\[#E5E7EB\], rounded-xl, subtle shadow.
- Touch target: minimum 56×56px.
- Icon color: brand #2A7B76.
- Example icons: blueprint (Drafting), cart (Purchasing), gear (Machining), welding (Fabrikasi), shield/check (QC), truck (Delivery), cog (Admin), chart (Manager), briefcase (Sales).

**Interaction - Select Department**

- Entire card is tappable.
- On tap:
  - Card scales to 1.02× and elevates shadow.
  - User drawer slides up from bottom (animate-slide-up 300ms ease-out).
  - Drawer lists users in that department/role.
  - Tap outside or Back closes drawer (animate-fade-out 250ms).

**User Selection Drawer**

- Header: ← Back + Pilih Pengguna - \[Department\].
- Rows: Avatar 32px circle (initials, brand bg) + name 16px 600 + role 13px muted.
- Row touch target ≥ 56px height.
- On user tap: store userId in session and navigate to /login.

**Forgot PIN - "Lupa PIN? Hubungi Admin"**

- Placement: below grid, above safe-area.
- Style: 13px DM Sans, brand #2A7B76, underlined.
- On tap: opens Forgot PIN info sheet.

Info sheet:

- Slides from right (desktop) or bottom (mobile), 300ms ease-out.
- Title Lupa PIN (18px 600) and subtitle PIN Terlupakan? (16px 500 muted).
- Sections:
  - Telepon: +62 271 XXX XXXX (Jam kerja 08:00-17:00) - tel: link.
  - Email: <admin@pogrid.local> - mailto: link.
  - WhatsApp: deep-link <https://wa.me/>....
- Notes (13px muted): admin can reset PIN, prepare ID, reset ≈ 5 minutes.
- Close button at bottom; tap outside also dismisses.
- Values pulled from SystemConfig / env (ADMIN_PHONE, ADMIN_EMAIL, ADMIN_WHATSAPP, BUSINESS_HOURS).

**Screen 2: Login PIN Pad - REDESIGNED (Amendment #13)**

**Route**: /login | **Access**: Public

**Layout**

- App bar: < Kembali → /select-dept + title Masukkan PIN (18px 600).
- Identity: 48px avatar (initials, brand bg) + name 16px 600 + Departemen • Role (13px muted).
- PIN indicator: 4 dots.
- Keypad: 4×3 grid (1-9, blank, 0, backspace).
- Bottom link: Lupa PIN? Hubungi Admin.

**PIN Indicator**

- 4 circles, 14px dia, 12px spacing.
- Empty: #E5E7EB; filled: #2A7B76.
- On error: row uses animate-shake 400ms, circles flash #B33941 then reset.

**Keypad**

- Keys ≥ 72×72px, bg-white, border-\[#E5E7EB\], rounded-lg.
- Numbers: 24px 600 DM Sans, #1A1A2E.
- Backspace: ← icon (24px).
- Row 4: blank | 0 | backspace.

Behavior:

- Tap number: append digit, fill next dot, optional haptic.
- Tap backspace: remove last digit, clear last dot.
- On 4 digits: auto-submit PIN, disable keypad, show light loading state.

**Success & Error**

On success:

- Brief toast PIN benar ✓.
- Set iron-session { userId, name, department, role }.
- Redirect: Workers → /jobs, Admin/Manager/Sales → /board, Finance → /invoicing.

On wrong PIN:

- Shake + red dots. Show PIN salah in #B33941 below dots for ≈2s.
- Clear buffer but keep identity; keypad stays active.

On timeout (>3s) or offline:

- Show Koneksi terputus. Coba lagi. in #DE8F26.
- Provide retry; disable keypad while offline; show global offline banner.

**Forgot PIN Link**

- Same label and style as /select-dept.
- On tap: opens the same Forgot PIN info sheet component (shared).

**Screen 3: Worker - My Jobs (/jobs) - REDESIGNED (Amendment #13)**

**Route:** /jobs | **Role:** Worker  
Workers only operate on /jobs; they never see PO creation or admin views.

**Header Stack (Top → Bottom)**

- **App bar** - Tugas Saya
- **Search bar** - Cari item, customer, PO…
- **Segmented control** - Aktif (N) vs Arsip (M)
- **Month selector row** - previous month / current month + item count / next month

**App bar:**

- Uses global StickyHeader (sticky top-0, h-14, bg-white, border-b).
- Left: ProfileAvatar (opens ProfileDrawer).
- Center: title Tugas Saya (20-24px 700).
- Right: notification bell + logout icon (logout → POST /api/auth/logout → /select-dept).

**Search bar:**

- Under app bar; 48-56px tall; bg-white, border-\[#E5E7EB\], rounded-xl.
- Left icon: magnifying glass. Placeholder: Cari item, customer, PO….
- Debounced text input filtering worker's items by item name, client, PO number.
- Local filtering + optional server refetch for query length ≥ 3.

**Segmented control:**

- Two wide pills: Aktif (N) and Arsip (M). Default: Aktif.
- Active pill: bg-navy/brand, white 14px 600. Inactive: bg-\[#F3F4F6\], #6B7280.
- Aktif = items not yet passed worker's terminal gate for selected month.
- Arsip = worker history items for selected month (replaces old Lihat Selesai chip).

**Month selector:**

- Row: &lt; \[prev month\] | \[Month Year\] + \[N\] item | \[next month\] &gt;.
- Month: 16px 600; count: 13px muted. Uses Asia/Jakarta calendar.
- Changing month refetches /api/items/my-jobs?month=YYYY-MM&mode=active|archive.

**Body - Worker Item Summary Cards**

List of **collapsed Worker Item Summary Cards** (one per item):

- Item name (18px 600) + ISSUE badge (if any) + overall % right-aligned.
- Meta row: clientName · \[qty\] pcs · \[due text\] (13px muted; due in #DE8F26 if overdue).
- Two-line stage summary:
  - DRAFTING 100% · PURCHASING 100% · MACH 7/12 · FABR 0/12
  - QC 0/12 · DELIV 0/12
- Overall progress bar (brand fill #2A7B76, 6-8px height).
- Footer row: lastEventLabel · HH:MM (left) | currentStageLabel → currentStageProgress (right).
- Tap anywhere → expand Worker Item Task Panel inline.
- Only one card expanded at a time; opening another collapses the previous.

**Worker Item Task Panel (Expanded Inline)**

Appears directly under the summary section inside the same card:

- Header: UPDATE · \[STAGE NAME\] (14px 600, navy).
- Progress control: ProgressSlider (qty = 1) OR StepperControl (qty > 1).
- Buttons row: Batalkan (ghost, local reset) | Simpan (brand primary → PATCH /api/items/:id/progress).
- \+ Laporkan Masalah link (danger color) → opens Issue Report bottom sheet.
- When progress saved = 100% on QC or Delivery: card fades out, QCGateSheet or DeliveryGateSheet opens per existing rules.
- Route stays /jobs - expansion is UI-only state (expandedItemId in uiStore).

**allNG items:** visible only via Arsip segment, NOT in Aktif list (Amendment #6).  
**Empty state:** "Tidak ada pekerjaan aktif hari ini" with subtle illustration.

**Screen 4: Worker - Board (Global View)**

**Route:** /board | **Role:** All

- StickyHeader: "Board"
- Horizontal scrollable FilterChips
- All ItemCards across all stages - read-only for non-owners of current stage
- Sorted: Urgent first, then po.createdAt DESC
- allNG items: hidden from Board default view
- Stalled items (>24h no activity): Manager/Admin see secondary "24j+" muted badge on card

**Screen 5: Admin/Manager - Purchase Orders List**

**Route:** /pos | **Role:** Admin, Manager, Sales (read-only for Sales)

- StickyHeader: "Purchase Orders" + \[+ New PO\] button (Admin only)
- List of POCards with summary row and progress bars
- FAB: 56px circle, #2A7B76 bg, white + icon - Admin only, mobile only

**Screen 6: Finance - Invoicing**

**Route:** /invoicing | **Role:** Finance only

- Sections: \\"Segera Tiba\\" (upcoming, read-only) and \\"Siap Invoice\\" (DONE items, toggleable)
- Flat list grouped by PO. ToggleSwitch per item: UNPAID → PAID
- Single tap confirmation, no modal
- PO row collapses with green CLOSED badge when all items PAID
- Return Items (source='RETURN') that reached DONE: shown as distinct line items with ↩ RETURN red pill

**Screen 7: Analytics Dashboard**

**Route:** /analytics | **Role:** Admin, Manager, Sales (NOT Finance)

- Period selector: \[1M\] \[3M\] \[6M\] \[12M\]
- KPI row: horizontal scroll - Total POs, On-Time %, Avg Days, RW Count, Return Count, Stalled Items
- Charts: Bottleneck bar (navy), RW reasons donut, On-Time vs Delayed bar
- Per-client performance list
- All time calculations use **Asia/Jakarta** timezone
- Empty state: skeleton shapes + \\"Belum ada data untuk periode ini\\"

**Screen 8-12: Bottom Sheets**

**Screens 8-10:** QCGateSheet, DeliveryGateSheet, Issue Report Sheet  
(See Component Specifications §9.6, §9.7, and full guidelines)

**Tailwind Config & Global CSS**

**tailwind.config.js**

module.exports = {  
theme: {  
extend: {  
colors: {  
brand: '#2A7B76',  
'brand-dark': '#1D5E5A',  
warning: '#DE8F26',  
danger: '#B33941',  
navy: '#1D3B4D',  
},  
fontFamily: {  
sans: \['DM Sans', 'sans-serif'\],  
},  
animation: {  
'slide-up': 'slide-up 300ms ease-out forwards',  
'fade-out': 'fadeOut 250ms ease-out forwards',  
'fade-in': 'fadeIn 250ms ease-in forwards',  
'pulse-urgent': 'pulse-urgent 2s ease-in-out infinite',  
'shake': 'shake 400ms ease-in-out',  
},  
},  
},  
}

**globals.css**

@import url('<https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap>');  
<br/>:root {  
\--color-brand: #2A7B76;  
\--color-brand-dark: #1D5E5A;  
\--color-warning: #DE8F26;  
\--color-danger: #B33941;  
\--color-navy: #1D3B4D;  
\--color-bg: #F8F9FA;  
\--color-surface: #FFFFFF;  
\--color-text: #1A1A2E;  
\--color-muted: #6B7280;  
}  
<br/>body {  
font-family: 'DM Sans', sans-serif;  
background-color: var(--color-bg);  
color: var(--color-text);  
}  
<br/>@keyframes slide-up {  
from { transform: translateY(100%); }  
to { transform: translateY(0); }  
}  
<br/>@keyframes fadeOut {  
from { opacity: 1; transform: translateY(0); }  
to { opacity: 0; transform: translateY(-8px); }  
}  
<br/>@keyframes fadeIn {  
from { opacity: 0; transform: translateY(-8px); }  
to { opacity: 1; transform: translateY(0); }  
}  
<br/>@keyframes pulse-urgent {  
0%, 100% { opacity: 1; }  
50% { opacity: 0.7; }  
}  
<br/>@keyframes shake {  
0%, 100% { transform: translateX(0); }  
20%, 60% { transform: translateX(-8px); }  
40%, 80% { transform: translateX(8px); }  
}  
<br/>.scrollbar-hide {  
\-ms-overflow-style: none;  
scrollbar-width: none;  
}  
<br/>.scrollbar-hide::-webkit-scrollbar {  
display: none;  
}  
<br/>.pb-safe {  
padding-bottom: env(safe-area-inset-bottom, 0px);  
}

**Prompt Template for AI Agents**

**When Asking Kimi/Claude to Build a Component:**

Reference: POGrid UI/UX Unified Guideline v1.0  
<br/>BUILD: \[ComponentName\]  
<br/>REQUIREMENTS:  
\- Hard Rule #\[N\]: \[specify any hard rule that applies\]  
\- Design Principle: \[P1/P2/P3/P4\]  
\- Colors: \[use color tokens from Color System\]  
\- Typography: \[use type scale from Typography System\]  
\- Touch Targets: \[specify min sizes if interactive\]  
\- Animations: \[specify if any from Animation Library\]  
<br/>SPEC:  
\[paste relevant section from unified guideline, e.g., §9.4 Input Components\]  
<br/>Do NOT deviate from this guideline. If any conflict arises,  
this unified document governs the decision.

**Changelog & Amendments**

**v1.1** (2026-04-01) - Worker flow redesign merged (Amendment #13)

- Screen 1 (/select-dept): 3×3 dept/role grid with icon cards, user bottom-drawer, Forgot PIN info sheet.
- Screen 2 (/login): Redesigned PIN pad - app bar + back nav, identity block, 4×3 keypad, success/error/offline states, shared Forgot PIN sheet.
- Screen 3 (/jobs): Header stack (Tugas Saya app bar + search + Aktif/Arsip segments + month selector), collapsed Worker Item Summary Cards, inline Worker Item Task Panel.
- BottomNav: Worker-specific 4-tab spec (Beranda / Masalah / Cari / Profil) with per-dept Masalah visibility rules.

**v1.0** (2026-04-01) - Initial unified consolidation from 5 source documents

- Merged UI_UX_DESIGN_GUIDELINES v1.0 (§1-25)
- Merged COMPONENT_LIBRARY v1.1 (§9)
- Merged NAVIGATION_MATRIX v1.2 (§10)
- Merged Screens v1.2 (§11)
- Merged POGrid-Manifesto v3.5 (Design Principles §1-4)
- Zero overlapping content. Single source of truth.
- Ready for prompt-engineering with AI agents.

**End of Document**