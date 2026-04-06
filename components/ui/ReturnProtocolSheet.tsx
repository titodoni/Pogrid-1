'use client';

import React, { useState } from 'react';
import BottomSheet from './BottomSheet';
import { mockItems } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

const RETURN_REASONS = [
  'Rusak saat pengiriman',
  'Spesifikasi tidak sesuai',
  'Salah item',
  'Lainnya',
];

export default function ReturnProtocolSheet({
  itemId,
  onDismiss,
}: {
  itemId: string;
  onDismiss: () => void;
}) {
  const item = mockItems.find((i) => i.id === itemId);
  const [returnQty, setReturnQty] = useState(1);
  const [reason, setReason] = useState('');
  const [otherText, setOtherText] = useState('');
  const [done, setDone] = useState(false);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  if (!item) return null;

  function handleConfirm() {
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const finalReason = reason === 'Lainnya' ? (otherText.trim() || 'Lainnya') : reason;
    // Regress item to QC
    item!.stage = 'QC';
    item!.progress = 0;
    item!.updatedAt = now;
    item!.lastEventLabel = `Return: ${finalReason}`;
    item!.lastEventTime = timeStr;
    item!.issues.push({
      id: `return-${Date.now()}`,
      label: `Return (${returnQty} pcs): ${finalReason}`,
      resolved: false,
      filedAt: timeStr,
    });
    setDone(true);
    setTimeout(() => {
      closeBottomSheet();
      onDismiss();
    }, 1200);
  }

  if (done) {
    return (
      <BottomSheet isOpen={true} onDismiss={onDismiss}>
        <div className="flex flex-col items-center py-8 gap-3">
          <span className="text-4xl">↩️</span>
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Return dicatat</p>
          <p className="text-[13px] text-[#6B7280]">Item dikembalikan ke tahap QC</p>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet isOpen={true} onDismiss={onDismiss}>
      <h2 className="text-[17px] font-bold text-[#1A1A2E] mb-1">Return dari Client</h2>
      <p className="text-[13px] text-[#6B7280] mb-5">{item.name} · {item.po.clientName}</p>

      {/* Qty */}
      <div className="mb-4">
        <p className="text-[13px] font-semibold text-[#1A1A2E] mb-2">Jumlah dikembalikan</p>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: item.qty }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setReturnQty(n)}
              className="w-11 h-11 rounded-lg text-[14px] font-semibold border"
              style={{
                background: returnQty === n ? '#1D3B4D' : 'white',
                color: returnQty === n ? 'white' : '#1A1A2E',
                borderColor: returnQty === n ? '#1D3B4D' : '#E5E7EB',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="mb-5">
        <p className="text-[13px] font-semibold text-[#1A1A2E] mb-2">Alasan</p>
        <div className="flex flex-col gap-2">
          {RETURN_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className="w-full text-left px-4 py-3 rounded-xl text-[14px] border"
              style={{
                background: reason === r ? '#F0F4F8' : 'white',
                borderColor: reason === r ? '#1D3B4D' : '#E5E7EB',
                color: reason === r ? '#1D3B4D' : '#1A1A2E',
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

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!reason || (reason === 'Lainnya' && !otherText.trim())}
        className="w-full rounded-xl text-[14px] font-semibold"
        style={{
          minHeight: 52,
          background: reason && !(reason === 'Lainnya' && !otherText.trim()) ? '#B33941' : '#E5E7EB',
          color: reason && !(reason === 'Lainnya' && !otherText.trim()) ? 'white' : '#9CA3AF',
        }}
      >
        Konfirmasi Return
      </button>
    </BottomSheet>
  );
}
