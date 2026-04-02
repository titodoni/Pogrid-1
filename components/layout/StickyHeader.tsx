'use client';

import React from 'react';

interface StickyHeaderProps {
  title: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function StickyHeader({ title, leftSlot, rightSlot }: StickyHeaderProps) {
  return (
    // CRITICAL: sticky top-0 — never top-14, top-16, or fixed (UIUX.md Hard Rule #8)
    <header className="sticky top-0 z-40 h-14 bg-white border-b border-[#E5E7EB]">
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left slot — ProfileAvatar or back button */}
        <div className="w-10">
          {leftSlot ?? null}
        </div>

        {/* Center title */}
        <h1 className="text-base font-semibold text-[#1A1A2E]">
          {title}
        </h1>

        {/* Right slot — notification bell, actions */}
        <div className="w-10 flex justify-end">
          {rightSlot ?? null}
        </div>
      </div>
    </header>
  );
}
