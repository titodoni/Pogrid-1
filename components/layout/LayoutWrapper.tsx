'use client';

import React from 'react';
import { StickyHeader } from './StickyHeader';
import { BottomNav } from './BottomNav';

interface LayoutWrapperProps {
  children: React.ReactNode;
  role: string;
  department: string;
  headerTitle: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function LayoutWrapper({
  children,
  role,
  department,
  headerTitle,
  headerLeft,
  headerRight,
}: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <StickyHeader
        title={headerTitle}
        leftSlot={headerLeft}
        rightSlot={headerRight}
      />
      {/* pt-14: clears StickyHeader (56px) | pb-24: clears BottomNav (64px) + safe area */}
      <main className="pt-14 pb-24 px-4">
        {children}
      </main>
      <BottomNav role={role} department={department} />
    </div>
  );
}
