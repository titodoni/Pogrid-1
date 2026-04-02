# POGrid — Dashboard & Report Page UI/UX Guideline
> **Section:** Management Views Extension
> **Scope:** `/dashboard` (Admin, Manager only) — Report Page with PO Status Cards and Item Detail Drawer
> **Authority:** Extends POGrid Unified UI/UX Guideline v1.1
> **Access Rule:** Management only — Admin, Manager. NOT accessible by Sales, Finance, or Workers.
> **Read Before:** POGrid Unified UI/UX Guideline v1.1 (all Hard Rules apply here without exception)

---

## TABLE OF CONTENTS

1. Hard Rules (Page-Specific)
2. Page Architecture
3. Component: DemoBanner
4. Component: DashboardHeader
5. Component: PeriodSelector
6. Component: KPICard (2×2 Grid)
7. Component: SummaryStatsCard
8. Component: POActiveSection
9. Component: POReportCard (List Item)
10. Component: PODetailDrawer (Bottom Sheet)
11. Sub-Component: MetricBox (inside Drawer)
12. Sub-Component: DepartmentTimeline (inside Drawer)
13. Navigation
14. State Reference
15. Data Requirements

---

## §1. Hard Rules (Page-Specific)

These rules apply in addition to all global Hard Rules from the Unified Guideline.

```
1.  MANAGEMENT ONLY     /dashboard is not accessible by Sales, Finance, or Workers.
2.  READ-ONLY           No write operations from this page. All data is observational.
3.  NO FILTER DEFAULT   POActiveSection shows all active POs on load. No default filter applied.
4.  DEMO BANNER         If mock/demo data is active, DemoBanner renders at absolute top.
5.  DRAWER OVER LIST    PODetailDrawer overlays the list — it does NOT navigate to a new page.
6.  ONE DRAWER AT TIME  Only one PODetailDrawer open at a time. Opening another closes previous.
7.  STALLED BADGE       Stalled indicator visible to Admin and Manager only — never Workers.
8.  URGENT BADGE        Renders on POReportCard always when po.urgent === true.
9.  PERIOD SELECTOR     Controls all KPI cards and SummaryStatsCard simultaneously.
10. TIMEZONE            All time calculations use Asia/Jakarta timezone.
```

---

## §2. Page Architecture

### Layout Stack (Top → Bottom)

```
┌─────────────────────────────────────────┐
│ DemoBanner (conditional)                │  — full-width, above everything
├─────────────────────────────────────────┤
│ StickyHeader                            │  — sticky top-0, h-14
│  Left: ProfileAvatar                    │
│  Center: greeting + "Dashboard"         │
│  Right: on-time % + vs. period label    │
├─────────────────────────────────────────┤
│ Scrollable Content Area                 │
│  ├── PeriodSelector                     │
│  ├── KPICard Grid (2×2)                 │
│  ├── SummaryStatsCard                   │
│  ├── POActiveSection Header             │
│  └── POReportCard list (vertical)       │
├─────────────────────────────────────────┤
│ BottomNav (fixed bottom)                │
└─────────────────────────────────────────┘
```

### Scroll Behavior
- Page content scrolls vertically inside `pt-14 pb-24 px-4`
- StickyHeader does NOT scroll away
- PODetailDrawer is `position: fixed` — it does NOT affect scroll position of the list beneath

### Content Padding
- Horizontal: `px-4` (16px)
- Top: `pt-14` (accounts for StickyHeader 56px)
- Bottom: `pb-24` (accounts for BottomNav 64px + safe area)
- Section gap between major blocks: `gap-6` (24px)

---

## §3. Component: DemoBanner

### Purpose
Communicates to the user that the data displayed is mock/demo data, not real production data.

### Visibility Rule
Renders ONLY when `isDemoMode === true` in app config or environment. Hidden in production.

