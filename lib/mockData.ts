// ─── POGrid Mock Data — Phase 1 Foundation ──────────────────────────────────
// Mode: Mock-only. No imports from external libs. Fully self-contained.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  name: string;
  department: string;
  role: string;
  pin: string;
  active: boolean;
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
  createdAt: string;
  updatedAt: string;
}

export interface MockIssue {
  id: string;
  reason: string;
  resolved: boolean;
  filedById: string;
}

export interface MockStageBreakdown {
  stage: string;
  progress: number;
  isStalled: boolean;
}

export interface MockItem {
  id: string;
  poId: string;
  po: { number: string; clientName: string; deliveryDate: string; urgent: boolean };
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
  source: 'RETURN' | null;
  returnBreadcrumb: string | null;
  invoiceStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastEventLabel: string;
  lastEventTime: string;
  issues: MockIssue[];
  stageBreakdown: MockStageBreakdown[];
}

export interface MockSession {
  userId: string;
  name: string;
  department: string;
  role: string;
  isLoggedIn: boolean;
}

export interface MockReturnItem {
  id: string;
  originalItemId: string;
  qty: number;
  reason: string;
  filedById: string;
  createdAt: string;
}

export interface MockItemTrack {
  id: string;
  itemId: string;
  userId: string;
  department: string;
  action: string;
  progress?: number;
  createdAt: string;
}

// ─── mockUsers ───────────────────────────────────────────────────────────────

export const mockUsers: MockUser[] = [
  { id: 'user-drafter-01',    name: 'Budi Santoso',    department: 'Drafting',   role: 'worker',  pin: '1234', active: true },
  { id: 'user-drafter-02',    name: 'Fitri Anggraeni', department: 'Drafting',   role: 'worker',  pin: '1234', active: true },
  { id: 'user-purchasing-01', name: 'Siti Rahayu',     department: 'Purchasing', role: 'worker',  pin: '1234', active: true },
  { id: 'user-machining-01',  name: 'Ahmad Fauzi',     department: 'Machining',  role: 'worker',  pin: '1234', active: true },
  { id: 'user-machining-02',  name: 'Rizki Pratama',   department: 'Machining',  role: 'worker',  pin: '1234', active: true },
  { id: 'user-fabrikasi-01',  name: 'Hendra Wijaya',   department: 'Fabrikasi',  role: 'worker',  pin: '1234', active: true },
  { id: 'user-fabrikasi-02',  name: 'Wahyu Nugroho',   department: 'Fabrikasi',  role: 'worker',  pin: '1234', active: true },
  { id: 'user-qc-01',         name: 'Dewi Kusuma',     department: 'QC',         role: 'worker',  pin: '1234', active: true },
  { id: 'user-qc-02',         name: 'Eko Purnomo',     department: 'QC',         role: 'worker',  pin: '1234', active: true },
  { id: 'user-delivery-01',   name: 'Yusuf Hidayat',   department: 'Delivery',   role: 'worker',  pin: '1234', active: true },
  { id: 'user-admin-01',      name: 'Agus Setiawan',   department: 'Admin',      role: 'admin',   pin: '0000', active: true },
  { id: 'user-manager-01',    name: 'Bambang Suryadi', department: 'Manager',    role: 'manager', pin: '1234', active: true },
  { id: 'user-sales-01',      name: 'Ratna Sari',      department: 'Sales',      role: 'sales',   pin: '1234', active: true },
  { id: 'user-finance-01',    name: 'Lestari Ningrum', department: 'Finance',    role: 'finance', pin: '1234', active: true },
];

// ─── mockDepartments ─────────────────────────────────────────────────────────

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

// ─── mockPOs ─────────────────────────────────────────────────────────────────

export const mockPOs: MockPO[] = [
  {
    id: 'po-001',
    number: 'PO-2026-001',
    clientName: 'PT. Maju Jaya',
    deliveryDate: '2026-05-30T00:00:00.000Z',
    status: 'ACTIVE',
    urgent: true,
    notes: null,
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'po-002',
    number: 'PO-2026-002',
    clientName: 'CV. Karya Bersama',
    deliveryDate: '2026-03-15T00:00:00.000Z',
    status: 'PARTIAL',
    urgent: false,
    notes: 'Prioritas klien lama',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 'po-003',
    number: 'PO-2026-003',
    clientName: 'PT. Sinar Teknik',
    deliveryDate: '2026-06-15T00:00:00.000Z',
    status: 'ACTIVE',
    urgent: false,
    notes: null,
    createdAt: '2026-04-02T09:00:00.000Z',
    updatedAt: '2026-04-02T09:00:00.000Z',
  },
];

