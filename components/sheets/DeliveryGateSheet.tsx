'use client';

import React, { useEffect } from 'react';
import { Truck } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import { mockItems, mockItemTracks } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

export default function DeliveryGateSheet({
  itemId,
  onDismiss,
}: {
  itemId: string | null;
  onDismiss: () => void;
}) {
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);
  const item = itemId ? mockItems.find((i) => i.id === itemId) ?? null : null;

  useEffect(() => {
    if (!item) onDismiss();
  }, [item, onDismiss]);

  if (!item) return null;

  function executeDeliveryConfirm() {
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    item!.stage = 'DONE';
    item!.progress = item!.qty > 1 ? item!.qty : 100;
    item!.invoiceStatus = 'UNPAID';
    item!.updatedAt = now;
    item!.lastEventLabel = 'Terkirim';
    item!.lastEventTime = timeStr;
    const delivBreak = item!.stageBreakdown.find((b) => b.stage === 'DELIVERY');
    if (delivBreak) delivBreak.progress = 100;
    mockItemTracks.push({
      id: 'track-' + Date.now(),
      itemId: item!.id,
      department: 'DELIVERY',
      action: 'DELIVERY_GATE',
      createdAt: now,
    });
    closeBottomSheet();
    // DONE is terminal — no fade-in, no rollback
  }

  return (
    <BottomSheet isOpen={true} onDismiss={onDismiss}>
      <div className="flex flex-col items-center mt-2">
        <Truck size={40} color="#2A7B76" />
        <p className="text-[18px] font-semibold text-[#1A1A2E] mt-2 text-center">
          Konfirmasi Pengiriman
        </p>
        <p className="text-[14px] text-[#6B7280] text-center mt-0.5">
          {item.name} — {item.qty} unit
        </p>
        <p className="text-[13px] text-[#6B7280] text-center mt-0.5">
          Client: {item.po.clientName}
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
          onClick={executeDeliveryConfirm}
          className="flex-1 rounded-xl h-12 text-sm font-medium text-white"
          style={{ background: '#2A7B76' }}
        >
          ✅ Sudah Dikirim
        </button>
      </div>
    </BottomSheet>
  );
}
