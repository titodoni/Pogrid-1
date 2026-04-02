// ─── POGrid Mock Data Foundation ────────────────────────────────────────────
// Phase 0 — drives all UI simulation in Phases 0–3.
// No imports. Fully self-contained.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  name: string;
  department: string;
  role: string;
  pin: string;
}

export interface MockDepartment {
  id: string;
  name: string;
  active: boolean;
}

export interface MockPO {
  id: string;
  number: string;
  clientName: string;
  deliveryDate: string;
  status: string;
  urgent: boolean;
  notes: string | null;
}

export interface MockItem {
  id: string;
  poId: string;
  poNumber: string;
  clientName: string;
  name: string;
  qty: number;
  progress: number;
  stage: string;
  productionType: string;
  vendorJob: boolean;
  urgent: boolean;
  allNG: boolean;
  parentItemId: string | null;
  parent: { name: string } | null;
  invoiceStatus: string;
  source: string | null;
  returnBreadcrumb: string | null;
  issues: { resolved: boolean }[];
  notes: string | null;
}

export interface MockSession {
  userId: string;
  name: string;
  department: string;
  role: string;
  isLoggedIn: boolean;
}

// ─── Export 1: mockUsers ─────────────────────────────────────────────────────
// Rule: floor department → role "worker" | management role → role matches name

export const mockUsers: MockUser[] = [
  // Floor workers — role is always "worker"
  {
    id: 'user-budi',
    name: 'Budi Santoso',
    department: 'Drafting',
    role: 'worker',
    pin: '0000',
  },
  {
    id: 'user-siti',
    name: 'Siti Rahayu',
    department: 'Purchasing',
    role: 'worker',
    pin: '0000',
  },
  // Machining — 2 users to show multi-user department
  {
    id: 'user-ahmad',
    name: 'Ahmad Fauzi',
    department: 'Machining',
    role: 'worker',
    pin: '0000',
  },
  {
    id: 'user-rizki',
    name: 'Rizki Pratama',
    department: 'Machining',
    role: 'worker',
    pin: '0000',
  },
  {
    id: 'user-hendra',
    name: 'Hendra Wijaya',
    department: 'Fabrikasi',
    role: 'worker',
    pin: '0000',
  },
  // QC — 2 users to show multi-user department
  {
    id: 'user-dewi',
    name: 'Dewi Kusuma',
    department: 'QC',
    role: 'worker',
    pin: '0000',
  },
  {
    id: 'user-eko',
    name: 'Eko Purnomo',
    department: 'QC',
    role: 'worker',
    pin: '0000',
  },
  {
    id: 'user-yusuf',
    name: 'Yusuf Hidayat',
    department: 'Delivery',
    role: 'worker',
    pin: '0000',
  },
  // Management / support roles
  {
    id: 'user-admin',
    name: 'Agus Setiawan',
    department: 'Admin',
    role: 'admin',
    pin: '0000',
  },
  {
    id: 'user-manager',
    name: 'Bambang Suryadi',
    department: 'Manager',
    role: 'manager',
    pin: '0000',
  },
  {
    id: 'user-sales',
    name: 'Ratna Sari',
    department: 'Sales',
    role: 'sales',
    pin: '0000',
  },
  {
    id: 'user-finance',
    name: 'Lestari Ningrum',
    department: 'Finance',
    role: 'finance',
    pin: '0000',
  },
  // Extra floor workers to reach 14 total
  {
    id: 'user-wahyu',
    name: 'Wahyu Nugroho',
    department: 'Fabrikasi',
    role: 'worker',
    pin: '0000',
  },
  {
    id: 'user-fitri',
    name: 'Fitri Anggraeni',
    department: 'Drafting',
    role: 'worker',
    pin: '0000',
  },
];

// ─── Export 2: mockDepartments ───────────────────────────────────────────────

