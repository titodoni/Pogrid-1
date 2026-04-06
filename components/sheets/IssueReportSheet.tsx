'use client';

import React, { useEffect, useState } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { mockItems } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

const FILE_REASONS = [
  'Material tidak sesuai',
  'Mesin bermasalah',
  'Menunggu komponen',
  'Gambar tidak jelas',
  'Lainnya',
];

export default function IssueReportSheet({
  itemId,
  onDismiss,
}: {
  itemId: string | null;
  onDismiss: () => void;
}) {
  const session = useUIStore((s) => s.session);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  const item = itemId ? mockItems.find((i) => i.id === itemId) ?? null : null;

  // FILE MODE local state
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');
  // force re-render after resolve so mode switches inline
  const [, forceUpdate] = useState(0);
  // inline FILE MODE when triggered from MANAGE MODE
  const [forceFileMode, setForceFileMode] = useState(false);

  useEffect(() => {
    if (!item) onDismiss();
  }, [item, onDismiss]);

  if (!item) return null;

  const currentUserId = session?.userId ?? '';
  const openIssues = item.issues.filter((i) => !i.resolved);
  const myOpenIssues = openIssues.filter((i) => i.filedById === currentUserId);
  const isManageMode = myOpenIssues.length > 0 && !forceFileMode;

  const isFileValid =
    selectedReason !== null &&
    (selectedReason !== 'Lainnya' || otherText.trim().length > 0);

  // ── FILE MODE action ────────────────────────────────────────
  function executeFileIssue() {
    if (!isFileValid) return;
    const reason = selectedReason === 'Lainnya' ? otherText.trim() : selectedReason!;
    item!.issues.push({
      id: 'iss-' + Date.now(),
      reason,
      resolved: false,
      filedById: currentUserId,
    });
    item!.updatedAt = new Date().toISOString();
    closeBottomSheet();
  }

  // ── MANAGE MODE action ──────────────────────────────────────
  function executeResolveIssue(issueId: string) {
    const target = item!.issues.find((i) => i.id === issueId);
    if (target) target.resolved = true;
    item!.updatedAt = new Date().toISOString();
    // Re-evaluate: if myOpenIssues now empty, switch to FILE MODE inline
    const stillOpen = item!.issues.filter(
      (i) => !i.resolved && i.filedById === currentUserId
    );
    if (stillOpen.length === 0) setForceFileMode(true);
    else forceUpdate((n) => n + 1);
  }

  // ──────────────────────────────────────────────────────
  //  MANAGE MODE UI
  // ──────────────────────────────────────────────────────
  if (isManageMode) {
    return (
      <BottomSheet isOpen={true} onDismiss={onDismiss}>
        <p className="text-[18px] font-semibold text-[#1A1A2E]">🚩 Masalah Aktif</p>
        <p className="text-[14px] text-[#6B7280] mt-0.5">{item.name}</p>

        <div className="mt-4">
          {myOpenIssues.map((issue) => (
            <div key={issue.id} className="mb-3">
              <div className="bg-[#FEF2F2] border border-[#B33941] rounded-xl p-3">
                <p className="text-[13px] text-[#B33941]">{issue.reason}</p>
                <p className="text-[12px] text-[#6B7280] mt-1">Dilaporkan oleh Anda</p>
              </div>
              <button
                type="button"
                onClick={() => executeResolveIssue(issue.id)}
                className="mt-2 bg-[#F3F4F6] text-[#374151] rounded-lg px-4 h-9 text-sm font-medium"
              >
                Batalkan Issue
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setForceFileMode(true);
            setSelectedReason(null);
            setOtherText('');
          }}
          className="text-[#B33941] text-sm font-medium mt-4"
        >
          + Laporkan Masalah Baru
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full bg-[#F3F4F6] text-[#374151] rounded-xl h-12 text-sm font-medium mt-4"
        >
          Tutup
        </button>
      </BottomSheet>
    );
  }

  // ──────────────────────────────────────────────────────
  //  FILE MODE UI
  // ──────────────────────────────────────────────────────
  return (
    <BottomSheet isOpen={true} onDismiss={onDismiss}>
      <p className="text-[18px] font-semibold text-[#1A1A2E]">🚩 Laporkan Masalah</p>
      <p className="text-[14px] text-[#6B7280] mt-0.5">{item.name}</p>

      <p className="text-[13px] text-[#6B7280] mt-4 mb-2">Pilih alasan:</p>

      <div className="flex flex-col">
        {FILE_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSelectedReason(r)}
            className="h-12 flex items-center gap-3 border-b border-[#F3F4F6] cursor-pointer w-full text-left"
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

      {/* Lainnya free-text — sole keyboard exception */}
      {selectedReason === 'Lainnya' && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder="Tulis alasan..."
          className="mt-3 w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-3 h-10 text-sm outline-none"
        />
      )}

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
          onClick={executeFileIssue}
          className="flex-1 rounded-xl h-12 text-sm font-medium text-white transition-opacity"
          style={{
            background: '#B33941',
            opacity: isFileValid ? 1 : 0.4,
            pointerEvents: isFileValid ? 'auto' : 'none',
          }}
        >
          Laporkan
        </button>
      </div>
    </BottomSheet>
  );
}
