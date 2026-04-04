'use client';

import React from 'react';

// ─── VendorPill ───────────────────────────────────────────────────────────────
export function VendorPill({ vendorJob }: { vendorJob: boolean }) {
  if (!vendorJob) return null;
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#9CA3AF] text-white">
      VENDOR
    </span>
  );
}

// ─── RoutingPill ──────────────────────────────────────────────────────────────
export function RoutingPill({ productionType }: { productionType: string }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
      {productionType.toUpperCase()}
    </span>
  );
}

// ─── ReworkPill ───────────────────────────────────────────────────────────────
export function ReworkPill({
  parentItemId,
  parentName,
}: {
  parentItemId: string | null;
  parentName?: string;
}) {
  if (!parentItemId) return null;
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#DE8F26] text-white">
      ↩ RW dari {parentName ?? '—'}
    </span>
  );
}

// ─── ReturnPill ───────────────────────────────────────────────────────────────
export function ReturnPill({
  source,
  returnBreadcrumb,
}: {
  source: string | null;
  returnBreadcrumb: string | null;
}) {
  if (source !== 'RETURN') return null;
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#B33941] text-white">
      ↩ RETURN dari {returnBreadcrumb ?? '—'}
    </span>
  );
}