export const mockDepartments: MockDepartment[] = [
  { id: 'dept-drafting',   name: 'Drafting',   active: true },
  { id: 'dept-purchasing', name: 'Purchasing', active: true },
  { id: 'dept-machining',  name: 'Machining',  active: true },
  { id: 'dept-fabrikasi',  name: 'Fabrikasi',  active: true },
  { id: 'dept-qc',         name: 'QC',         active: true },
  { id: 'dept-delivery',   name: 'Delivery',   active: true },
  { id: 'role-admin',      name: 'Admin',      active: true },
  { id: 'role-manager',    name: 'Manager',    active: true },
  { id: 'role-sales',      name: 'Sales',      active: true },
  { id: 'role-finance',    name: 'Finance',    active: true },
];

// ─── Export 3: mockPOs ───────────────────────────────────────────────────────

export const mockPOs: MockPO[] = [
  {
    id: 'po-001',
    number: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    deliveryDate: '2026-04-30T00:00:00.000Z',
    status: 'ACTIVE',
    urgent: false,
    notes: null,
  },
  {
    id: 'po-002',
    number: 'PO-2026-002',
    clientName: 'CV. Karya Mandiri',
    deliveryDate: '2026-04-10T00:00:00.000Z',
    status: 'PARTIAL',
    urgent: true,   // ← all items in this PO inherit urgent: true
    notes: 'Prioritas tinggi — klien butuh segera',
  },
  {
    id: 'po-003',
    number: 'PO-2026-003',
    clientName: 'PT. Nusantara Industri',
    deliveryDate: '2026-03-15T00:00:00.000Z', // past date → LATE
    status: 'LATE',
    urgent: false,
    notes: 'Pengiriman tertunda akibat kekurangan material',
  },
];

// ─── Export 4: mockItems ─────────────────────────────────────────────────────

