'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockItems, type MockItem } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';
import StickyHeader from '@/components/layout/StickyHeader';
import BottomNav from '@/components/layout/BottomNav';
import ProfileAvatar from '@/components/layout/ProfileAvatar';
import NotificationBell from '@/components/ui/NotificationBell';
import StageBadge from '@/components/ui/StageBadge';
import { ReworkPill, ReturnPill, VendorPill, RoutingPill } from '@/components/ui/PillBadges';
import ProgressSlider from '@/components/ui/ProgressSlider';
import StepperControl from '@/components/ui/StepperControl';
import BatalkanControl from '@/components/ui/BatalkanControl';

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function overallProgress(item: MockItem): number {
  if (item.stageBreakdown.length === 0) return 0;
  const total = item.stageBreakdown.reduce((s, b) => s + b.progress, 0);
  const maxTotal = item.stageBreakdown.reduce((s, b) => s + (b.stage === item.stage ? item.qty : 100), 0);
  return maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100);
}

// ─── WorkerItemSummaryCard ────────────────────────────────────────────────────

function WorkerItemSummaryCard({
  item,
  isOwnerStage,
  expanded,
  onToggle,
  onSave,
}: {
  item: MockItem;
  isOwnerStage: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSave: (itemId: string, newProgress: number, previousProgress: number) => void;
}) {
  const openBottomSheet = useUIStore((s) => s.openBottomSheet);
  const [localProgress, setLocalProgress] = useState(item.progress);

  // Keep local progress in sync if parent item was mutated externally
  useEffect(() => { setLocalProgress(item.progress); }, [item.progress]);

  let startTimerFn: ((prev: number) => void) | null = null;

  function handleSave() {
    const previous = item.progress;
    const isComplete =
      (item.qty === 1 && localProgress === 100) ||
      (item.qty > 1 && localProgress === item.qty);

    // Mutate in-memory
    item.progress = localProgress;
    item.updatedAt = new Date().toISOString();

    if (startTimerFn) startTimerFn(previous);
    onSave(item.id, localProgress, previous);

    if (isComplete) {
      const sheet = item.stage === 'QC' ? 'qc-gate' : 'delivery-gate';
      openBottomSheet(sheet, item.id); // Phase 2 stub — no sheet renders yet
    }
  }

  function handleUndo() {
    setLocalProgress(item.progress);
  }

  const isPastDue = new Date(item.po.deliveryDate) < new Date();
  const dueDateStr = new Date(item.po.deliveryDate).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short',
  });
  const overall = overallProgress(item);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] mb-3 overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4"
      >
        {/* Row A */}
        <div className="flex justify-between items-start">
          <span className="text-lg font-semibold text-[#1A1A2E] flex-1 pr-2">{item.name}</span>
          {item.issues.some((i) => !i.resolved)
            ? <StageBadge item={item} />
            : <span className="text-sm text-[#6B7280]">{overall}%</span>
          }
        </div>

        {/* Row B */}
        <p className="text-[13px] mt-0.5" style={{ color: isPastDue ? '#B33941' : '#6B7280' }}>
          {item.po.clientName} · {item.qty} pcs · Due {dueDateStr}
          {isPastDue && ' ⚠'}
        </p>

        {/* Row C — stage breakdown summary */}
        <p className="text-[12px] text-[#9CA3AF] mt-1">
          {item.stageBreakdown.map((b) => `${b.stage.slice(0, 4)} ${b.stage === item.stage ? `${item.progress}/${item.qty}` : `${b.progress}%`}`).join(' · ')}
        </p>

        {/* Row D — overall progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-[#E5E7EB]">
          <div className="h-1.5 rounded-full bg-[#2A7B76]" style={{ width: `${overall}%` }} />
        </div>

        {/* Row E */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-[12px] text-[#9CA3AF]">{item.lastEventLabel} · {item.lastEventTime}</span>
          <span className="text-[12px] text-[#2A7B76]">{item.stage} → {item.qty === 1 ? `${item.progress}%` : `${item.progress}/${item.qty}`}</span>
        </div>

        {/* Pills */}
        <div className="flex gap-1 flex-wrap mt-2">
          <ReworkPill parentItemId={item.parentItemId} parentName={item.parent?.name} />
          <ReturnPill source={item.source} returnBreadcrumb={item.returnBreadcrumb} />
          <VendorPill vendorJob={item.vendorJob} />
          <RoutingPill productionType={item.productionType} />
        </div>
      </button>

      {/* Expanded task panel */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#E5E7EB] animate-fade-in">
          <p className="text-sm font-semibold text-[#1D3B4D] mt-4 mb-2">
            UPDATE · {item.stage}
          </p>

          {item.allNG ? (
            <p className="text-[13px] text-[#B33941] font-medium">Semua unit gagal QC</p>
          ) : isOwnerStage ? (
            item.qty === 1
              ? <ProgressSlider value={localProgress} onChange={setLocalProgress} />
              : <StepperControl current={localProgress} max={item.qty} onChange={setLocalProgress} />
          ) : (
            <p className="text-sm text-[#6B7280]">Read-only — bukan stage kamu</p>
          )}

          {isOwnerStage && !item.allNG && (
            <div className="flex justify-between items-center mt-3">
              <BatalkanControl
                itemId={item.id}
                onUndo={handleUndo}
                onStartTimer={(fn) => { startTimerFn = fn; }}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg px-4 h-10 text-sm font-medium bg-[#2A7B76] text-white"
                >
                  Simpan
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="mt-2 text-[#B33941] text-sm font-medium"
            onClick={() => useUIStore.getState().openBottomSheet('issue', item.id)}
          >
            + Laporkan Masalah
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const session = useUIStore((s) => s.session);
  const expandedItemId = useUIStore((s) => s.expandedItemId);
  const setExpandedItemId = useUIStore((s) => s.setExpandedItemId);
  const selectedSegment = useUIStore((s) => s.selectedSegment);
  const setSelectedSegment = useUIStore((s) => s.setSelectedSegment);
  const selectedMonth = useUIStore((s) => s.selectedMonth);
  const setSelectedMonth = useUIStore((s) => s.setSelectedMonth);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    if (!session) { window.location.href = '/select-dept'; return; }
    if (session.role !== 'worker') { window.location.href = '/board'; }
  }, [session]);

  function handleSearchChange(val: string) {
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }

  const dept = session?.department ?? '';

  // Filtering pipeline
  const filtered = mockItems.filter((item) => {
    // Step 1 — dept filter
    if (item.stage !== dept) return false;
    // Step 2 — segment
    if (selectedSegment === 'active' && item.allNG) return false;
    if (selectedSegment === 'archive' && !item.allNG && item.stage !== 'DONE') return false;
    // Step 3 — month (createdAt or updatedAt)
    const inMonth = item.createdAt.startsWith(selectedMonth) || item.updatedAt.startsWith(selectedMonth);
    if (!inMonth) return false;
    // Step 4 — search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const match = item.name.toLowerCase().includes(q)
        || item.po.clientName.toLowerCase().includes(q)
        || item.po.number.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort: urgent first, then updatedAt ASC (stalest first) for active
  const sorted = [...filtered].sort((a, b) => {
    if (selectedSegment === 'active') {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Count for segment tabs
  const activeCount = mockItems.filter((i) => i.stage === dept && !i.allNG).length;
  const archiveCount = mockItems.filter((i) => i.stage === dept && (i.allNG || i.stage === 'DONE')).length;

  const handleToggle = useCallback((id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  }, [expandedItemId, setExpandedItemId]);

  const handleSave = useCallback((
    itemId: string,
    newProgress: number,
    previousProgress: number,
  ) => {
    // In-memory mutation already done in WorkerItemSummaryCard.handleSave
    // Just log for now — Phase 5 will wire real PATCH
    console.log('[mock] save', itemId, newProgress, previousProgress);
  }, []);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sticky header stack */}
      <div className="sticky top-0 z-30 bg-[#F8F9FA]">
        <StickyHeader
          left={<ProfileAvatar />}
          center={<span className="text-xl font-bold text-[#1A1A2E]">Tugas Saya</span>}
          right={
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                type="button"
                onClick={() => { window.location.href = '/select-dept'; }}
                aria-label="Keluar"
              >
                <LogOut size={20} color="#6B7280" />
              </button>
            </div>
          }
        />

        {/* Search */}
        <div className="mx-4 mt-2">
          <div className="flex items-center gap-2 h-12 bg-white border border-[#E5E7EB] rounded-xl px-4">
            <Search size={16} color="#6B7280" />
            <input
              type="text"
              className="flex-1 text-sm bg-transparent outline-none text-[#1A1A2E] placeholder:text-[#9CA3AF]"
              placeholder="Cari item, customer, PO…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Segmented control */}
        <div className="mx-4 mt-2 flex rounded-xl bg-[#F3F4F6] p-1">
          {(['active', 'archive'] as const).map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => setSelectedSegment(seg)}
              className={[
                'flex-1 rounded-lg py-2 text-sm text-center transition-colors',
                selectedSegment === seg
                  ? 'bg-[#1D3B4D] text-white font-semibold'
                  : 'text-[#6B7280] font-medium',
              ].join(' ')}
            >
              {seg === 'active' ? `Aktif (${activeCount})` : `Arsip (${archiveCount})`}
            </button>
          ))}
        </div>

        {/* Month selector */}
        <div className="mx-4 mt-2 mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
            className="flex items-center justify-center"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={20} color="#1A1A2E" />
          </button>
          <div className="text-center">
            <span className="text-base font-semibold text-[#1A1A2E]">{formatMonth(selectedMonth)}</span>
            <span className="text-[13px] text-[#6B7280]"> · {sorted.length} item</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMonth(nextMonth(selectedMonth))}
            className="flex items-center justify-center"
            style={{ minWidth: 44, minHeight: 44 }}
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={20} color="#1A1A2E" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-4">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="16" width="48" height="36" rx="6" fill="#E5E7EB" />
              <rect x="16" y="24" width="20" height="4" rx="2" fill="#9CA3AF" />
              <rect x="16" y="32" width="32" height="4" rx="2" fill="#9CA3AF" />
              <rect x="16" y="40" width="24" height="4" rx="2" fill="#9CA3AF" />
              <circle cx="48" cy="44" r="10" fill="#2A7B76" opacity="0.15" />
              <path d="M44 44h8M48 40v8" stroke="#2A7B76" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-[#6B7280] text-center">Tidak ada pekerjaan aktif hari ini</p>
          </div>
        ) : (
          sorted.map((item) => (
            <WorkerItemSummaryCard
              key={item.id}
              item={item}
              isOwnerStage={item.stage === dept}
              expanded={expandedItemId === item.id}
              onToggle={() => handleToggle(item.id)}
              onSave={handleSave}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
