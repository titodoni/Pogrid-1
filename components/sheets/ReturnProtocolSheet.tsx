'use client';

import React, { useEffect, useState } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import StepperControl from '@/components/ui/StepperControl';
import { mockItems, mockReturnItems, mockItemTracks } from '@/lib/mockData';
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
  itemId: string | null;
  onDismiss: () => void;
}) {
  const session = useUIStore((s) => s.session);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);
  const item = itemId ? mockItems.find((i) => i.id === itemId) ?? null : null;

  const [returnQty, setReturnQty] = useState(1);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    if (!item) onDismiss();
  }, [item, onDismiss]);

  if (!item) return null;

  const isValid =
    returnQty > 0 &&
    selectedReason !== null &&
    (selectedReason !== 'Lainnya' || otherText.trim().length > 0);

  function executeReturn() {
    if (!isValid) return;
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const reason = selectedReason === 'Lainnya' ? otherText.trim() : selectedReason!;
    const userId = session?.userId ?? 'unknown';

    // 1. Regress original item to QC
    item!.stage = 'QC';
    item!.progress = 0;
    item!.source = 'RETURN';
    item!.returnBreadcrumb = item!.po.number;
    item!.updatedAt = now;
    item!.lastEventLabel = `Return: ${reason}`;
    item!.lastEventTime = timeStr;

    // 2. Audit log — never rendered in UI
    mockReturnItems.push({
      id: 'ret-' + Date.now(),
      originalItemId: item!.id,
      qty: returnQty,
      reason,
      filedById: userId,
      createdAt: now,
    });

    // 3. Track log
    mockItemTracks.push({
      id: 'track-' + Date.now(),
      itemId: item!.id,
      department: 'DELIVERY',
      action: 'CLIENT_RETURN',
      createdAt: now,
    });

    closeBottomSheet();
    // source='RETURN' now set — ReturnPill and StageBadge will reflect automatically
  }

  return (
    <BottomSheet isOpen={true} onDismiss={onDismiss}>
      {/* Header */}
      <p className="text-[18px] font-semibold text-[#1A1A2E]">🔄 Return Klien</p>
      <p className="text-[14px] text-[#6B7280] mt-0.5">{item.name}</p>
      <p className="text-[13px] text-[#9CA3AF] mt-0.5">Max return: {item.qty} unit</p>

      {/* Return Qty Stepper */}
      <p className="text-[13px] text-[#6B7280] mt-4 mb-1">Jumlah Unit Return:</p>
      <StepperControl
        current={returnQty}
        max={item.qty}
        onChange={setReturnQty}
      />

      {/* Reason Radio */}
      <p className="text-[13px] text-[#6B7280] mt-4 mb-2">Alasan Return:</p>
      <div className="flex flex-col">
        {RETURN_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelectedReason(r)}
            className="flex items-center gap-3 border-b border-[#F3F4F6] cursor-pointer w-full text-left"
            style={{ minHeight: 48 }}
          >
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
                <span className="rounded-full bg-white" style={{ width: 6, height: 6 }} />
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

      {/* Lainnya free-text */}
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
          onClick={executeReturn}
          className="flex-1 rounded-xl h-12 text-sm font-medium text-white transition-opacity"
          style={{
            background: '#B33941',
            opacity: isValid ? 1 : 0.4,
            pointerEvents: isValid ? 'auto' : 'none',
          }}
        >
          Konfirmasi Return
        </button>
      </div>
    </BottomSheet>
  );
}
