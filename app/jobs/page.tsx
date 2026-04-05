'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockItems, type MockItem } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProfileAvatar } from '@/components/layout/ProfileAvatar';
import NotificationBell from '@/components/ui/NotificationBell';
import StageBadge from '@/components/ui/StageBadge';
import { ReworkPill, ReturnPill, VendorPill, RoutingPill } from '@/components/ui/PillBadges';
import ProgressSlider from '@/components/ui/ProgressSlider';
import StepperControl from '@/components/ui/StepperControl';
import BatalkanControl from '@/components/ui/BatalkanControl';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const maxTotal = item.stageBreakdown.length * 100;
  return maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100);
}
function formatStageBreakdown(item: MockItem): string {
  return item.stageBreakdown.map((b) => {
    const pct = b.stage === item.stage
      ? (item.qty === 1 ? item.progress : Math.round((item.progress / item.qty) * 100))
      : b.progress;
    return `${b.stage} ${pct}%`;
  }).join(' · ');
}
function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// ─── Due Date Meta ────────────────────────────────────────────────────────────

type Urgency = 'late' | 'critical' | 'warning' | 'soon' | 'safe';
interface DueDateMeta { dueText: string; countdownText: string; urgency: Urgency; }
const URGENCY_COLOR: Record<Urgency, string> = {
  late: '#B33941', critical: '#B33941', warning: '#DE8F26', soon: '#B08B00', safe: '#4A9B6F',
};
function getDueDateMeta(deliveryDate: string): DueDateMeta {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(deliveryDate); due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
  const dueText = `Due ${due.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  if (diffDays < 0)   return { dueText, countdownText: `Terlambat ${Math.abs(diffDays)} hari`, urgency: 'late' };
  if (diffDays === 0) return { dueText, countdownText: 'Hari ini!', urgency: 'critical' };
  if (diffDays <= 2)  return { dueText, countdownText: `${diffDays} hari lagi`, urgency: 'critical' };
  if (diffDays <= 7)  return { dueText, countdownText: `${diffDays} hari lagi`, urgency: 'warning' };
  if (diffDays <= 14) return { dueText, countdownText: `${diffDays} hari lagi`, urgency: 'soon' };
  return { dueText, countdownText: `${diffDays} hari lagi`, urgency: 'safe' };
}

// ─── Gate Entry Types ─────────────────────────────────────────────────────────
// Phase 2: swap mock mutations to open gate sheets
type GateType = 'DELIVERY_CONFIRM' | 'QC_PASS' | 'QC_NG';

// ─── WorkerItemSummaryCard ─────────────────────────────────────────────────────

function WorkerItemSummaryCard({
  item,
  isOwnerStage,
  expanded,
  onToggle,
  onSave,
  onMockMutated,
}: {
  item: MockItem;
  isOwnerStage: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSave: (itemId: string, newProgress: number, previousProgress: number) => void;
  onMockMutated: () => void;
}) {
  const openBottomSheet = useUIStore((s) => s.openBottomSheet);
  const [localProgress, setLocalProgress] = useState(item.progress);
  const [exiting, setExiting] = useState(false);
  const startTimerRef = useRef<((prev: number) => void) | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalProgress(item.progress); }, [item.progress]);

  // FIX 6: auto-scroll on expand with 64px sticky-header offset
  useEffect(() => {
    if (!expanded) return;
    const t = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, [expanded]);

  const hasUnsaved = localProgress !== item.progress;

  // ─── Gate Entry Handler ───────────────────────────────────────────────────
  // Phase 2: replace mock block body with openBottomSheet call
  function handleGateEntry(type: GateType) {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      if (type === 'DELIVERY_CONFIRM') {
        // Phase 2: openBottomSheet('delivery-gate', item.id)
        item.stage = 'DONE';
        item.progress = 100;
        item.updatedAt = now;
        item.lastEventLabel = 'Terkirim';
        item.lastEventTime = timeStr;
      } else if (type === 'QC_PASS') {
        // Phase 2: openBottomSheet('qc-gate', item.id) — Path A
        item.stage = 'DELIVERY';
        item.progress = 0;
        item.updatedAt = now;
        item.lastEventLabel = 'Lulus QC';
        item.lastEventTime = timeStr;
        const qcBreak = item.stageBreakdown.find((b) => b.stage === 'QC');
        if (qcBreak) qcBreak.progress = 100;
      } else if (type === 'QC_NG') {
        // Phase 2: openBottomSheet('qc-gate', item.id) — Path B (ngQty=1 forced)
        item.allNG = true;
        item.updatedAt = now;
        item.lastEventLabel = 'Semua unit gagal QC';
        item.lastEventTime = timeStr;
        const rwCount = mockItems.filter((i) => i.parentItemId === item.id).length;
        const rwItem: MockItem = {
          id: `${item.id}-rw${rwCount + 1}`,
          poId: item.poId,
          po: { ...item.po },
          name: `${item.name} - RW${rwCount + 1}`,
          qty: 1,
          progress: 0,
          stage: 'QC',
          productionType: item.productionType,
          vendorJob: item.vendorJob,
          urgent: item.urgent,
          allNG: false,
          parentItemId: item.id,
          parent: { name: item.name },
          source: null,
          returnBreadcrumb: null,
          invoiceStatus: item.invoiceStatus,
          notes: null,
          createdAt: now,
          updatedAt: now,
          lastEventLabel: 'Item rework dibuat',
          lastEventTime: timeStr,
          issues: [],
          stageBreakdown: [{ stage: 'QC', progress: 0, isStalled: false }],
        };
        mockItems.push(rwItem);
      }

      setExiting(false);
      onMockMutated();
    }, 250);
  }

  function handleSave() {
    const previous = item.progress;
    const isComplete =
      (item.qty === 1 && localProgress === 100) ||
      (item.qty > 1 && localProgress === item.qty);
    if (startTimerRef.current) startTimerRef.current(previous);
    onSave(item.id, localProgress, previous);
    if (isComplete) {
      const sheet = item.stage === 'QC' ? 'qc-gate' : 'delivery-gate';
      openBottomSheet(sheet, item.id);
    }
  }

  function handleUndo() { setLocalProgress(item.progress); }

  const { dueText, countdownText, urgency } = getDueDateMeta(item.po.deliveryDate);
  const countdownColor = URGENCY_COLOR[urgency];
  const overall = overallProgress(item);
  const latestProgressPct = item.qty === 1 ? `${item.progress}%` : `${item.progress}/${item.qty}`;
  const latestUpdateText = `${latestProgressPct} → ${item.stage} · ${formatShortDate(item.updatedAt)}`;

  // Decision table — FIX 5 (P1-FIX)
  const isBinaryQC       = item.stage === 'QC' && item.qty === 1;
  const isBinaryDelivery = item.stage === 'DELIVERY' && item.qty === 1;
  const isBinary         = isBinaryQC || isBinaryDelivery;

  function renderTaskPanel() {
    if (item.allNG) {
      return <p className="text-[13px] text-[#B33941] font-medium">Semua unit gagal QC</p>;
    }
    if (!isOwnerStage) {
      return <p className="text-sm text-[#6B7280]">Read-only — bukan stage kamu</p>;
    }
    if (isBinaryDelivery) {
      return (
        <button
          type="button"
          onClick={() => handleGateEntry('DELIVERY_CONFIRM')}
          disabled={exiting}
          className="w-full rounded-xl text-white text-[14px] font-medium"
          style={{ minHeight: 56, background: '#2A7B76' }}
        >
          ✅ Terkirim
        </button>
      );
    }
    if (isBinaryQC) {
      return (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleGateEntry('QC_NG')}
            disabled={exiting}
            className="flex-1 rounded-xl text-[14px] font-medium bg-white"
            style={{ minHeight: 56, border: '1.5px solid #B33941', color: '#B33941' }}
          >
            ❌ NG
          </button>
          <button
            type="button"
            onClick={() => handleGateEntry('QC_PASS')}
            disabled={exiting}
            className="flex-1 rounded-xl text-white text-[14px] font-medium"
            style={{ minHeight: 56, background: '#2A7B76' }}
          >
            ✅ G
          </button>
        </div>
      );
    }
    return item.qty === 1
      ? <ProgressSlider value={localProgress} onChange={setLocalProgress} />
      : <StepperControl current={localProgress} max={item.qty} onChange={setLocalProgress} />;
  }

  function renderActionFooter() {
    if (item.allNG || !isOwnerStage || isBinary) return null;
    return (
      <div className="flex justify-between items-center mt-3">
        <BatalkanControl
          itemId={item.id}
          hasUnsaved={hasUnsaved}
          onUndo={handleUndo}
          onStartTimer={(fn) => { startTimerRef.current = fn; }}
        />
        {hasUnsaved ? (
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg px-4 h-10 text-sm font-medium text-white"
            style={{ background: '#2A7B76' }}
          >
            Simpan
          </button>
        ) : (
          <button
            type="button"
            className="text-sm font-medium px-2"
            style={{ color: '#B33941' }}
            onClick={() => useUIStore.getState().openBottomSheet('issue', item.id)}
          >
            🚩 Laporkan
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-xl border border-[#E5E7EB] mb-3 overflow-hidden scroll-mt-16"
      style={{ opacity: exiting ? 0 : 1, transition: 'opacity 250ms ease-out' }}
    >
      <button type="button" onClick={onToggle} className="w-full text-left p-4">
        <div className="flex justify-between items-start">
          <span className="flex-1 pr-2 leading-snug">
            <span className="text-[18px] font-bold text-[#1A1A2E]">{item.name}</span>
            {' '}
            <span className="text-[13px] font-normal text-[#9CA3AF]">({item.po.number})</span>
          </span>
          {item.issues.some((i) => !i.resolved)
            ? <StageBadge item={item} />
            : <span className="text-sm text-[#6B7280]">{overall}%</span>
          }
        </div>
        <p className="text-[13px] font-normal text-[#6B7280] mt-0.5">{item.po.clientName}</p>
        <p className="text-[13px] mt-1 flex flex-wrap items-center gap-x-1">
          <span className="text-[15px] font-bold text-[#1A1A2E]">{item.qty} pcs</span>
          <span className="text-[#9CA3AF]">·</span>
          <span className="text-[#6B7280]">{dueText}</span>
          <span className="text-[#9CA3AF]">·</span>
          <span
            style={{ color: countdownColor }}
            className={[
              urgency === 'late'     ? 'font-bold animate-pulse' : '',
              urgency === 'critical' ? 'font-semibold' : '',
              urgency === 'warning'  ? 'font-medium' : '',
              (urgency === 'soon' || urgency === 'safe') ? 'font-normal' : '',
            ].filter(Boolean).join(' ')}
          >
            {countdownText}
          </span>
        </p>
        <p className="text-[12px] text-[#9CA3AF] mt-1 leading-relaxed">{formatStageBreakdown(item)}</p>
        <div className="mt-2 h-1.5 rounded-full bg-[#E5E7EB]">
          <div className="h-1.5 rounded-full bg-[#2A7B76]" style={{ width: `${overall}%` }} />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[12px] text-[#9CA3AF]">{item.lastEventLabel} · {item.lastEventTime}</span>
          <span className="text-[12px] font-medium text-[#2A7B76]">{latestUpdateText}</span>
        </div>
        <div className="flex gap-1 flex-wrap mt-2">
          <ReworkPill parentItemId={item.parentItemId} parentName={item.parent?.name} />
          <ReturnPill source={item.source} returnBreadcrumb={item.returnBreadcrumb} />
          <VendorPill vendorJob={item.vendorJob} />
          <RoutingPill productionType={item.productionType} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#E5E7EB]">
          <p className="text-sm font-semibold text-[#1D3B4D] mt-4 mb-3">UPDATE · {item.stage}</p>
          {renderTaskPanel()}
          {renderActionFooter()}
          {(!isOwnerStage || (isBinary && !item.allNG)) && (
            <button
              type="button"
              className="mt-3 text-sm font-medium"
              style={{ color: '#B33941' }}
              onClick={() => useUIStore.getState().openBottomSheet('issue', item.id)}
            >
              + Laporkan Masalah
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const hasHydrated        = useUIStore((s) => s._hasHydrated);
  const session            = useUIStore((s) => s.session);
  const expandedItemId     = useUIStore((s) => s.expandedItemId);
  const setExpandedItemId  = useUIStore((s) => s.setExpandedItemId);
  const selectedSegment    = useUIStore((s) => s.selectedSegment);
  const setSelectedSegment = useUIStore((s) => s.setSelectedSegment);
  const selectedMonth      = useUIStore((s) => s.selectedMonth);
  const setSelectedMonth   = useUIStore((s) => s.setSelectedMonth);
  const searchQuery        = useUIStore((s) => s.searchQuery);
  const setSearchQuery     = useUIStore((s) => s.setSearchQuery);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [mutationTick, setMutationTick] = useState(0);

  const handleMockMutated = useCallback(() => {
    setMutationTick((n) => n + 1);
    setExpandedItemId(null);
  }, [setExpandedItemId]);

  const handleToggle = useCallback((id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  }, [expandedItemId, setExpandedItemId]);

  const handleSave = useCallback((
    itemId: string, newProgress: number, previousProgress: number,
  ) => {
    console.log('[mock] save', itemId, newProgress, previousProgress);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || !session.isLoggedIn) {
      window.location.href = '/select-dept';
      return;
    }
    if (session.role !== 'worker') {
      window.location.href = '/board';
    }
  }, [hasHydrated, session]);

  function handleSearchChange(val: string) {
    setSearchQuery(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  }

  // dept defaults to '' when session not yet ready — useMemo must be
  // unconditional (above early return) to satisfy rules-of-hooks
  const dept = session?.department.toUpperCase() ?? '';

  const filtered = useMemo(() => {
    if (!dept) return [];
    return mockItems.filter((item) => {
      if (item.stage !== dept) return false;
      if (selectedSegment === 'active' && item.allNG) return false;
      if (selectedSegment === 'archive' && !item.allNG && item.stage !== 'DONE') return false;
      const itemMonth = (d: string) => d.slice(0, 7);
      const inMonth = itemMonth(item.createdAt) === selectedMonth ||
                      itemMonth(item.updatedAt) === selectedMonth;
      if (!inMonth) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.po.clientName.toLowerCase().includes(q) ||
          item.po.number.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [dept, selectedSegment, selectedMonth, debouncedSearch, mutationTick]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (selectedSegment === 'active') {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [filtered, selectedSegment]);

  const activeCount  = useMemo(() =>
    mockItems.filter((i) => i.stage === dept && !i.allNG).length,
  [dept, mutationTick]);

  const archiveCount = useMemo(() =>
    mockItems.filter((i) => i.stage === dept && (i.allNG || i.stage === 'DONE')).length,
  [dept, mutationTick]);

  // ─── Early return — BELOW all hooks ──────────────────────────────────────
  if (!hasHydrated || !session || !session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#2A7B76] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="sticky top-0 z-30 bg-[#F8F9FA]">
        <StickyHeader
          title="Tugas Saya"
          leftSlot={<ProfileAvatar name={session.name} />}
          rightSlot={<NotificationBell />}
        />
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
        <div className="mx-4 mt-2 mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
            style={{ minWidth: 44, minHeight: 44 }}
            className="flex items-center justify-center"
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
            style={{ minWidth: 44, minHeight: 44 }}
            className="flex items-center justify-center"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={20} color="#1A1A2E" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-24">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-4">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="16" width="48" height="36" rx="6" fill="#E5E7EB" />
              <rect x="16" y="24" width="20" height="4" rx="2" fill="#9CA3AF" />
              <rect x="16" y="32" width="32" height="4" rx="2" fill="#9CA3AF" />
              <rect x="16" y="40" width="24" height="4" rx="2" fill="#9CA3AF" />
            </svg>
            <p className="text-sm text-[#6B7280] text-center">Tidak ada pekerjaan bulan ini</p>
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
              onMockMutated={handleMockMutated}
            />
          ))
        )}
      </div>

      <BottomNav role={session.role} department={session.department} />
    </div>
  );
}
