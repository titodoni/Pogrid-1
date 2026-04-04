'use client';

import React, { useEffect, useRef } from 'react';
import useUIStore from '@/store/uiStore';

interface BatalkanControlProps {
  itemId: string;
  onUndo: () => void; // called when undo is triggered (revert localProgress)
  onStartTimer: (startTimer: (previousValue: number) => void) => void; // ref injection
}

// BatalkanControl — 3-state machine
// STATE 1: pendingProgress[itemId] exists && timeoutRef === null  → Batalkan (active)
// STATE 2: pendingProgress[itemId] does NOT exist                 → Batalkan (disabled)
// STATE 3: pendingProgress[itemId] exists && timeoutRef !== null  → Toast post-save
//
// Phase 5 note: Pusher item-updated fires ONLY after 5s window closes — never immediately.

export default function BatalkanControl({ itemId, onUndo, onStartTimer }: BatalkanControlProps) {
  const pending = useUIStore((s) => s.pendingProgress[itemId]);
  const clearPendingProgress = useUIStore((s) => s.clearPendingProgress);
  const setPendingProgress = useUIStore((s) => s.setPendingProgress);

  // setTimeout ref lives in useRef — NEVER in useState or uiStore
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject startTimer function to parent so parent can trigger STATE 3
  useEffect(() => {
    onStartTimer((previousValue: number) => {
      timeoutRef.current = setTimeout(() => {
        clearPendingProgress(itemId);
        timeoutRef.current = null;
      }, 5000);
      setPendingProgress(itemId, previousValue, timeoutRef.current);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hasEntry = !!pending;
  const hasTimeout = hasEntry && pending.timeoutRef !== null;

  // STATE 3 — post-save toast
  if (hasEntry && hasTimeout) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          onUndo();
          clearPendingProgress(itemId);
        }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
        className="flex items-center rounded-lg px-4 h-10 text-sm font-medium cursor-pointer bg-[#D1FAE5] text-[#065F46]"
      >
        Progress disimpan ✓ — Batalkan?
      </div>
    );
  }

  // STATE 1 — Batalkan active (unsaved change, no timer running)
  if (hasEntry && !hasTimeout) {
    return (
      <button
        type="button"
        onClick={() => {
          onUndo();
          clearPendingProgress(itemId);
        }}
        className="rounded-lg px-4 h-10 text-sm font-medium bg-[#F3F4F6] text-[#374151]"
      >
        Batalkan
      </button>
    );
  }

  // STATE 2 — idle/saved (default)
  return (
    <button
      type="button"
      disabled
      className="rounded-lg px-4 h-10 text-sm font-medium bg-[#F3F4F6] text-[#374151] opacity-40 pointer-events-none"
    >
      Batalkan
    </button>
  );
}