export const mockItems: MockItem[] = [
  // ── PO-2026-001 items ────────────────────────────────────────────────────
  {
    id: 'item-001',
    poId: 'po-001',
    poNumber: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    name: 'Bracket Dudukan Mesin',
    qty: 1,
    progress: 30,
    stage: 'DRAFTING',           // scenario: DRAFTING
    productionType: 'machining',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  {
    id: 'item-002',
    poId: 'po-001',
    poNumber: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    name: 'Poros Engkol Custom',
    qty: 5,
    progress: 60,
    stage: 'PURCHASING',         // scenario: PURCHASING
    productionType: 'machining',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  {
    id: 'item-003',
    poId: 'po-001',
    poNumber: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    name: 'Housing Gearbox A12',
    qty: 5,
    progress: 45,
    stage: 'MACHINING',          // scenario: MACHINING, qty > 1
    productionType: 'machining',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [{ resolved: false }], // scenario: unresolved issue
    notes: null,
  },
  {
    id: 'item-004',
    poId: 'po-001',
    poNumber: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    name: 'Rangka Besi Konstruksi',
    qty: 3,
    progress: 80,
    stage: 'FABRIKASI',          // scenario: FABRIKASI
    productionType: 'fabrication',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  {
    id: 'item-005',
    poId: 'po-001',
    poNumber: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    name: 'Plat Cover Mesin',
    qty: 10,
    progress: 0,
    stage: 'QC',                 // scenario: QC
    productionType: 'both',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  {
    id: 'item-006',
    poId: 'po-001',
    poNumber: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    name: 'Flange Pipa DN100',
    qty: 8,
    progress: 37,
    stage: 'DELIVERY',           // scenario: DELIVERY, qty > 1 (qty=8, progress=37)
    productionType: 'machining',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  {
    id: 'item-007',
    poId: 'po-001',
    poNumber: 'PO-2026-001',
    clientName: 'PT. Maju Jaya Teknik',
    name: 'Sproket Rantai T48',
    qty: 4,
    progress: 100,
    stage: 'DONE',               // scenario: DONE
    productionType: 'machining',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'PAID',       // scenario: invoiceStatus PAID
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  // ── PO-2026-002 items (urgent: true inherited) ───────────────────────────
  {
    id: 'item-008',
    poId: 'po-002',
    poNumber: 'PO-2026-002',
    clientName: 'CV. Karya Mandiri',
    name: 'Silinder Hidrolik 50mm',
    qty: 2,
    progress: 55,
    stage: 'MACHINING',
    productionType: 'machining',
    vendorJob: false,
    urgent: true,                // scenario: urgent item (from PO-2026-002)
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  {
    id: 'item-009',
    poId: 'po-002',
    poNumber: 'PO-2026-002',
    clientName: 'CV. Karya Mandiri',
    name: 'Bracket Siku - RW1',  // scenario: rework item
    qty: 3,
    progress: 0,
    stage: 'QC',
    productionType: 'machining',
    vendorJob: false,
    urgent: true,
    allNG: false,
    parentItemId: 'item-010',    // references the original item below
    parent: { name: 'Bracket Siku' },
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [{ resolved: false }],
    notes: null,
  },
  {
    id: 'item-010',
    poId: 'po-002',
    poNumber: 'PO-2026-002',
    clientName: 'CV. Karya Mandiri',
    name: 'Bracket Siku',        // parent of the RW1 item above
    qty: 7,
    progress: 0,
    stage: 'DELIVERY',
    productionType: 'machining',
    vendorJob: false,
    urgent: true,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
  {
    id: 'item-011',
    poId: 'po-002',
    poNumber: 'PO-2026-002',
    clientName: 'CV. Karya Mandiri',
    name: 'Bushing Tembaga 30mm',  // scenario: allNG item
    qty: 5,
    progress: 0,
    stage: 'QC',
    productionType: 'machining',
    vendorJob: false,
    urgent: true,
    allNG: true,                 // scenario: allNG
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [{ resolved: false }],
    notes: 'Seluruh unit gagal QC — menunggu rework',
  },
  // ── PO-2026-003 items (LATE PO) ─────────────────────────────────────────
  {
    id: 'item-012',
    poId: 'po-003',
    poNumber: 'PO-2026-003',
    clientName: 'PT. Nusantara Industri',
    name: 'Valve Gate 2 inch',   // scenario: vendor job
    qty: 6,
    progress: 70,
    stage: 'PURCHASING',
    productionType: 'machining',
    vendorJob: true,             // scenario: vendorJob
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: 'Item dikerjakan oleh vendor eksternal',
  },
  {
    id: 'item-013',
    poId: 'po-003',
    poNumber: 'PO-2026-003',
    clientName: 'PT. Nusantara Industri',
    name: 'Shaft Coupling 45mm', // scenario: return item
    qty: 4,
    progress: 0,
    stage: 'QC',                 // regressed back to QC after return
    productionType: 'machining',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: 'RETURN',            // scenario: return item
    returnBreadcrumb: 'RETURN dari PO-2026-001', // scenario: returnBreadcrumb
    issues: [],
    notes: null,
  },
  {
    id: 'item-014',
    poId: 'po-003',
    poNumber: 'PO-2026-003',
    clientName: 'PT. Nusantara Industri',
    name: 'Plate Sambungan Las',
    qty: 12,
    progress: 20,
    stage: 'FABRIKASI',
    productionType: 'fabrication',
    vendorJob: false,
    urgent: false,
    allNG: false,
    parentItemId: null,
    parent: null,
    invoiceStatus: 'UNPAID',
    source: null,
    returnBreadcrumb: null,
    issues: [],
    notes: null,
  },
];

// ─── Export 5: mockSession ───────────────────────────────────────────────────
// Default session — Machining worker (Ahmad Fauzi) for UI simulation

export const mockSession: MockSession = {
  userId:     'user-ahmad',
  name:       'Ahmad Fauzi',
  department: 'Machining',
  role:       'worker',
  isLoggedIn: true,
};