### Anatomy
```
┌──────────────────────────────────────────────────────────┐
│  ⚠  DEMO MODE AKTIF — Ini adalah data contoh, bukan data nyata  │
└──────────────────────────────────────────────────────────┘
```

### Spec
| Property | Value |
|---|---|
| Position | Fixed top, full-width, above StickyHeader (z-50) |
| Background | `#DE8F26` (Warning token) |
| Text color | `#FFFFFF` |
| Font | 13px DM Sans 500 |
| Height | 36px |
| Text | "⚠ DEMO MODE AKTIF — Ini adalah data contoh, bukan data nyata" |
| Text align | Center |
| Icon | ⚠ unicode or lucide AlertTriangle 14px, inline left of text |

### Layout Impact
When DemoBanner is visible, StickyHeader shifts down by 36px. Page content shifts down by 36px total (banner + header).

---

## §4. Component: DashboardHeader

### Purpose
Combines greeting, page title, and a high-level on-time performance indicator in one sticky row.

### Position
Rendered inside StickyHeader. Sticky top-0 (or top-9 when DemoBanner active).

### Anatomy
```
┌──────────────────────────────────────────────────┐
│ [Avatar]  Selamat [pagi/sore], [Name]    [87%]   │
│           Dashboard                  0% vs peri.. │
└──────────────────────────────────────────────────┘
```

### Left Block
| Element | Spec |
|---|---|
| Greeting | "Selamat pagi/sore, [Name]" — 13px 400 #6B7280 |
| Page Title | "Dashboard" — 24px 700 DM Sans #1A1A2E |
| Greeting time logic | 05:00–11:59 → "pagi", 12:00–17:59 → "sore", 18:00–04:59 → "malam" |

### Right Block
| Element | Spec |
|---|---|
| KPI Value | On-time delivery % for selected period — 28px 700 |
| Color rule | ≥ 80%: `#2A7B76` (brand), 50–79%: `#DE8F26` (warning), < 50%: `#B33941` (danger) |
| Sub-label | "X% vs periode lalu" — 12px 400 #6B7280 |
| Delta sign | ▲ if positive (brand color), ▼ if negative (danger color) |

---

## §5. Component: PeriodSelector

### Purpose
Controls the time window for all KPI cards and SummaryStatsCard simultaneously.

### Anatomy
```
[ Bulan Ini ]   7 Hari   Semua
```

