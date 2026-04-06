'use client';

import React, { useState } from 'react';
import BottomSheet from './BottomSheet';
import { mockItems } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

const ISSUE_PRESETS = [
  'Material belum datang',
  'Mesin bermasalah',
  'Gambar teknis tidak jelas',
  'Kekurangan tenaga',
  'Menunggu konfirmasi',
  'Lainnya',
];

export default function IssueReportSheet({
  itemId,
  onDismiss,
}: {
  itemId: string;
  onDismiss: () => void;
}) {
  const item = mockItems.find((i) => i.id === itemId);
  const [selected, setSelected] = useState('');
  const [otherText, setOtherText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  if (!item) return null;

  function handleSubmit() {
    const label = selected === 'Lainnya' ? (otherText.trim() || 'Lainnya') : selected;
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    item!.issues.push({
      id: `issue-${Date.now()}`,
      label,
      resolved: false,
      filedAt: timeStr,
    });
    item!.updatedAt = now;
    item!.lastEventLabel = `🚩 ${label}`;
    item!.lastEventTime = timeStr;
    setSubmitted(true);
    setTimeout(() => {
      closeBottomSheet();
      onDismiss();
    }, 1200);
  }

  if (submitted) {
    return (
      <BottomSheet isOpen={true} onDismiss={onDismiss}>
        <div className="flex flex-col items-center py-8 gap-3">
          <span className="text-4xl">🚩</span>
          <p className="text-[15px] font-semibold text-[#1A1A2E]">Masalah dilaporkan</p>
          <p className="text-[13px] text-[#6B7280]">Supervisor akan segera ditindaklanjuti</p>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet isOpen={true} onDismiss={onDismiss}>
      <h2 className="text-[17px] font-bold text-[#1A1A2E] mb-1">Laporkan Masalah</h2>
      <p className="text-[13px] text-[#6B7280] mb-5">{item.name}</p>

      <div className="flex flex-col gap-2 mb-4">
        {ISSUE_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setSelected(p)}
            className="w-full text-left px-4 py-3 rounded-xl text-[14px] border"
            style={{
              background: selected === p ? '#FFF8ED' : 'white',
              borderColor: selected === p ? '#DE8F26' : '#E5E7EB',
              color: selected === p ? '#DE8F26' : '#1A1A2E',
              fontWeight: selected === p ? 600 : 400,
            }}
          >
            {p}
          </button>
        ))}
        {selected === 'Lainnya' && (
          <input
            type="text"
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-[14px] outline-none"
            placeholder="Tulis masalah..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
          />
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected || (selected === 'Lainnya' && !otherText.trim())}
        className="w-full rounded-xl text-[14px] font-semibold"
        style={{
          minHeight: 52,
          background: selected && !(selected === 'Lainnya' && !otherText.trim()) ? '#DE8F26' : '#E5E7EB',
          color: selected && !(selected === 'Lainnya' && !otherText.trim()) ? 'white' : '#9CA3AF',
        }}
      >
        🚩 Laporkan
      </button>
    </BottomSheet>
  );
}