// ─── mockItems ───────────────────────────────────────────────────────────────

export const mockItems: MockItem[] = [
  {
    id: 'item-01',
    poId: 'po-001',
    po: { number: 'PO-2026-001', clientName: 'PT. Maju Jaya', deliveryDate: '2026-05-30T00:00:00.000Z', urgent: true },
    name: 'Bracket Siku A',
    qty: 1, progress: 0, stage: 'DRAFTING',
    productionType: 'machining', vendorJob: false, urgent: true, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-01T08:00:00.000Z', updatedAt: '2026-04-01T08:30:00.000Z',
    lastEventLabel: 'Item dibuat', lastEventTime: '08:00',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 0, isStalled: false },
      { stage: 'MACHINING', progress: 0, isStalled: false },
    ],
  },
  {
    id: 'item-02',
    poId: 'po-001',
    po: { number: 'PO-2026-001', clientName: 'PT. Maju Jaya', deliveryDate: '2026-05-30T00:00:00.000Z', urgent: true },
    name: 'Shaft Presisi D20',
    qty: 12, progress: 4, stage: 'MACHINING',
    productionType: 'machining', vendorJob: false, urgent: true, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-01T08:00:00.000Z', updatedAt: '2026-04-03T14:20:00.000Z',
    lastEventLabel: 'Progress diperbarui', lastEventTime: '14:20',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 100, isStalled: false },
      { stage: 'PURCHASING', progress: 100, isStalled: false },
      { stage: 'MACHINING', progress: 4, isStalled: false },
    ],
  },
  {
    id: 'item-03',
    poId: 'po-002',
    po: { number: 'PO-2026-002', clientName: 'CV. Karya Bersama', deliveryDate: '2026-03-15T00:00:00.000Z', urgent: false },
    name: 'Plat Cover 3mm',
    qty: 8, progress: 3, stage: 'FABRIKASI',
    productionType: 'fabrication', vendorJob: false, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-03-01T08:00:00.000Z', updatedAt: '2026-04-03T09:15:00.000Z',
    lastEventLabel: 'Masalah dilaporkan', lastEventTime: '09:15',
    issues: [{ id: 'iss-01', reason: 'Material salah ketebalan', resolved: false, filedById: 'user-fabrikasi-01' }],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 100, isStalled: false },
      { stage: 'FABRIKASI', progress: 3, isStalled: true },
    ],
  },
  {
    id: 'item-04',
    poId: 'po-002',
    po: { number: 'PO-2026-002', clientName: 'CV. Karya Bersama', deliveryDate: '2026-03-15T00:00:00.000Z', urgent: false },
    name: 'Bushing Set M12',
    qty: 5, progress: 5, stage: 'QC',
    productionType: 'machining', vendorJob: false, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-03-01T08:00:00.000Z', updatedAt: '2026-04-03T11:00:00.000Z',
    lastEventLabel: 'Progress diperbarui', lastEventTime: '11:00',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 100, isStalled: false },
      { stage: 'PURCHASING', progress: 100, isStalled: false },
      { stage: 'MACHINING', progress: 100, isStalled: false },
      { stage: 'QC', progress: 5, isStalled: false },
    ],
  },
  {
    id: 'item-05',
    poId: 'po-002',
    po: { number: 'PO-2026-002', clientName: 'CV. Karya Bersama', deliveryDate: '2026-03-15T00:00:00.000Z', urgent: false },
    name: 'Bushing Set M12 - RW1',
    qty: 2, progress: 0, stage: 'QC',
    productionType: 'machining', vendorJob: false, urgent: false, allNG: false,
    parentItemId: 'item-04', parent: { name: 'Bushing Set M12' }, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-02T13:00:00.000Z', updatedAt: '2026-04-02T13:00:00.000Z',
    lastEventLabel: 'Item rework dibuat', lastEventTime: '13:00',
    issues: [{ id: 'iss-02', reason: 'Dimensi tidak sesuai', resolved: false, filedById: 'user-qc-01' }],
    stageBreakdown: [
      { stage: 'QC', progress: 0, isStalled: false },
    ],
  },
  {
    id: 'item-06',
    poId: 'po-002',
    po: { number: 'PO-2026-002', clientName: 'CV. Karya Bersama', deliveryDate: '2026-03-15T00:00:00.000Z', urgent: false },
    name: 'Rangka Meja Las',
    qty: 1, progress: 100, stage: 'DELIVERY',
    productionType: 'fabrication', vendorJob: false, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-03-01T08:00:00.000Z', updatedAt: '2026-04-03T16:00:00.000Z',
    lastEventLabel: 'Siap kirim', lastEventTime: '16:00',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 100, isStalled: false },
      { stage: 'FABRIKASI', progress: 100, isStalled: false },
      { stage: 'QC', progress: 100, isStalled: false },
      { stage: 'DELIVERY', progress: 100, isStalled: false },
    ],
  },
  {
    id: 'item-07',
    poId: 'po-003',
    po: { number: 'PO-2026-003', clientName: 'PT. Sinar Teknik', deliveryDate: '2026-06-15T00:00:00.000Z', urgent: false },
    name: 'Flange DN50',
    qty: 4, progress: 0, stage: 'PURCHASING',
    productionType: 'both', vendorJob: false, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-02T09:00:00.000Z', updatedAt: '2026-04-02T09:00:00.000Z',
    lastEventLabel: 'Item dibuat', lastEventTime: '09:00',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 100, isStalled: false },
      { stage: 'PURCHASING', progress: 0, isStalled: false },
      { stage: 'MACHINING', progress: 0, isStalled: false },
      { stage: 'FABRIKASI', progress: 0, isStalled: false },
      { stage: 'QC', progress: 0, isStalled: false },
      { stage: 'DELIVERY', progress: 0, isStalled: false },
    ],
  },
  {
    id: 'item-08',
    poId: 'po-003',
    po: { number: 'PO-2026-003', clientName: 'PT. Sinar Teknik', deliveryDate: '2026-06-15T00:00:00.000Z', urgent: false },
    name: 'Pin Silinder Vendor',
    qty: 10, progress: 0, stage: 'QC',
    productionType: 'machining', vendorJob: true, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: 'Item dikerjakan vendor eksternal',
    createdAt: '2026-04-02T09:00:00.000Z', updatedAt: '2026-04-02T09:00:00.000Z',
    lastEventLabel: 'Diterima dari vendor', lastEventTime: '09:00',
    issues: [],
    stageBreakdown: [
      { stage: 'QC', progress: 0, isStalled: false },
    ],
  },
  {
    id: 'item-09',
    poId: 'po-002',
    po: { number: 'PO-2026-002', clientName: 'CV. Karya Bersama', deliveryDate: '2026-03-15T00:00:00.000Z', urgent: false },
    name: 'Plat Cover 3mm RETURN',
    qty: 3, progress: 0, stage: 'QC',
    productionType: 'fabrication', vendorJob: false, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: 'RETURN', returnBreadcrumb: 'PO-2026-002',
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-03T10:00:00.000Z', updatedAt: '2026-04-03T10:00:00.000Z',
    lastEventLabel: 'Return diterima', lastEventTime: '10:00',
    issues: [],
    stageBreakdown: [
      { stage: 'QC', progress: 0, isStalled: false },
    ],
  },
  {
    id: 'item-10',
    poId: 'po-001',
    po: { number: 'PO-2026-001', clientName: 'PT. Maju Jaya', deliveryDate: '2026-05-30T00:00:00.000Z', urgent: true },
    name: 'Housing Pump A',
    qty: 6, progress: 6, stage: 'DELIVERY',
    productionType: 'machining', vendorJob: false, urgent: true, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-01T08:00:00.000Z', updatedAt: '2026-04-04T08:00:00.000Z',
    lastEventLabel: 'Progress diperbarui', lastEventTime: '08:00',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 100, isStalled: false },
      { stage: 'PURCHASING', progress: 100, isStalled: false },
      { stage: 'MACHINING', progress: 100, isStalled: false },
      { stage: 'QC', progress: 100, isStalled: false },
      { stage: 'DELIVERY', progress: 6, isStalled: false },
    ],
  },
  {
    id: 'item-11',
    poId: 'po-003',
    po: { number: 'PO-2026-003', clientName: 'PT. Sinar Teknik', deliveryDate: '2026-06-15T00:00:00.000Z', urgent: false },
    name: 'Cover Plate NG',
    qty: 5, progress: 0, stage: 'QC',
    productionType: 'fabrication', vendorJob: false, urgent: false, allNG: true,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-02T09:00:00.000Z', updatedAt: '2026-04-03T15:00:00.000Z',
    lastEventLabel: 'Semua unit gagal QC', lastEventTime: '15:00',
    issues: [{ id: 'iss-03', reason: 'Semua unit gagal QC', resolved: false, filedById: 'user-qc-01' }],
    stageBreakdown: [
      { stage: 'FABRIKASI', progress: 100, isStalled: false },
      { stage: 'QC', progress: 0, isStalled: true },
    ],
  },
  {
    id: 'item-12',
    poId: 'po-003',
    po: { number: 'PO-2026-003', clientName: 'PT. Sinar Teknik', deliveryDate: '2026-06-15T00:00:00.000Z', urgent: false },
    name: 'Cover Plate NG - RW1',
    qty: 5, progress: 0, stage: 'QC',
    productionType: 'fabrication', vendorJob: false, urgent: false, allNG: false,
    parentItemId: 'item-11', parent: { name: 'Cover Plate NG' }, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-03T15:30:00.000Z', updatedAt: '2026-04-03T15:30:00.000Z',
    lastEventLabel: 'Item rework dibuat', lastEventTime: '15:30',
    issues: [{ id: 'iss-04', reason: 'Semua unit gagal QC', resolved: false, filedById: 'user-qc-01' }],
    stageBreakdown: [
      { stage: 'QC', progress: 0, isStalled: false },
    ],
  },
  {
    id: 'item-13',
    poId: 'po-001',
    po: { number: 'PO-2026-001', clientName: 'PT. Maju Jaya', deliveryDate: '2026-05-30T00:00:00.000Z', urgent: false },
    name: 'Gear Box Cover',
    qty: 1, progress: 0, stage: 'DRAFTING',
    productionType: 'both', vendorJob: false, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-04-01T08:00:00.000Z', updatedAt: '2026-04-01T08:00:00.000Z',
    lastEventLabel: 'Item dibuat', lastEventTime: '08:00',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 0, isStalled: false },
      { stage: 'PURCHASING', progress: 0, isStalled: false },
      { stage: 'MACHINING', progress: 0, isStalled: false },
      { stage: 'FABRIKASI', progress: 0, isStalled: false },
      { stage: 'QC', progress: 0, isStalled: false },
      { stage: 'DELIVERY', progress: 0, isStalled: false },
    ],
  },
  {
    id: 'item-14',
    poId: 'po-002',
    po: { number: 'PO-2026-002', clientName: 'CV. Karya Bersama', deliveryDate: '2026-03-15T00:00:00.000Z', urgent: false },
    name: 'Bracket Mounting B',
    qty: 3, progress: 0, stage: 'DONE',
    productionType: 'machining', vendorJob: false, urgent: false, allNG: false,
    parentItemId: null, parent: null, source: null, returnBreadcrumb: null,
    invoiceStatus: 'UNPAID', notes: null,
    createdAt: '2026-03-01T08:00:00.000Z', updatedAt: '2026-04-02T17:00:00.000Z',
    lastEventLabel: 'Selesai', lastEventTime: '17:00',
    issues: [],
    stageBreakdown: [
      { stage: 'DRAFTING', progress: 100, isStalled: false },
      { stage: 'PURCHASING', progress: 100, isStalled: false },
      { stage: 'MACHINING', progress: 100, isStalled: false },
      { stage: 'QC', progress: 100, isStalled: false },
      { stage: 'DELIVERY', progress: 100, isStalled: false },
    ],
  },
];

// ─── Audit log arrays ─────────────────────────────────────────────────────────

export const mockReturnItems: MockReturnItem[] = [];
export const mockItemTracks: MockItemTrack[] = [];

// ─── mockInvoiceActions ───────────────────────────────────────────────────────

export interface MockInvoiceAction {
  itemId: string;
  action: 'INVOICED' | 'PAID';
  performedById: string;
  createdAt: string;
}

export const mockInvoiceActions: MockInvoiceAction[] = [];

// ─── mockSession (default for UI simulation) ──────────────────────────────────

export const mockSession: MockSession = {
  userId: 'user-machining-01',
  name: 'Ahmad Fauzi',
  department: 'Machining',
  role: 'worker',
  isLoggedIn: true,
};
