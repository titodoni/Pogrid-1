'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import useUIStore from '@/store/uiStore';

export default function NotificationBell() {
  const count = useUIStore((s) => s.notificationCount);

  return (
    <div className="relative w-6 h-6">
      <Bell size={24} color="#1A1A2E" />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B33941] text-white flex items-center justify-center font-bold"
          style={{ fontSize: 10 }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
}