### Spec
| Property | Value |
|---|---|
| Layout | Horizontal row, left-aligned, no scroll |
| Options | "Bulan Ini" \| "7 Hari" \| "Semua" |
| Default | "Bulan Ini" |
| Active pill | bg-white, border border-[#E5E7EB], rounded-2xl, shadow-sm, text 14px 600 #1A1A2E |
| Inactive option | No bg, no border, text 14px 400 #6B7280 |
| Min touch target | 48px height per option |
| Spacing | gap-6 between options |

### Behavior
Tapping a period option:
- Updates `uiStore.dashboardPeriod` state
- All KPICards and SummaryStatsCard re-render with new period data
- POActiveSection is NOT affected by period selector (always shows current active POs)

---

## §6. Component: KPICard (2×2 Grid)

### Purpose
Four scannable metric tiles giving Admin/Manager immediate floor health signal.

### Grid Layout
```
┌──────────────────┬──────────────────┐
│  KPICard A       │  KPICard B       │
│  Terlambat       │  Deadline Dekat  │
├──────────────────┼──────────────────┤
│  KPICard C       │  KPICard D       │
│  Masalah Terbuka │  Selesai         │
└──────────────────┴──────────────────┘
```

Grid CSS: `grid grid-cols-2 gap-3`

### KPICard Anatomy
```
┌──────────────────────────────┐
│ ─── (accent bar, 3px top)    │
│                          >   │
│  5                           │
│  Terlambat                   │
│  PO melewati deadline        │
└──────────────────────────────┘
```

### KPICard Spec
| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Border | `border border-[#E5E7EB]` |
| Border-radius | `rounded-xl` |
| Padding | `p-4` |
| Top accent bar | 3px solid, full width, rounded-t-xl — color varies per card |
| Number | 40px 700 DM Sans #1A1A2E |
| Label | 14px 600 #1A1A2E |
| Sub-label | 13px 400 #6B7280 |
| Chevron | ChevronRight 16px #9CA3AF, top-right |
| Min height | 96px |

### Accent Bar Colors

| Card | Label | Accent Color | Condition |
|---|---|---|---|
| A | Terlambat | `#B33941` (danger) | Always red |
| B | Deadline Dekat | `#DE8F26` (warning) | Always amber |
| C | Masalah Terbuka | `#DE8F26` (warning) | Yellow-amber |
| D | Selesai | `#2A7B76` (brand) | Always green |

### Number Color Rules
| Card | Color Rule |
|---|---|
| Terlambat | Value > 0: `#B33941`; Value = 0: `#2A7B76` |
| Deadline Dekat | Value > 0: `#DE8F26`; Value = 0: `#2A7B76` |
| Masalah Terbuka | Value > 0: `#DE8F26`; Value = 0: `#2A7B76` |
| Selesai | Always `#1A1A2E` |

### Tap Behavior
Each KPICard is tappable (ChevronRight signals this).
Tap navigates to a filtered list view (e.g., tapping "Terlambat" → filtered `/pos?filter=late`).
This is a navigation action — NOT a drawer.

---

## §7. Component: SummaryStatsCard

### Purpose
A single horizontal card providing two secondary metrics below the KPI grid.

### Anatomy
```
┌──────────────────────────────────────────────────────┐
│  [Clock icon]  Rata-rata          PO      Terburuk   │
│                Keterlambatan   Terlambat             │
│                13 hari            5       20h        │
└──────────────────────────────────────────────────────┘
```

### Spec
| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Border | `border border-[#E5E7EB]` |
| Border-radius | `rounded-xl` |
| Padding | `p-4` |
| Layout | Horizontal flex, 3 columns: icon block \| rata-rata block \| PO + Terburuk block |
| Width | Full width |

### Left Block (Icon + Primary Metric)
| Element | Spec |
|---|---|
| Icon | Clock (lucide-react), 24px, bg `#FEF2F2` circle 40px, icon color `#B33941` |
| Label | "Rata-rata Keterlambatan" — 13px 400 #6B7280, 2 lines |
| Value | Number + " hari" — number in 28px 700 `#B33941`, " hari" in 14px 400 #1A1A2E |

### Right Block (Secondary Metrics, side by side)
| Element | Spec |
|---|---|
| Layout | Two sub-columns, divided by implicit spacing |
| Sub-label 1 | "PO Terlambat" — 12px 400 #6B7280 |
| Value 1 | Number — 20px 700 `#1A1A2E` |
| Sub-label 2 | "Terburuk" — 12px 400 #6B7280 |
| Value 2 | Duration (e.g., "20h") — 20px 700 `#B33941` |

### Conditional Display
If no late POs exist (all values = 0): display "Semua PO tepat waktu ✓" in brand color `#2A7B76`, centered, replacing the metric layout.

---

## §8. Component: POActiveSection

### Purpose
Section header separating the KPI summary area from the live PO list below.

### Anatomy
```
STATUS PO AKTIF                              8 PO
```

### Spec
| Property | Value |
|---|---|
| Layout | Horizontal, space-between |
| Left label | "STATUS PO AKTIF" — 12px 700 DM Sans `#1A1A2E`, letter-spacing: `tracking-widest` |
| Right count | "N PO" — 14px 500 `#6B7280` |
| Top margin | `mt-6` (24px above this section header) |
| Bottom margin | `mb-3` (12px below, before first POReportCard) |

### Content Below
Vertical list of POReportCard components. No horizontal scroll. No filter chips on this section (Board has filters — this list is unfiltered by design for 10-second truth).

---

## §9. Component: POReportCard (List Item)

### Purpose
Collapsed summary of a single PO visible in the list. Tapping opens PODetailDrawer.

### Anatomy
```
┌─ (left accent border, 4px) ───────────────────────────┐
│  Shaft Precision D20, Bush...            +1 lagi       │
│  [URGENT]                                              │
│  CV Karya Mandiri · DEMO-2603-002                      │
│                                                        │
│  Progress                                        48%   │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░             │
│                                                        │
│  12 Mar 2026                        19h terlambat      │
│                                                        │
│  ⚠ Machining terhenti 9 hari                          │
│  💬 "Material terlambat datang"                        │
│  Est. selesai: 04 Feb 2026                             │
└───────────────────────────────────────────────────────┘
```

### Spec
| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Border | `border border-[#E5E7EB]` |
| Border-radius | `rounded-xl` |
| Padding | `p-4` |
| Margin bottom | `mb-3` |
| Left accent border | 4px solid, left edge only, rounded-l-xl |
| Tap target | Full card |
| Tap behavior | Opens PODetailDrawer for this PO |

### Left Accent Border Color Rules
| State | Color |
|---|---|
| LATE (terlambat) | `#B33941` (danger) |
| URGENT (not late) | `#DE8F26` (warning) |
| ACTIVE, on-time | `#2A7B76` (brand) |
| DONE / COMPLETE | `#D1FAE5` mapped to `#2A7B76` |

Priority: LATE > URGENT > normal. If both LATE and URGENT: use `#B33941`.

### Row-by-Row Breakdown

**Row 1 — Title + Item Count**
| Element | Spec |
|---|---|
| PO name / item names | Truncated with ellipsis at ~30 chars — 16px 700 #1A1A2E |
| "+N lagi" | If PO has more items than fit in title — 14px 400 #6B7280, inline right |

**Row 2 — URGENT badge (conditional)**
| Element | Spec |
|---|---|
| Badge | Only if `po.urgent === true` |
| Style | bg `#FEF3C7`, text `#DE8F26`, border `border-[#DE8F26]`, rounded-md, 12px 600, px-2 py-0.5 |
| Label | "URGENT" |
| Animation | `animate-pulse-urgent 2s infinite` — same as badge system spec |

**Row 3 — Client + PO Number**
| Element | Spec |
|---|---|
| Text | "ClientName · PO-NUMBER" — 14px 400 `#6B7280` |
| Separator | ` · ` (middle dot) |

**Row 4 — Progress Label + Percentage**
| Element | Spec |
|---|---|
| Left label | "Progress" — 13px 400 `#6B7280` |
| Right value | Overall progress % — 14px 700 |
| Color rule | ≥ 80%: `#2A7B76`; 50–79%: `#DE8F26`; < 50%: `#B33941` |

**Row 5 — Progress Bar**
| Element | Spec |
|---|---|
| Track height | 6px |
| Track bg | `#E5E7EB` |
| Fill color | Matches percentage color rule above |
| Border-radius | `rounded-full` |
| Width | Full card width |

**Row 6 — Delivery Date + Delay Indicator**
| Element | Spec |
|---|---|
| Left | Delivery date — "DD Mon YYYY" — 13px 400 `#6B7280` |
| Right | Delay text — "Nh terlambat" — 13px 700 `#B33941` |
| Right (on-time) | "Tepat waktu" — 13px 500 `#2A7B76` |
| Right (upcoming) | "N hari lagi" — 13px 500 `#DE8F26` |

**Row 7 — Stalled Warning (conditional)**
| Element | Spec |
|---|---|
| Visibility | Only if any item in this PO is stalled (>24h no activity) |
| Icon | AlertTriangle 14px `#DE8F26` inline |
| Text | "[DeptName] terhenti N hari" — 13px 500 `#DE8F26` |

**Row 8 — Latest Issue Comment (conditional)**
| Element | Spec |
|---|---|
| Visibility | Only if PO has at least one unresolved issue |
| Icon | MessageCircle 14px `#6B7280` inline |
| Text | First 50 chars of most recent issue reason — 13px 400 `#6B7280`, quoted |
| Format | 💬 "Issue reason text here" |

**Row 9 — Est. Completion (conditional)**
| Element | Spec |
|---|---|
| Visibility | Only if estimated completion date is calculable |
| Text | "Est. selesai: DD Mon YYYY" — 13px 400 `#6B7280` |

### Empty / Zero State
If no active POs: centered illustration area + text "Tidak ada PO aktif saat ini" — 14px 400 `#6B7280`.

---

## §10. Component: PODetailDrawer (Bottom Sheet)

### Purpose
Expanded PO detail view, triggered by tapping a POReportCard. Shows per-item department timeline within the same PO.

### Trigger
Tap anywhere on POReportCard → open PODetailDrawer for that PO.

### Animation
`animate-slide-up 300ms ease-out` — slides up from bottom of screen.

### Dismiss Behavior
- Drag handle tap or drag down → dismiss
- Tap dark overlay behind drawer → dismiss
- Dismiss animation: translateY(100%) 250ms ease-in

### Overlay
- `fixed inset-0 bg-black/40 z-40` behind the drawer
- Tapping overlay dismisses drawer

### Drawer Container
| Property | Value |
|---|---|
| Position | `fixed bottom-0 left-0 right-0 z-50` |
| Background | `#FFFFFF` |
| Border-radius | `rounded-t-2xl` |
| Max height | `85vh` |
| Overflow | `overflow-y-auto` |
| Padding | `px-4 pt-2 pb-8` |

### Drag Handle
| Property | Value |
|---|---|
| Shape | 40px × 4px pill |
| Color | `#E5E7EB` |
| Position | Centered top of drawer, margin-bottom 12px |

### Drawer Anatomy (Top → Bottom)

```
┌─────────────────────────────────────────────────────┐
│               [drag handle]                         │
│  Shaft Precision D20, Bushing S...    +1 lagi        │
│  [URGENT badge]                                     │
│  CV Karya Mandiri                                   │
│  DEMO-2603-002 · 21 Jan 2026                        │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │  48%    │  │   19    │  │    1    │             │
│  │PROGRESS │  │TERLAMBAT│  │ MASALAH │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                     │
│  TIMELINE DEPARTEMEN                                │
│  ─────────────────────────────────────────────────  │
│  [Item 1 DepartmentTimeline]                        │
│  [Item 2 DepartmentTimeline]                        │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### Drawer Header Block
| Element | Spec |
|---|---|
| PO title | Item names concatenated, truncated — 18px 700 #1A1A2E |
| "+N lagi" | 14px 400 #6B7280 inline |
| URGENT badge | Same spec as POReportCard Row 2 |
| Client name | 14px 400 #6B7280, centered |
| PO number · date | 13px 400 #6B7280, centered, "PO-NUM · DD Mon YYYY" |

### MetricBox Row
3 MetricBox components in a horizontal row. See §11 for spec.

### Timeline Section Header
| Element | Spec |
|---|---|
| Label | "TIMELINE DEPARTEMEN" — 11px 700 `#6B7280`, letter-spacing `tracking-widest` |
| Margin | `mt-5 mb-3` |

### Timeline Content
One DepartmentTimeline block per item in the PO. See §12 for spec. Separated by a subtle divider `border-b border-[#F3F4F6]`.

---

## §11. Sub-Component: MetricBox

### Purpose
Compact metric tile inside PODetailDrawer. Three are always rendered in a row.

### Anatomy
```
┌──────────────────┐
│      48%         │
│    PROGRESS      │
└──────────────────┘
```

### Spec
| Property | Value |
|---|---|
| Layout | 3 equal-width boxes, `grid grid-cols-3 gap-3` |
| Background | Light tint of the box's color (see color rules) |
| Border | 1px solid, same color as text/value |
| Border-radius | `rounded-xl` |
| Padding | `py-3 px-2` |
| Text align | Center |
| Value | 28px 700 DM Sans |
| Label | 11px 700, letter-spacing `tracking-widest` |

### MetricBox Color Rules

| Box | Label | Value Color | Border/bg tint |
|---|---|---|---|
| Progress | "PROGRESS" | `#2A7B76` | bg `#D1FAE5`, border `#2A7B76` |
| Terlambat (hours) | "TERLAMBAT" | `#B33941` | bg `#FEF2F2`, border `#B33941` |
| Masalah (count) | "MASALAH" | `#DE8F26` | bg `#FEF3C7`, border `#DE8F26` |

### Dynamic Color — Progress Box
| Range | Value Color | bg tint |
|---|---|---|
| ≥ 80% | `#2A7B76` | `#D1FAE5` |
| 50–79% | `#DE8F26` | `#FEF3C7` |
| < 50% | `#B33941` | `#FEF2F2` |

### Masalah Box
- Value = total unresolved issues across all items in this PO
- Value = 0: color `#2A7B76`, bg `#D1FAE5`
- Value > 0: color `#DE8F26`, bg `#FEF3C7`

---

## §12. Sub-Component: DepartmentTimeline

### Purpose
Per-item view of all stage progress within a PO. One block per item. Shows which stages are done, blocked, or not started.

### Anatomy
```
Shaft Precision D20                           40%
[TERLAMBAT]   [ > log aktivitas ]

DRFT    PURCH    MACH    FABR    QC    DELIV
 ✓       ✓        !       ○      ○      ○
100%   100%     40%     0%     0%     0%

⚠ Material terlambat datang
```

### Container Spec
| Property | Value |
|---|---|
| Padding | `py-4` |
| Border-bottom | `border-b border-[#F3F4F6]` |
| Last item | No border-bottom |

### Item Name Row
| Element | Spec |
|---|---|
| Item name | 16px 600 `#1A1A2E`, left-aligned |
| Progress % | 14px 600, right-aligned, color follows progress color rule |

### Status + Log Row
| Element | Spec |
|---|---|
| Status badge | Left — see Status Badge Spec below |
| Log button | Right — `> log aktivitas` — monospace/code style, 12px, border `border-[#E5E7EB]`, rounded-md, px-2 py-1 |
| Log button tap | Opens ItemTrack log view (modal or new bottom sheet). Read-only log. |

### Status Badge (inside DepartmentTimeline)

| Status | Label | Color | bg |
|---|---|---|---|
| Late | "TERLAMBAT" | `#B33941` | transparent, border `#B33941` |
| On-time | "TEPAT WAKTU" | `#2A7B76` | transparent, border `#2A7B76` |
| Stalled | "TERHENTI" | `#DE8F26` | transparent, border `#DE8F26` |

Style: outlined pill — no fill bg, border 1px solid, rounded-md, 11px 700, px-2 py-0.5.

### Stage Columns Row (Progress Dots)

6 columns displayed as abbreviations:
`DRFT` | `PURCH` | `MACH` | `FABR` | `QC` | `DELIV`

Only render columns relevant to item's `productionType`. Skip irrelevant stages.

**Column Spec**
| Property | Value |
|---|---|
| Layout | `grid grid-cols-6`, equal width |
| Abbreviation | 10px 600 `#6B7280`, centered |
| Icon size | 24px circle |
| Percentage | 11px 500 below icon, colored |
| Column min width | 0 (allow equal division of full width) |

**Stage Icon Rules**

| State | Icon | Icon Color | Circle bg |
|---|---|---|---|
| 100% complete | ✓ (Check) | `#FFFFFF` | `#2A7B76` |
| In progress (1–99%) | ! (AlertCircle) | `#FFFFFF` | `#B33941` (if stalled) or `#DE8F26` |
| Not started (0%) | ○ (empty circle) | `#D1D5DB` | `#F3F4F6` |
| Not in routing | — (dash) | `#D1D5DB` | transparent |

**Percentage Text Color Rules (below icon)**

| State | Color |
|---|---|
| 100% | `#2A7B76` |
| In progress, on-time | `#DE8F26` |
| In progress, stalled | `#B33941` |
| 0% | `#9CA3AF` |

### Issue Note Row (conditional)

| Element | Spec |
|---|---|
| Visibility | Only if item has at least one unresolved issue |
| Icon | AlertTriangle 13px `#DE8F26` inline |
| Text | Issue reason — 13px 400 `#6B7280` |
| Format | ⚠ [reason text] |

---

## §13. Navigation

### Access
`/dashboard` is accessible from BottomNav for Admin and Manager roles only.

Refer to Navigation System in Unified UI/UX Guideline v1.1 for full role-based nav matrix.

### BottomNav Tab (Admin)
Tab label: "Beranda" | Icon: LayoutDashboard or grid/apps | Route: `/dashboard`

### BottomNav Tab (Manager)
Tab label: "Beranda" | Icon: LayoutDashboard or grid/apps | Route: `/dashboard`

### KPICard Navigation (within page)
| Card tapped | Destination |
|---|---|
| Terlambat | `/pos?filter=late` |
| Deadline Dekat | `/pos?filter=deadline-soon` |
| Masalah Terbuka | `/issues` |
| Selesai | `/pos?filter=complete` |

All navigation via `window.location.href` — no useRouter.

---

## §14. State Reference

All dashboard state lives in Zustand `uiStore`. No local useState for cross-component data.

```
uiStore.dashboardPeriod: 'bulan-ini' | '7-hari' | 'semua'
uiStore.activePODrawerId: string | null   // ID of PO currently in drawer
uiStore.dashboardGreetingTime: string     // computed once on mount
```

### PODetailDrawer State
```
activePODrawerId = null    → No drawer open
activePODrawerId = "po-id" → Drawer open for that PO
```

Opening a drawer: `uiStore.activePODrawerId = po.id`
Closing a drawer: `uiStore.activePODrawerId = null`
Opening another drawer while one is open: set new ID directly — previous drawer closes automatically via conditional render.

---

## §15. Data Requirements

### POReportCard requires per PO:
- `id`, `number`, `clientName`, `deliveryDate`, `status`, `urgent`
- `items[]` with `name`, `progress`, `stage`, `productionType`, `issues[]`
- `overallProgress`: computed as `sum(item.progress) / (items.length * 100) * 100`
- `latestIssueReason`: most recent unresolved issue reason string across all items
- `stalledDeptName`: name of stalled department if any item is stalled
- `stalledDays`: number of days stalled
- `delayHours`: how many hours past delivery date (if late)
- `estCompletion`: estimated completion date (optional, may be null)

### DepartmentTimeline requires per Item:
- `id`, `name`, `progress`, `stage`, `productionType`, `vendorJob`
- `stageBreakdown[]`: `{ stage, progress, isStalled, stalledHours }`
- `issues[]`: `{ reason, resolved }`
- `itemTracks[]`: for log aktivitas (read-only)

### Computed Server-Side (never stored in DB):
- `isStalled` — 24h no ItemTrack activity, Asia/Jakarta timezone
- `stalledDays` — computed from last ItemTrack `createdAt`
- `overallProgress` — aggregate across all items
- `delayHours` — `now - po.deliveryDate` when past due

---

*End of Dashboard Report Page UI/UX Guideline*
*Extends: POGrid Unified UI/UX Guideline v1.1*
*All global Hard Rules from the Unified Guideline apply without exception.*
