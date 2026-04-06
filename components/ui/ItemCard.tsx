'use client';

import React, { useState, useRef } from 'react';
import { type MockItem } from '@/lib/mockData';
import StageBadge from './StageBadge';
import { VendorPill, RoutingPill, ReworkPill, ReturnPill } from './PillBadges';
import ProgressSlider from './ProgressSlider';
import StepperControl from './StepperControl';
import BatalkanControl from './BatalkanControl';
import useUIStore from '@/store/uiStore';

interface ItemCardProps {
  item: MockItem;
  isWorkerView: boolean;
  isOwnerStage: boolean;
  currentUserId: string;
  onProgressChange: (itemId: string, newProgress: number) => void;
  onSaveProgress: (itemId: string, newProgress: number, previousProgress: number) => void;
  onOpenIssueSheet: (itemId: string) => void;
  onOpenGateSheet: (itemId: string) => void;
}

export default function ItemCard({
  item,
  isWorkerView,
  isOwnerStage,
  onSaveProgress,
  onOpenIssueSheet,
  onOpenGateSheet,
}: ItemCardProps) {
  const [localProgress, setLocalProgress] = useState(item.progress);
  const startTimerRef = useRef<((prev: number) => void) | null>(null);
  const openBottomSheet = useUIStore((s) => s.openBottomSheet);

  const isInteractive = isWorkerView && isOwnerStage && !item.allNG;
  const hasUnsaved = localProgress !== item.progress;

  function handleSave() {
    const previous = item.progress;
    const isComplete =
      (item.qty === 1 && localProgress === 100) ||
      (item.qty > 1 && localProgress === item.qty);

    if (startTimerRef.current) startTimerRef.current(previous);
    onSaveProgress(item.id, localProgress, previous);

    if (isComplete) {
      onOpenGateSheet(item.id);
    }
  }

  function handleUndo() {
    setLocalProgress(item.progress);
  }

  const dueDateStr = new Date(item.po.deliveryDate).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-3 transition-all duration-250">
      {/* Row 1 — Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#6B7280] font-normal">{item.po.number}</span>
        <StageBadge item={item} />
      </div>

      {/* Row 2 — Item name */}
      <p className="text-lg font-semibold text-[#1A1A2E] mt-1">{item.name}</p>

      {/* Row 3 — Client name */}
      <p className="text-[13px] text-[#6B7280] mt-0.5">{item.po.clientName} · Due {dueDateStr}</p>

      {/* Row 4 — Pills */}
      <div className="flex gap-1 flex-wrap mt-2">
        <ReworkPill parentItemId={item.parentItemId} parentName={item.parent?.name} />
        <ReturnPill source={item.source} returnBreadcrumb={item.returnBreadcrumb} />
        <VendorPill vendorJob={item.vendorJob} />
        <RoutingPill productionType={item.productionType} />
      </div>

      <hr className="border-[#E5E7EB] my-3" />

      {/* Row 5 — Progress Control */}
      {item.allNG ? (
        <p className="text-[13px] text-[#B33941] font-medium">Semua unit gagal QC</p>
      ) : isInteractive ? (
        item.qty === 1
          ? <ProgressSlider value={localProgress} onChange={setLocalProgress} />
          : <StepperControl current={localProgress} max={item.qty} onChange={setLocalProgress} />
      ) : (
        item.qty === 1 ? (
          <div className="flex items-center gap-3 opacity-70">
            <div className="flex-1 h-2 rounded-full bg-[#E5E7EB]">
              <div
                className="h-2 rounded-full bg-[#2A7B76]"
                style={{ width: `${localProgress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-[#1A1A2E]" style={{ minWidth: 40 }}>{localProgress}%</span>
          </div>
        ) : (
          <p className="text-base font-medium text-[#1A1A2E] text-center opacity-70">
            {localProgress} / {item.qty} units
          </p>
        )
      )}

      {/* Row 6 — Action footer (interactive only) */}
      {isInteractive && (
        <>
          <hr className="border-[#E5E7EB] my-3" />
          <div className="flex justify-between items-center">
            <BatalkanControl
              itemId={item.id}
              hasUnsaved={hasUnsaved}
              onUndo={handleUndo}
              onStartTimer={(fn) => { startTimerRef.current = fn; }}
            />
            <div className="flex items-center gap-2">
              {/* Return button — DELIVERY stage only */}
              {item.stage === 'DELIVERY' && (
                <button
                  type="button"
                  onClick={() => openBottomSheet('return', item.id)}
                  className="text-[#B33941] text-sm font-medium px-2"
                >
                  🔄 Return
                </button>
              )}
              {hasUnsaved && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg px-4 h-10 text-sm font-medium bg-[#2A7B76] text-white"
                >
                  Simpan
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenIssueSheet(item.id)}
                className="text-[#B33941] text-sm font-medium px-2"
              >
                🚩 Laporkan
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
