'use client';

import React, { useEffect, useRef } from 'react';
import useUIStore from '@/store/uiStore';

interface BatalkanControlProps {
  itemId: string;
  /** State 1 trigger: localProgress !== savedProgress. Evaluated on every slider/stepper change. */
  hasUnsaved: boolean;
  onUndo: () => void;
  onStartTimer: (startTimer: (previousValue: number) => void) => void;
}

// BatalkanControl — 3-state machine
//
// STATE 1 — Unsaved local change
//   Condition : hasUnsaved === true  &&  no active post-save timer
//   UI        : Batalkan button, full opacity, interactive
//   On tap    : onUndo() — resets localProgress to savedProgress, no API call
//
// STATE 2 — Idle / at saved position
//   Condition : hasUnsaved === false  &&  no active post-save timer
//   UI        : Batalkan button, opacity-40, pointer-events-none
//
// STATE 3 — Post-save 5-second undo window
//   Condition : Simpan was just tapped, timer running in Zustand pendingProgress
//   UI        : Inline toast “Progress disimpan ✓ — Batalkan?”
//   On tap    : Revert Zustand mock progress, clear timeout
//   On 5s     : clearPendingProgress, toast disappears, change permanent

export default function BatalkanControl({
  itemId,
  hasUnsaved,
  onUndo,
  onStartTimer,
}: BatalkanControlProps) {
  const pending = useUIStore((s) => s.pendingProgress[itemId]);
  const clearPendingProgress = useUIStore((s) => s.clearPendingProgress);
  const setPendingProgress   = useUIStore((s) => s.setPendingProgress);

  // setTimeout ref — lives in useRef, NEVER in state or Zustand
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject startTimer fn into parent so parent triggers STATE 3 after Simpan
  useEffect(() => {
    onStartTimer((previousValue: number) => {
      // Clear any existing timer before starting a new one
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

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

  // STATE 3: post-save toast (timer is running in Zustand)
  const isPostSave = !!pending && pending.timeoutRef !== null;
  if (isPostSave) {
    return (
      <button
        type="button"
        onClick={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          onUndo();
          clearPendingProgress(itemId);
        }}
        className="flex items-center rounded-lg px-4 h-10 text-sm font-medium bg-[#D1FAE5] text-[#065F46] active:bg-[#A7F3D0] transition-colors"
      >
        Progress disimpan ✓ — Batalkan?
      </button>
    );
  }

  // STATE 1: unsaved local change — Batalkan fully active
  if (hasUnsaved) {
    return (
      <button
        type="button"
        onClick={() => {
          onUndo();
          clearPendingProgress(itemId);
        }}
        className="rounded-lg px-4 h-10 text-sm font-semibold bg-[#F3F4F6] text-[#374151] active:bg-[#E5E7EB] transition-colors"
      >
        Batalkan
      </button>
    );
  }

  // STATE 2: idle / at saved position
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="rounded-lg px-4 h-10 text-sm font-medium bg-[#F3F4F6] text-[#374151] opacity-40 pointer-events-none"
    >
      Batalkan
    </button>
  );
}
