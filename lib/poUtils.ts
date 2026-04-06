// ─── POGrid Utility Functions — Phase 3 ─────────────────────────────────────
// Pure TypeScript. No 'use client'. No React. No mutations.

import { mockItems, mockPOs, type MockItem, type MockPO } from './mockData';

// ─── computePOSummary ─────────────────────────────────────────────────────────

export interface POSummary {
  po: MockPO | undefined;
  items: MockItem[];
  totalItems: number;
  doneItems: number;
  completionPct: number;
  hasOpenIssues: boolean;
  hasStalledItem: boolean;
  invoiceUnpaidCount: number;
  invoiceInvoicedCount: number;
  invoicePaidCount: number;
  isOverdue: boolean;
  urgentItemCount: number;
}

export function computePOSummary(poId: string): POSummary {
  const po = mockPOs.find(p => p.id === poId);

  if (!po) {
    return {
      po: undefined,
      items: [],
      totalItems: 0,
      doneItems: 0,
      completionPct: 0,
      hasOpenIssues: false,
      hasStalledItem: false,
      invoiceUnpaidCount: 0,
      invoiceInvoicedCount: 0,
      invoicePaidCount: 0,
      isOverdue: false,
      urgentItemCount: 0,
    };
  }

  const items = mockItems.filter(i => i.poId === poId);
  const totalItems = items.length;
  const doneItems = items.filter(i => i.stage === 'DONE').length;
  const completionPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const hasOpenIssues = items.some(i => i.issues.some(j => !j.resolved));
  const hasStalledItem = items.some(i => i.stageBreakdown.some(s => s.isStalled));
  const invoiceUnpaidCount = items.filter(i => i.stage === 'DONE' && i.invoiceStatus === 'UNPAID').length;
  const invoiceInvoicedCount = items.filter(i => i.invoiceStatus === 'INVOICED').length;
  const invoicePaidCount = items.filter(i => i.invoiceStatus === 'PAID').length;
  const isOverdue = new Date(po.deliveryDate) < new Date() && completionPct < 100;
  const urgentItemCount = items.filter(i => i.urgent).length;

  return {
    po,
    items,
    totalItems,
    doneItems,
    completionPct,
    hasOpenIssues,
    hasStalledItem,
    invoiceUnpaidCount,
    invoiceInvoicedCount,
    invoicePaidCount,
    isOverdue,
    urgentItemCount,
  };
}

// ─── computeAllPOSummaries ────────────────────────────────────────────────────

export function computeAllPOSummaries(): POSummary[] {
  return mockPOs
    .map(po => computePOSummary(po.id))
    .filter((s): s is POSummary & { po: MockPO } => s.po !== undefined)
    .sort((a, b) => new Date(b.po.createdAt).getTime() - new Date(a.po.createdAt).getTime());
}

// ─── isSuspiciouslyFast ───────────────────────────────────────────────────────

export function isSuspiciouslyFast(item: MockItem): boolean {
  return (
    item.progress >= 100 &&
    new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() < 5 * 60 * 1000
  );
}

// ─── isItemStalled ────────────────────────────────────────────────────────────

export function isItemStalled(item: MockItem): boolean {
  return (
    item.stageBreakdown.some(s => s.isStalled) ||
    (
      item.progress < 100 &&
      item.stage !== 'DONE' &&
      Date.now() - new Date(item.updatedAt).getTime() > 48 * 60 * 60 * 1000
    )
  );
}

// ─── formatDateID ─────────────────────────────────────────────────────────────

export function formatDateID(isoString: string): string {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── computeAnalytics ────────────────────────────────────────────────────────

export interface AnalyticsResult {
  stageDistribution: { stage: string; count: number }[];
  issueFrequency: { reason: string; count: number }[];
  reworkRate: number;
  onTimeRate: number;
  invoiceDistribution: { status: string; count: number }[];
  stalledCount: number;
  suspiciousCount: number;
  totalActiveItems: number;
}

export function computeAnalytics(): AnalyticsResult {
  const STAGES = ['DRAFTING', 'PURCHASING', 'MACHINING', 'FABRIKASI', 'QC', 'DELIVERY', 'DONE'];

  const stageDistribution = STAGES.map(stage => ({
    stage,
    count: mockItems.filter(i => i.stage === stage).length,
  }));

  const issueMap = new Map<string, number>();
  mockItems.forEach(item => {
    item.issues.forEach(iss => {
      issueMap.set(iss.reason, (issueMap.get(iss.reason) ?? 0) + 1);
    });
  });
  const issueFrequency = Array.from(issueMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const reworkRate =
    mockItems.length === 0
      ? 0
      : Math.round(
          (mockItems.filter(i => i.parentItemId !== null).length / mockItems.length) * 1000
        ) / 10;

  const doneItemsList = mockItems.filter(i => i.stage === 'DONE');
  let onTimeRate = 0;
  if (doneItemsList.length > 0) {
    const onTimeCount = doneItemsList.filter(item => {
      const po = mockPOs.find(p => p.id === item.poId);
      return po !== undefined && new Date(item.updatedAt) <= new Date(po.deliveryDate);
    }).length;
    onTimeRate = Math.round((onTimeCount / doneItemsList.length) * 100);
  }

  const invoiceDistribution = [
    { status: 'UNPAID',   count: mockItems.filter(i => i.invoiceStatus === 'UNPAID').length },
    { status: 'INVOICED', count: mockItems.filter(i => i.invoiceStatus === 'INVOICED').length },
    { status: 'PAID',     count: mockItems.filter(i => i.invoiceStatus === 'PAID').length },
  ];

  const stalledCount = mockItems.filter(i => isItemStalled(i)).length;
  const suspiciousCount = mockItems.filter(i => isSuspiciouslyFast(i)).length;
  const totalActiveItems = mockItems.filter(i => i.stage !== 'DONE' && !i.allNG).length;

  return {
    stageDistribution,
    issueFrequency,
    reworkRate,
    onTimeRate,
    invoiceDistribution,
    stalledCount,
    suspiciousCount,
    totalActiveItems,
  };
}
