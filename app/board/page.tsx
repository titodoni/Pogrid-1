'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo } from 'react';
import { mockItems, mockPOs } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProfileAvatar } from '@/components/layout/ProfileAvatar';
import NotificationBell from '@/components/ui/NotificationBell';
import FilterChip from '@/components/ui/FilterChip';

const FILTER_CHIPS = ['Semua', 'URGENT', 'MASALAH', 'DRAFTING', 'PURCHASING', 'MACHINING', 'FABRIKASI', 'QC', 'DELIVERY'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function getRoleLabel(role: string) {
  if (role === 'admin') return 'Admin';
  if (role === 'manager') return 'Manajer';
  if (role === 'sales') return 'Sales';
  if (role === 'finance') return 'Finance';
  return role;
}

function poProgress(poId: string): number {
  const items = mockItems.filter((i) => i.poId === poId && !i.allNG);
  if (!items.length) return 0;
  const done = items.filter((i) => i.stage === 'DONE').length;
  return Math.round((done / items.length) * 100);
}

function stalledStage(poId: string): string | null {
  for (const item of mockItems.filter((i) => i.poId === poId && !i.allNG)) {
    const s = item.stageBreakdown.find((sb) => sb.isStalled);
    if (s) return `${s.stage} terhenti 13 hari`;
  }
  return null;
}

function firstIssueQuote(poId: string): string | null {
  for (const item of mockItems.filter((i) => i.poId === poId && !i.allNG)) {
    const open = item.issues.find((iss) => !iss.resolved);
    if (open) return open.reason;
  }
  return null;
}

function poItems(poId: string) {
  return mockItems.filter((i) => i.poId === poId && !i.allNG);
}

export default function BoardPage() {
  const hasHydrated       = useUIStore((s) => s._hasHydrated);
  const session           = useUIStore((s) => s.session);
  const boardFilters      = useUIStore((s) => s.boardFilters);
  const toggleBoardFilter = useUIStore((s) => s.toggleBoardFilter);
  const setBoardFilters   = useUIStore((s) => s.setBoardFilters);

  // ── All derived values must be computed unconditionally (above early return)
  // so hooks are always called in the same order every render.
  const nowMs = useMemo(() => Date.now(), []);
  const today = useMemo(() => new Date(), []);

  const activeItems = useMemo(
    () => mockItems.filter((i) => !i.allNG && i.stage !== 'DONE'),
    []
  );

  const activePOIds = useMemo(
    () => [...new Set(activeItems.map((i) => i.poId))],
    [activeItems]
  );

  const terlambatPOs = useMemo(
    () => activePOIds.filter((pid) => {
      const po = mockPOs.find((p) => p.id === pid);
      return po ? new Date(po.deliveryDate) < today : false;
    }),
    [activePOIds, today]
  );

  const deadlineDekatPOs = useMemo(
    () => activePOIds.filter((pid) => {
      const po = mockPOs.find((p) => p.id === pid);
      if (!po) return false;
      const diff = (new Date(po.deliveryDate).getTime() - nowMs) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    }),
    [activePOIds, nowMs]
  );

  const openIssuesCount = useMemo(
    () => activeItems.reduce((acc, i) => acc + i.issues.filter((iss) => !iss.resolved).length, 0),
    [activeItems]
  );

  const selesaiCount = useMemo(() => {
    const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return mockItems.filter((i) => i.stage === 'DONE' && i.updatedAt.startsWith(thisMonth)).length;
  }, [today]);

  const completionPct = useMemo(() => {
    const total = mockItems.filter((i) => !i.allNG).length;
    const done  = mockItems.filter((i) => !i.allNG && i.stage === 'DONE').length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, []);

  const avgDelay = useMemo(() => {
    if (!terlambatPOs.length) return 0;
    return Math.round(
      terlambatPOs.reduce((acc, pid) => {
        const po = mockPOs.find((p) => p.id === pid);
        if (!po) return acc;
        return acc + (nowMs - new Date(po.deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / terlambatPOs.length
    );
  }, [terlambatPOs, nowMs]);

  const filteredPOIds = useMemo(() => {
    if (boardFilters.length === 0) return activePOIds;
    return activePOIds.filter((pid) => {
      const items = mockItems.filter((i) => i.poId === pid && !i.allNG);
      return boardFilters.every((f) => {
        if (f === 'URGENT') return items.some((i) => i.urgent);
        if (f === 'MASALAH') return items.some((i) => i.issues.some((iss) => !iss.resolved));
        return items.some((i) => i.stage === f);
      });
    });
  }, [boardFilters, activePOIds]);

  const poCards = useMemo(() => {
    return filteredPOIds.map((pid) => {
      const po      = mockPOs.find((p) => p.id === pid)!;
      const items   = poItems(pid);
      const urgent  = items.some((i) => i.urgent);
      const stalled = stalledStage(pid);
      const issue   = firstIssueQuote(pid);
      const pct     = poProgress(pid);
      const createdAt = new Date(po.createdAt);
      const dateLabel = `${createdAt.getDate()} ${createdAt.toLocaleString('id-ID', { month: 'short' })} ${createdAt.getFullYear()}`;
      const isLate    = new Date(po.deliveryDate) < today;
      const lateLabel = isLate
        ? `${Math.round((nowMs - new Date(po.deliveryDate).getTime()) / (1000 * 60 * 60))}h terlambat`
        : null;
      const itemNames  = items.map((i) => i.name);
      const firstName  = itemNames[0] ?? '';
      const extraCount = itemNames.length - 1;
      const barColor   = urgent ? '#F97316' : pct >= 75 ? '#3B82F6' : '#2A7B76';
      return { po, urgent, stalled, issue, pct, dateLabel, lateLabel, firstName, extraCount, barColor };
    });
  }, [filteredPOIds, today, nowMs]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || !session.isLoggedIn) { window.location.href = '/select-dept'; return; }
    if (session.role === 'worker') { window.location.href = '/jobs'; }
  }, [hasHydrated, session]);

  if (!hasHydrated || !session || !session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#2A7B76] border-t-transparent animate-spin" />
      </div>
    );
  }

  const worstLabel = '24h';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="sticky top-0 z-30 bg-[#F8F9FA]">
        <StickyHeader
          title="Board"
          leftSlot={<ProfileAvatar name={session.name} />}
          rightSlot={<NotificationBell />}
        />
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTER_CHIPS.map((chip) => {
              const isAll  = chip === 'Semua';
              const active = isAll ? boardFilters.length === 0 : boardFilters.includes(chip);
              return (
                <FilterChip
                  key={chip}
                  label={chip}
                  active={active}
                  onClick={() => { if (isAll) setBoardFilters([]); else toggleBoardFilter(chip); }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-28 space-y-5">
        {/* Dashboard header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#6B7280]">{getGreeting()}, {getRoleLabel(session.role)}</p>
            <h1 className="text-xl font-bold text-[#111827] mt-0.5">Dashboard</h1>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#EF4444]">{completionPct}%</p>
            <p className="text-[10px] text-[#9CA3AF]">{completionPct}% vs periode lalu</p>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex rounded-xl overflow-hidden border border-[#E5E7EB] bg-white">
          {['Bulan Ini', '7 Hari', 'Semua'].map((t, i) => (
            <button
              key={t}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                i === 0 ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9CA3AF]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* KPI cards 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 relative border-t-4 border-[#EF4444] shadow-sm">
            <p className="text-3xl font-bold text-[#111827]">{terlambatPOs.length}</p>
            <p className="text-sm font-semibold text-[#374151] mt-1">Terlambat</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">PO melewati deadline</p>
            <span className="absolute top-4 right-4 text-[#D1D5DB]">›</span>
          </div>
          <div className="bg-white rounded-2xl p-4 relative border-t-4 border-[#F97316] shadow-sm">
            <p className="text-3xl font-bold text-[#111827]">{deadlineDekatPOs.length}</p>
            <p className="text-sm font-semibold text-[#374151] mt-1">Deadline Dekat</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">≤ 3 hari lagi</p>
            <span className="absolute top-4 right-4 text-[#D1D5DB]">›</span>
          </div>
          <div className="bg-white rounded-2xl p-4 relative border-t-4 border-[#EAB308] shadow-sm">
            <p className="text-3xl font-bold text-[#111827]">{openIssuesCount}</p>
            <p className="text-sm font-semibold text-[#374151] mt-1">Masalah Terbuka</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Belum terselesaikan</p>
            <span className="absolute top-4 right-4 text-[#D1D5DB]">›</span>
          </div>
          <div className="bg-white rounded-2xl p-4 relative border-t-4 border-[#22C55E] shadow-sm">
            <p className="text-3xl font-bold text-[#111827]">{selesaiCount}</p>
            <p className="text-sm font-semibold text-[#374151] mt-1">Selesai</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Bulan ini</p>
            <span className="absolute top-4 right-4 text-[#D1D5DB]">›</span>
          </div>
        </div>

        {/* Summary bar */}
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6B7280]">Rata-rata Keterlambatan</p>
            <p className="text-base font-bold text-[#EF4444]">{avgDelay} <span className="text-sm font-normal text-[#374151]">hari</span></p>
          </div>
          <div className="text-center px-3 border-l border-[#F3F4F6]">
            <p className="text-xs text-[#6B7280]">PO Terlambat</p>
            <p className="text-base font-bold text-[#111827]">{terlambatPOs.length}</p>
          </div>
          <div className="text-center px-3 border-l border-[#F3F4F6]">
            <p className="text-xs text-[#6B7280]">Terburuk</p>
            <p className="text-base font-bold text-[#EF4444]">{worstLabel}</p>
          </div>
        </div>

        {/* STATUS PO AKTIF */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest text-[#6B7280] uppercase">Status PO Aktif</p>
            <p className="text-xs text-[#9CA3AF]">{filteredPOIds.length} PO</p>
          </div>
          {poCards.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-10">Tidak ada PO aktif</p>
          ) : (
            <div className="space-y-3">
              {poCards.map(({ po, urgent, stalled, issue, pct, dateLabel, lateLabel, firstName, extraCount, barColor }) => (
                <div key={po.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-l-4" style={{ borderLeftColor: urgent ? '#EF4444' : '#E5E7EB' }}>
                    <div className="flex items-start gap-2 mb-1">
                      <p className="font-semibold text-[#111827] text-sm leading-tight flex-1">
                        {firstName.length > 20 ? firstName.slice(0, 20) + '...' : firstName}
                        {extraCount > 0 && (
                          <span className="ml-1 text-xs text-[#6B7280] font-normal">+{extraCount} lagi</span>
                        )}
                      </p>
                      {urgent && (
                        <span className="flex-shrink-0 text-[10px] font-bold tracking-wide bg-[#FEE2E2] text-[#EF4444] px-2 py-0.5 rounded-full">URGENT</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mb-3">{po.clientName} · {po.number}</p>
                    <div className="mb-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-[#6B7280]">Progress</p>
                        <p className="text-xs font-semibold" style={{ color: barColor }}>{pct}%</p>
                      </div>
                      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-[#9CA3AF]">{dateLabel}</p>
                      {lateLabel && <p className="text-xs font-semibold text-[#EF4444]">{lateLabel}</p>}
                    </div>
                    {stalled && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                        <p className="text-xs text-[#F97316]">{stalled}</p>
                      </div>
                    )}
                    {issue && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        <p className="text-xs text-[#6B7280] italic">&ldquo;{issue}&rdquo;</p>
                      </div>
                    )}
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      Est. selesai: {new Date(po.deliveryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav role={session.role} department={session.department} />
    </div>
  );
}
