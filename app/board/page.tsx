'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import { mockItems } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';
import StickyHeader from '@/components/layout/StickyHeader';
import BottomNav from '@/components/layout/BottomNav';
import ProfileAvatar from '@/components/layout/ProfileAvatar';
import NotificationBell from '@/components/ui/NotificationBell';
import FilterChip from '@/components/ui/FilterChip';
import ItemCard from '@/components/ui/ItemCard';

const FILTER_CHIPS = ['Semua', 'URGENT', 'MASALAH', 'DRAFTING', 'PURCHASING', 'MACHINING', 'FABRIKASI', 'QC', 'DELIVERY'];

export default function BoardPage() {
  const session = useUIStore((s) => s.session);
  const boardFilters = useUIStore((s) => s.boardFilters);
  const toggleBoardFilter = useUIStore((s) => s.toggleBoardFilter);
  const setBoardFilters = useUIStore((s) => s.setBoardFilters);

  useEffect(() => {
    if (!session) { window.location.href = '/select-dept'; }
  }, [session]);

  if (!session) return null;

  const role = session.role;
  const dept = session.department;
  const isManagement = role === 'admin' || role === 'manager';

  // Filtering pipeline
  let items = mockItems.filter((item) => !item.allNG);

  if (boardFilters.length > 0) {
    items = items.filter((item) => {
      return boardFilters.every((f) => {
        if (f === 'URGENT') return item.urgent;
        if (f === 'MASALAH') return item.issues.some((i) => !i.resolved);
        // Stage filter
        return item.stage === f;
      });
    });
  }

  // Sort: urgent first → createdAt DESC
  items = [...items].sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return new Date(b.po.deliveryDate).getTime() - new Date(a.po.deliveryDate).getTime();
  });

  // Stalled detection (mock: createdAt > 24h ago)
  const nowMs = Date.now();
  const stalledIds = new Set(
    mockItems
      .filter((i) => nowMs - new Date(i.createdAt).getTime() > 24 * 60 * 60 * 1000)
      .map((i) => i.id)
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#F8F9FA]">
        <StickyHeader
          left={<ProfileAvatar />}
          center={<span className="text-xl font-bold text-[#1A1A2E]">Board</span>}
          right={<NotificationBell />}
        />

        {/* Filter chips */}
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTER_CHIPS.map((chip) => {
              const isAll = chip === 'Semua';
              const active = isAll ? boardFilters.length === 0 : boardFilters.includes(chip);
              return (
                <FilterChip
                  key={chip}
                  label={chip}
                  active={active}
                  onClick={() => {
                    if (isAll) setBoardFilters([]);
                    else toggleBoardFilter(chip);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-2 pb-24">
        {items.length === 0 ? (
          <p className="text-sm text-[#6B7280] text-center pt-16">Tidak ada item untuk filter ini</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="relative">
              <ItemCard
                item={item}
                isWorkerView={role === 'worker'}
                isOwnerStage={item.stage === dept}
                currentUserId={session.userId}
                onProgressChange={() => {}}
                onSaveProgress={() => {}}
                onOpenIssueSheet={() => {}}
                onOpenGateSheet={() => {}}
              />
              {/* Stalled badge — management only */}
              {isManagement && stalledIds.has(item.id) && (
                <span
                  className="absolute top-4 right-4 rounded-full px-2 py-0.5 text-xs bg-[#F3F4F6] text-[#9CA3AF]"
                  style={{ marginTop: 24 }}
                >
                  24j+
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
