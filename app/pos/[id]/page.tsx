'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import useUIStore from '@/store/uiStore';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import StageBadge from '@/components/ui/StageBadge';
import { ReworkPill, ReturnPill } from '@/components/ui/PillBadges';
import { computePOSummary, isSuspiciouslyFast, isItemStalled, formatDateID } from '@/lib/poUtils';

export default function PODetailPage() {
  const hasHydrated = useUIStore(s => s._hasHydrated);
  const session = useUIStore(s => s.session);
  const params = useParams();
  const poId = params.id as string;
  const summary = computePOSummary(poId);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || !session.isLoggedIn) { window.location.href = '/select-dept'; return; }
    if (session.role === 'worker') { window.location.href = '/jobs'; }
  }, [hasHydrated, session]);

  useEffect(() => {
    if (!summary.po) { window.location.href = '/pos'; }
  }, [summary.po]);

  if (!hasHydrated || !session || !session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#2A7B76] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!summary.po) return null;

  const {
    po,
    items,
    doneItems,
    totalItems,
    completionPct,
    hasOpenIssues,
    isOverdue,
    invoiceUnpaidCount,
    invoiceInvoicedCount,
    invoicePaidCount,
  } = summary;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <StickyHeader
        title={po.number}
        leftSlot={
          <button
            type="button"
            onClick={() => { window.location.href = '/pos'; }}
            className="w-10 h-10 flex items-center justify-center text-[#1A1A2E]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        }
      />

      <div className="pb-28">
        {/* HERO SECTION */}
        <div className="bg-white px-4 pt-4 pb-4 border-b border-[#E5E7EB]">
          <p className="text-[18px] font-bold text-[#1A1A2E]">{po.clientName}</p>

          <div className="flex gap-2 flex-wrap mt-1">
            {isOverdue && (
              <span className="bg-[#FEF2F2] text-[#B33941] text-[11px] px-2 h-5 rounded-full flex items-center">Terlambat</span>
            )}
            {hasOpenIssues && (
              <span className="bg-[#FFFBEB] text-[#DE8F26] text-[11px] px-2 h-5 rounded-full flex items-center">⚠ Ada Masalah</span>
            )}
            {po.urgent && (
              <span className="bg-[#ECFDF5] text-[#2A7B76] text-[11px] px-2 h-5 rounded-full flex items-center">Urgent</span>
            )}
          </div>

          <p className="text-[12px] text-[#9CA3AF] mt-1">Tenggat: {formatDateID(po.deliveryDate)}</p>

          {po.notes && (
            <p className="text-[12px] text-[#6B7280] mt-1 italic">{po.notes}</p>
          )}

          <div className="mt-3">
            <div className="h-2 w-full bg-[#F3F4F6] rounded-full">
              <div
                className="h-2 rounded-full bg-[#2A7B76] transition-all duration-300"
                style={{ width: completionPct + '%' }}
              />
            </div>
            <p className="text-[12px] text-[#9CA3AF] mt-1">
              {doneItems}/{totalItems} item selesai — {completionPct}%
            </p>
          </div>
        </div>

        {/* INVOICE KPI ROW */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Belum Invoice', value: invoiceUnpaidCount,   color: '#DE8F26' },
            { label: 'Dikirim',       value: invoiceInvoicedCount, color: '#2A7B76' },
            { label: 'Lunas',         value: invoicePaidCount,     color: '#437A3B' },
          ].map(kpi => (
            <div key={kpi.label} className="flex flex-col items-center">
              <p className="text-[10px] text-[#9CA3AF]">{kpi.label}</p>
              <p className="text-[20px] font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ITEMS LIST */}
        <div className="px-4 pt-3">
          <p className="text-[13px] font-semibold text-[#1A1A2E] mb-2">Daftar Item</p>

          {items.length === 0 ? (
            <p className="text-[13px] text-[#9CA3AF] text-center py-8">Belum ada item di PO ini</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-[#E5E7EB] p-3 mb-2">
                {/* ROW A */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13px] font-semibold text-[#1A1A2E]">{item.name}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.qty} unit</p>
                  </div>
                  <StageBadge item={item} />
                </div>

                {/* ROW B — flag pills */}
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {isSuspiciouslyFast(item) && (
                    <span className="bg-[#FEF3C7] text-[#DE8F26] text-[10px] px-2 h-5 rounded-full flex items-center">
                      ⚡ Suspiciously Fast
                    </span>
                  )}
                  {isItemStalled(item) && (
                    <span className="bg-[#FEF2F2] text-[#B33941] text-[10px] px-2 h-5 rounded-full flex items-center">
                      ⏸ Stalled
                    </span>
                  )}
                  <ReworkPill parentItemId={item.parentItemId} parentName={item.parent?.name} />
                  <ReturnPill source={item.source} returnBreadcrumb={item.returnBreadcrumb} />
                </div>

                {/* ROW C — invoice status chip */}
                <div className="mt-2">
                  {item.invoiceStatus === 'UNPAID' && (
                    <span className="bg-[#FEF2F2] text-[#B33941] text-[10px] px-2 h-5 rounded-full flex items-center w-fit">
                      Belum Invoice
                    </span>
                  )}
                  {item.invoiceStatus === 'INVOICED' && (
                    <span className="bg-[#ECFDF5] text-[#2A7B76] text-[10px] px-2 h-5 rounded-full flex items-center w-fit">
                      Invoice Terkirim
                    </span>
                  )}
                  {item.invoiceStatus === 'PAID' && (
                    <span className="bg-[#F0FDF4] text-[#437A3B] text-[10px] px-2 h-5 rounded-full flex items-center w-fit">
                      ✓ Lunas
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav role={session.role} department={session.department} />
    </div>
  );
}
