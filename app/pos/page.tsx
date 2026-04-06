'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import useUIStore from '@/store/uiStore';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProfileAvatar } from '@/components/layout/ProfileAvatar';
import { computeAllPOSummaries, formatDateID, type POSummary } from '@/lib/poUtils';

function POCard({ summary }: { summary: POSummary }) {
  const { po, doneItems, totalItems, completionPct, isOverdue, hasOpenIssues, invoiceUnpaidCount } = summary;
  if (!po) return null;

  return (
    <div
      className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-3 cursor-pointer active:opacity-80"
      onClick={() => { window.location.href = '/pos/' + po.id; }}
    >
      {/* ROW 1 */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[13px] font-semibold text-[#1A1A2E]">{po.number}</p>
          <p className="text-[12px] text-[#6B7280] mt-0.5">{po.clientName}</p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          {isOverdue && (
            <span className="bg-[#FEF2F2] text-[#B33941] text-[11px] px-2 h-5 rounded-full flex items-center">
              Terlambat
            </span>
          )}
          {hasOpenIssues && (
            <span className="bg-[#FFFBEB] text-[#DE8F26] text-[11px] px-2 h-5 rounded-full flex items-center">
              ⚠ Ada Masalah
            </span>
          )}
          {po.urgent && !isOverdue && (
            <span className="bg-[#ECFDF5] text-[#2A7B76] text-[11px] px-2 h-5 rounded-full flex items-center">
              Urgent
            </span>
          )}
        </div>
      </div>

      {/* ROW 2 — progress */}
      <div className="mt-3">
        <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full">
          <div
            className="h-1.5 rounded-full bg-[#2A7B76] transition-all duration-300"
            style={{ width: completionPct + '%' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-[#9CA3AF]">{doneItems}/{totalItems} item selesai</span>
          <span className="text-[11px] font-semibold text-[#1A1A2E]">{completionPct}%</span>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="mt-2 flex items-center gap-3">
        <span className="text-[11px] text-[#9CA3AF]">Tenggat: {formatDateID(po.deliveryDate)}</span>
        {invoiceUnpaidCount > 0 && (
          <span className="text-[11px] text-[#DE8F26]">💰 {invoiceUnpaidCount} belum invoice</span>
        )}
      </div>
    </div>
  );
}

export default function POsPage() {
  const hasHydrated = useUIStore(s => s._hasHydrated);
  const session = useUIStore(s => s.session);
  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Aktif' | 'Selesai' | 'Terlambat'>('Semua');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || !session.isLoggedIn) { window.location.href = '/select-dept'; return; }
    if (session.role === 'worker') { window.location.href = '/jobs'; }
  }, [hasHydrated, session]);

  const allSummaries = useMemo(() => computeAllPOSummaries(), []);

  const filteredSummaries = useMemo(() => {
    if (activeFilter === 'Aktif') return allSummaries.filter(s => s.po?.status === 'ACTIVE' || s.po?.status === 'PARTIAL');
    if (activeFilter === 'Selesai') return allSummaries.filter(s => s.completionPct === 100);
    if (activeFilter === 'Terlambat') return allSummaries.filter(s => s.isOverdue === true);
    return allSummaries;
  }, [activeFilter, allSummaries]);

  if (!hasHydrated || !session || !session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#2A7B76] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* STICKY WRAPPER */}
      <div className="sticky top-0 z-30 bg-[#F8F9FA]">
        <StickyHeader
          title="Purchase Orders"
          leftSlot={<ProfileAvatar name={session.name} />}
          rightSlot={
            ['manager', 'admin', 'sales'].includes(session.role) ? (
              <button
                type="button"
                onClick={() => { window.location.href = '/pos/new'; }}
                className="w-10 h-10 flex items-center justify-center text-[#2A7B76]"
                aria-label="Buat PO baru"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            ) : <div className="w-10" />
          }
        />

        {/* FILTER TABS */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {(['Semua', 'Aktif', 'Selesai', 'Terlambat'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 rounded-full px-3 h-7 text-xs font-medium transition-colors ${
                activeFilter === f
                  ? 'bg-[#1A1A2E] text-white'
                  : 'bg-white text-[#6B7280] border border-[#E5E7EB]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="px-4 pt-3 pb-28">
        {filteredSummaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
            <p className="text-sm text-[#9CA3AF]">Tidak ada PO ditemukan</p>
          </div>
        ) : (
          filteredSummaries.map(s => <POCard key={s.po!.id} summary={s} />)
        )}
      </div>

      <BottomNav role={session.role} department={session.department} />
    </div>
  );
}
