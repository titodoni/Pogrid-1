'use client';

import React from 'react';
import BottomSheet from './BottomSheet';
import { mockItems } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

export default function DeliveryGateSheet({
  itemId,
  onDismiss,
}: {
  itemId: string;
  onDismiss: () => void;
}) {
  const item = mockItems.find((i) => i.id === itemId);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  if (!item) return null;

  function handleConfirm() {
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    item!.stage = 'DONE';
    item!.progress = item!.qty;
    item!.updatedAt = now;
    item!.lastEventLabel = 'Terkirim';
    item!.lastEventTime = timeStr;
    closeBottomSheet();
    onDismiss();
  }

  function handleCancel() {
    item!.progress = item!.qty - 1;
    closeBottomSheet();
    onDismiss();
  }

  return (
    <BottomSheet isOpen={true} onDismiss={handleCancel}>
      <h2 className="text-[17px] font-bold text-[#1A1A2E] mb-1">Konfirmasi Pengiriman</h2>
      <p className="text-[13px] text-[#6B7280] mb-1">{item.name}</p>
      <p className="text-[13px] text-[#6B7280] mb-6">
        {item.qty} pcs &nbsp;·&nbsp; {item.po.clientName}
      </p>

      <div className="bg-[#F8F9FA] rounded-xl p-4 mb-6">
        <p className="text-[12px] text-[#9CA3AF] uppercase tracking-wide mb-1">Tujuan</p>
        <p className="text-[15px] font-semibold text-[#1A1A2E]">{item.po.clientName}</p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 rounded-xl text-[14px] font-medium bg-white"
          style={{ minHeight: 56, border: '1.5px solid #E5E7EB', color: '#6B7280' }}
        >
          Batalkan
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 rounded-xl text-white text-[15px] font-semibold"
          style={{ minHeight: 56, background: '#2A7B76' }}
        >
          ✅ Sudah Dikirim
        </button>
      </div>
    </BottomSheet>
  );
}
