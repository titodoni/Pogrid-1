'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import StepperControl from '@/components/ui/StepperControl';
import { mockItems, mockItemTracks } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

const NG_REASONS = [
  'Dimensi tidak sesuai',
  'Surface / finishing NG',
  'Retak / crack',
  'Salah material',
  'Lainnya',
];

export default function QCGateSheet({
  itemId,
  onDismiss,
}: {
  itemId: string | null;
  onDismiss: () => void;
}) {
  const session = useUIStore((s) => s.session);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  const item = itemId ? mockItems.find((i) => i.id === itemId) ?? null : null;

  const [activePath, setActivePath] = useState<'pass' | 'ng'>('pass');
  const [ngQty, setNgQty] = useState(1);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    if (!item) onDismiss();
  }, [item, onDismiss]);

  if (!item) return null;

  // ── validation ────────────────────────────────────────────────
  const isValid =
    activePath === 'ng' &&
    ngQty > 0 &&
    selectedReason !== null &&
    (selectedReason !== 'Lainnya' || otherText.trim().length > 0);

  // ── Path A ────────────────────────────────────────────────────
  function executePathA() {
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    item!.stage = 'DELIVERY';
    item!.progress = 0;
    item!.updatedAt = now;
    item!.lastEventLabel = 'Lulus QC';
    item!.lastEventTime = timeStr;
    const qcBreak = item!.stageBreakdown.find((b) => b.stage === 'QC');
    if (qcBreak) qcBreak.progress = 100;
    mockItemTracks.push({
      id: 'track-' + Date.now(),
      itemId: item!.id,
      department: 'QC',
      action: 'PASS_GATE',
      createdAt: now,
    });
    closeBottomSheet();
    // No fade-in — card permanently leaves QC worker's list
  }

  // ── Path B — Item Split Protocol ─────────────────────────────
  function executeItemSplit() {
    if (!isValid) return;
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const reason = selectedReason === 'Lainnya' ? otherText.trim() : selectedReason!;
    const isAllNG = ngQty === item!.qty;
    const userId = session?.userId ?? 'unknown';
    const splitQty = isAllNG ? item!.qty : ngQty;

    if (isAllNG) {
      // Card A — stays at QC, marked allNG, disappears from active
      item!.allNG = true;
      item!.updatedAt = now;
      item!.lastEventLabel = 'Semua unit NG';
      item!.lastEventTime = timeStr;
    } else {
      // Card A — partial pass → advance to DELIVERY
      item!.qty = item!.qty - ngQty;
      item!.stage = 'DELIVERY';
      item!.progress = 0;
      item!.updatedAt = now;
      item!.lastEventLabel = `Lulus QC — ${ngQty} unit NG`;
      item!.lastEventTime = timeStr;
      const qcBreak = item!.stageBreakdown.find((b) => b.stage === 'QC');
      if (qcBreak) qcBreak.progress = 100;
    }

    // Card B — rework child
    const rwCount = mockItems.filter((i) => i.parentItemId === item!.id).length;
    const rwItem = {
      id: 'rw-' + Date.now(),
      poId: item!.poId,
      po: { ...item!.po },
      name: `${item!.name} - RW${rwCount + 1}`,
      qty: splitQty,
      progress: 0,
      stage: 'QC',
      productionType: item!.productionType,
      vendorJob: item!.vendorJob,
      urgent: item!.urgent,
      allNG: false,
      parentItemId: item!.id,
      parent: { name: item!.name },
      source: null as null,
      returnBreadcrumb: null as null,
      invoiceStatus: 'UNPAID',
      notes: null as null,
      createdAt: now,
      updatedAt: now,
      lastEventLabel: 'Rework dibuat',
      lastEventTime: timeStr,
      issues: [
        {
          id: 'rw-iss-' + Date.now(),
          reason,
          resolved: false,
          filedById: userId,
        },
      ],
      stageBreakdown: item!.stageBreakdown.map((s) => ({
        ...s,
        progress: s.stage === 'QC' ? 0 : s.progress,
      })),
    };
    mockItems.push(rwItem);

    mockItemTracks.push({
      id: 'track-' + Date.now(),
      itemId: item!.id,
      department: 'QC',
      action: 'SPLIT_PASS',
      createdAt: now,
    });

    closeBottomSheet();
    // No fade-in — both cases remove the original card from active list
  }

  return (
    <BottomSheet isOpen={true} onDismiss={onDismiss}>
      {/* Header */}
      <p className="text-[18px] font-semibold text-[#1A1A2E] leading-tight">{item.name}</p>
      <p className="text-[14px] text-[#6B7280] mt-0.5">{item.qty} unit</p>

      {/* Path Selector Tabs */}
      <div className="flex rounded-xl bg-[#F3F4F6] p-1 mt-4 gap-1">
        <button
          type="button"
          onClick={() => setActivePath('pass')}
          className="flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors"
          style={{
            background: activePath === 'pass' ? '#2A7B76' : 'transparent',
            color: activePath === 'pass' ? 'white' : '#6B7280',
          }}
        >
          ✅ Semua Lolos
        </button>
        <button
          type="button"
          onClick={() => setActivePath('ng')}
          className="flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors"
          style={{
            background: activePath === 'ng' ? '#B33941' : 'transparent',
            color: activePath === 'ng' ? 'white' : '#6B7280',
          }}
        >
          ⚠️ Ada Unit NG
        </button>
      </div>

      {/* ─── PATH A ─── */}
      {activePath === 'pass' && (
        <div>
          <div className="flex flex-col items-center mt-6">
            <CheckCircle2 size={40} color="#2A7B76" />
            <p className="text-[16px] font-semibold text-[#1A1A2E] mt-2 text-center">
              Semua unit lolos QC?
            </p>
            <p className="text-[14px] text-[#6B7280] text-center mt-0.5">
              {item.name} — {item.qty} unit
            </p>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 rounded-xl h-12 text-sm font-medium bg-[#F3F4F6] text-[#374151]"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={executePathA}
              className="flex-1 rounded-xl h-12 text-sm font-medium text-white"
              style={{ background: '#2A7B76' }}
            >
              Kirim ke Delivery
            </button>
          </div>
        </div>
      )}

      {/* ─── PATH B ─── */}
      {activePath === 'ng' && (
        <div>
          {/* NG Qty Stepper */}
          <p className="text-[13px] text-[#6B7280] mt-4 mb-1">Jumlah Unit NG:</p>
          <StepperControl
            current={ngQty}
            max={item.qty}
            onChange={setNgQty}
          />

          {/* Reason Radio */}
          <p className="text-[13px] text-[#6B7280] mt-4 mb-2">Alasan NG:</p>
          <div className="flex flex-col">
            {NG_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedReason(r)}
                className="h-12 flex items-center gap-3 border-b border-[#F3F4F6] cursor-pointer w-full text-left"
                style={{ minHeight: 48 }}
              >
                {/* Radio circle */}
                <span
                  className="flex-shrink-0 rounded-full border-2 flex items-center justify-center"
                  style={{
                    width: 20,
                    height: 20,
                    borderColor: selectedReason === r ? '#2A7B76' : '#E5E7EB',
                    background: selectedReason === r ? '#2A7B76' : 'transparent',
                  }}
                >
                  {selectedReason === r && (
                    <span
                      className="rounded-full bg-white"
                      style={{ width: 6, height: 6 }}
                    />
                  )}
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: selectedReason === r ? '#1A1A2E' : '#374151',
                    fontWeight: selectedReason === r ? 600 : 400,
                  }}
                >
                  {r}
                </span>
              </button>
            ))}
          </div>

          {/* 'Lainnya' free-text — ONLY keyboard exception */}
          {selectedReason === 'Lainnya' && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Tulis alasan..."
              className="mt-3 w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm outline-none"
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 rounded-xl h-12 text-sm font-medium bg-[#F3F4F6] text-[#374151]"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={executeItemSplit}
              className="flex-1 rounded-xl h-12 text-sm font-medium text-white transition-opacity"
              style={{
                background: '#B33941',
                opacity: isValid ? 1 : 0.4,
                pointerEvents: isValid ? 'auto' : 'none',
              }}
            >
              Laporkan Rework
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
