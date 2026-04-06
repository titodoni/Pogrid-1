'use client';

import React, { useState } from 'react';
import BottomSheet from './BottomSheet';
import { mockItems } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

const NG_REASONS = [
  'Dimensi tidak sesuai',
  'Surface finishing NG',
  'Retak / crack',
  'Salah material',
  'Lainnya',
];

export default function QCGateSheet({
  itemId,
  onDismiss,
}: {
  itemId: string;
  onDismiss: () => void;
}) {
  const item = mockItems.find((i) => i.id === itemId);
  const [path, setPath] = useState<'idle' | 'ng'>('idle');
  const [ngQty, setNgQty] = useState(1);
  const [reason, setReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  if (!item) return null;

  function handleAllGood() {
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    item!.stage = 'DELIVERY';
    item!.progress = 0;
    item!.updatedAt = now;
    item!.lastEventLabel = 'Lulus QC';
    item!.lastEventTime = timeStr;
    const qcBreak = item!.stageBreakdown.find((b) => b.stage === 'QC');
    if (qcBreak) qcBreak.progress = 100;
    closeBottomSheet();
    onDismiss();
  }

  function handleRework() {
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const finalReason = reason === 'Lainnya' ? otherText || 'Lainnya' : reason;
    const isAllNG = ngQty >= item!.qty;

    if (isAllNG) {
      item!.allNG = true;
      item!.updatedAt = now;
      item!.lastEventLabel = 'Semua unit gagal QC';
      item!.lastEventTime = timeStr;
    } else {
      item!.qty = item!.qty - ngQty;
      item!.stage = 'DELIVERY';
      item!.progress = 0;
      item!.updatedAt = now;
      item!.lastEventLabel = `Lulus QC — ${ngQty} unit NG`;
      item!.lastEventTime = timeStr;
      const qcBreak = item!.stageBreakdown.find((b) => b.stage === 'QC');
      if (qcBreak) qcBreak.progress = 100;
    }

    const rwCount = mockItems.filter((i) => i.parentItemId === item!.id).length;
    const rwItem = {
      ...item!,
      id: `${item!.id}-rw${rwCount + 1}`,
      name: `${item!.name} - RW${rwCount + 1}`,
      qty: ngQty,
      progress: 0,
      stage: 'QC',
      allNG: false,
      parentItemId: item!.id,
      parent: { name: item!.name },
      createdAt: now,
      updatedAt: now,
      lastEventLabel: finalReason,
      lastEventTime: timeStr,
      issues: [
        {
          id: `issue-rw-${Date.now()}`,
          label: `Rework: ${finalReason}`,
          resolved: false,
          filedAt: timeStr,
        },
      ],
      stageBreakdown: [{ stage: 'QC', progress: 0, isStalled: false }],
    };
    mockItems.push(rwItem);

    closeBottomSheet();
    onDismiss();
  }

  return (
    <BottomSheet isOpen={true} onDismiss={onDismiss}>
      <h2 className="text-[17px] font-bold text-[#1A1A2E] mb-1">QC Gate</h2>
      <p className="text-[13px] text-[#6B7280] mb-5">
        {item.name} &nbsp;·&nbsp; {item.qty} pcs
      </p>

      {path === 'idle' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAllGood}
            className="w-full rounded-xl text-white text-[15px] font-semibold"
            style={{ minHeight: 56, background: '#2A7B76' }}
          >
            ✅ Semua unit lolos QC
          </button>
          <button
            type="button"
            onClick={() => setPath('ng')}
            className="w-full rounded-xl text-[15px] font-semibold bg-white"
            style={{ minHeight: 56, border: '1.5px solid #B33941', color: '#B33941' }}
          >
            ❌ Ada unit NG?
          </button>
        </div>
      )}

      {path === 'ng' && (
        <div className="flex flex-col gap-4">
          {/* Qty selector */}
          <div>
            <p className="text-[13px] font-semibold text-[#1A1A2E] mb-2">Jumlah NG</p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: item.qty }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNgQty(n)}
                  className="w-11 h-11 rounded-lg text-[14px] font-semibold border"
                  style={{
                    background: ngQty === n ? '#B33941' : 'white',
                    color: ngQty === n ? 'white' : '#1A1A2E',
                    borderColor: ngQty === n ? '#B33941' : '#E5E7EB',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-[13px] font-semibold text-[#1A1A2E] mb-2">Alasan</p>
            <div className="flex flex-col gap-2">
              {NG_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="w-full text-left px-4 py-3 rounded-xl text-[14px] border"
                  style={{
                    background: reason === r ? '#FFF5F5' : 'white',
                    borderColor: reason === r ? '#B33941' : '#E5E7EB',
                    color: reason === r ? '#B33941' : '#1A1A2E',
                    fontWeight: reason === r ? 600 : 400,
                  }}
                >
                  {r}
                </button>
              ))}
              {reason === 'Lainnya' && (
                <input
                  type="text"
                  className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-[14px] outline-none"
                  placeholder="Tulis alasan..."
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => setPath('idle')}
              className="flex-1 rounded-xl text-[14px] font-medium bg-white"
              style={{ minHeight: 52, border: '1.5px solid #E5E7EB', color: '#6B7280' }}
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleRework}
              disabled={!reason || (reason === 'Lainnya' && !otherText.trim())}
              className="flex-1 rounded-xl text-white text-[14px] font-semibold"
              style={{
                minHeight: 52,
                background: reason && !(reason === 'Lainnya' && !otherText.trim()) ? '#B33941' : '#E5E7EB',
                color: reason && !(reason === 'Lainnya' && !otherText.trim()) ? 'white' : '#9CA3AF',
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
