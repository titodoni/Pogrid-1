'use client';

import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

const MOCK_NOTIFS = [
  { id: 'n1', text: 'Bushing Set M12 — masalah dilaporkan', time: '11:00', read: false },
  { id: 'n2', text: 'Plat Cover 3mm — item stalled 24j+', time: '09:15', read: false },
  { id: 'n3', text: 'PO-2026-002 — sudah lewat due date', time: 'Kemarin', read: true },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = MOCK_NOTIFS.filter(n => !n.read).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center min-w-[48px] min-h-[48px]"
        aria-label="Notifikasi"
      >
        <Bell size={22} color="#6B7280" />
        {unread > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#B33941] flex items-center justify-center">
            <span className="text-white text-[9px] font-bold leading-none">{unread}</span>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
              <span className="text-base font-semibold text-[#1A1A2E]">Notifikasi</span>
              <button type="button" onClick={() => setOpen(false)} className="flex items-center justify-center min-w-[48px] min-h-[48px] text-[#6B7280]" aria-label="Tutup">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#F3F4F6]">
              {MOCK_NOTIFS.map(n => (
                <div key={n.id} className={`px-4 py-3 flex gap-3 items-start ${n.read ? '' : 'bg-[#F0FAF9]'}` }>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#2A7B76] mt-1.5 flex-shrink-0" />}
                  {n.read && <div className="w-2 h-2 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm text-[#1A1A2E] leading-snug">{n.text}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-6 pt-2 flex-shrink-0">
              <button type="button" onClick={() => setOpen(false)} className="w-full min-h-[48px] rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#6B7280]">Tutup</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
