'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  Pencil, ShoppingCart, Settings, Flame, ShieldCheck,
  Truck, LayoutDashboard, Briefcase, Landmark,
  Phone, Mail, MessageCircle, X,
  type LucideIcon,
} from 'lucide-react';
import { mockUsers } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';
import { OriginDrawer } from '@/components/ui/OriginDrawer';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

const DEPT_CARDS: { name: string; icon: LucideIcon }[] = [
  { name: 'Drafting',   icon: Pencil },
  { name: 'Purchasing', icon: ShoppingCart },
  { name: 'Machining',  icon: Settings },
  { name: 'Fabrikasi',  icon: Flame },
  { name: 'QC',         icon: ShieldCheck },
  { name: 'Delivery',   icon: Truck },
  { name: 'Admin & Manager', icon: LayoutDashboard },
  { name: 'Sales',      icon: Briefcase },
  { name: 'Finance',    icon: Landmark },
];

// ─── ForgotPinSheet ───────────────────────────────────────────────────────
function ForgotPinSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
          <span className="text-lg font-semibold text-[#1A1A2E]">Lupa PIN</span>
          <button type="button" onClick={onClose} className="flex items-center justify-center min-w-[48px] min-h-[48px] text-[#6B7280]" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-4">
          <p className="text-sm font-semibold text-[#1A1A2E]">PIN Terlupakan?</p>
          <a href="tel:+62271000000" className="flex items-center gap-3 min-h-[48px]">
            <Phone size={20} className="text-[#2A7B76] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#1A1A2E]">+62 271 000 000</span>
              <span className="text-xs text-[#6B7280]">Jam kerja 08:00–17:00</span>
            </div>
          </a>
          <a href="mailto:admin@pogrid.local" className="flex items-center gap-3 min-h-[48px]">
            <Mail size={20} className="text-[#2A7B76] flex-shrink-0" />
            <span className="text-sm font-medium text-[#1A1A2E]">admin@pogrid.local</span>
          </a>
          <a href="https://wa.me/6227100000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-h-[48px]">
            <MessageCircle size={20} className="text-[#2A7B76] flex-shrink-0" />
            <span className="text-sm font-medium text-[#1A1A2E]">WhatsApp Admin</span>
          </a>
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Admin dapat reset PIN Anda. Siapkan identitas karyawan. Estimasi 5 menit.
          </p>
        </div>
        <div className="px-4 pb-6 pt-2 flex-shrink-0">
          <button type="button" onClick={onClose} className="w-full min-h-[48px] rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#6B7280]">Tutup</button>
        </div>
      </div>
    </>
  );
}

// ─── UserPanelContent ────────────────────────────────────────────────────
function UserPanelContent({ deptName, icon: Icon, onClose }: {
  deptName: string;
  icon: LucideIcon;
  onClose: () => void;
}) {
  // "Admin & Manager" card menampilkan user dari dept Admin ATAU Manager
  const users = mockUsers.filter((u) =>
    deptName === 'Admin & Manager'
      ? u.department === 'Admin' || u.department === 'Manager'
      : u.department === deptName
  );

  function handleUserTap(user: (typeof mockUsers)[number]) {
    onClose();
    useUIStore.getState().setSession({
      userId: user.id,
      name: user.name,
      department: user.department,
      role: user.role,
      isLoggedIn: false,
    });
    setTimeout(() => { window.location.href = '/login'; }, 80);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center justify-center gap-2 p-3 border-b border-[#E5E7EB] bg-white">
        <Icon size={28} className="text-[#2A7B76]" />
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-semibold text-[#1A1A2E]">{deptName}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 text-[#9CA3AF] hover:text-[#6B7280] flex items-center"
            aria-label="Tutup"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-xs text-[#6B7280] text-center py-4">Tidak ada pengguna.</p>
        ) : users.map((user, idx) => (
          <button
            key={user.id}
            type="button"
            onClick={() => handleUserTap(user)}
            className={[
              'w-full flex items-center gap-2 px-3 py-2.5 min-h-[48px]',
              'hover:bg-[#F0FAF9] text-left transition-colors duration-100',
              idx < users.length - 1 ? 'border-b border-[#F3F4F6]' : '',
            ].join(' ')}
          >
            <div className="w-7 h-7 rounded-full bg-[#2A7B76] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold select-none">{getInitials(user.name)}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-[#1A1A2E] leading-tight">{user.name}</span>
              <span className="text-[11px] text-[#6B7280] capitalize">{user.role} · {user.department}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function SelectDeptPage() {
  const [drawer, setDrawer] = useState<{
    open: boolean;
    dept: string | null;
    icon: LucideIcon | null;
    rect: DOMRect | null;
  }>({ open: false, dept: null, icon: null, rect: null });

  const [forgotPinOpen, setForgotPinOpen] = useState(false);

  const closeDrawer = () => setDrawer({ open: false, dept: null, icon: null, rect: null });

  useEffect(() => {
    const hide = () => setDrawer({ open: false, dept: null, icon: null, rect: null });
    window.addEventListener('pagehide', hide);
    window.addEventListener('popstate', hide);
    const onVis = () => { if (document.visibilityState === 'hidden') hide(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('popstate', hide);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  function handleCardTap(name: string, icon: LucideIcon, rect: DOMRect) {
    if (drawer.open && drawer.dept === name) { closeDrawer(); return; }
    setDrawer({ open: false, dept: null, icon: null, rect: null });
    requestAnimationFrame(() => setDrawer({ open: true, dept: name, icon, rect }));
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-8">

      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#2A7B76] flex items-center justify-center">
          <span className="text-white text-2xl font-bold select-none">PG</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] text-center mt-4">Pilih Departemen</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {DEPT_CARDS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              handleCardTap(name, Icon, rect);
            }}
            className={[
              'bg-white rounded-xl border shadow-sm p-3',
              'flex flex-col items-center justify-center gap-2',
              'min-h-[80px] cursor-pointer select-none transition-all duration-150',
              drawer.dept === name
                ? 'scale-[1.04] shadow-md border-[#2A7B76]'
                : 'border-[#E5E7EB] hover:scale-[1.02]',
            ].join(' ')}
          >
            <Icon size={32} className="text-[#2A7B76]" />
            <span className="text-[14px] font-medium text-[#1A1A2E] leading-tight text-center">{name}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button type="button" onClick={() => setForgotPinOpen(true)}
          className="text-[13px] text-[#2A7B76] underline min-h-[48px] px-2">
          Lupa PIN? Hubungi Admin
        </button>
      </div>

      <OriginDrawer
        open={drawer.open}
        triggerRect={drawer.rect}
        onClose={closeDrawer}
        maxHeight="60vh"
      >
        {drawer.dept && drawer.icon && (
          <UserPanelContent
            deptName={drawer.dept}
            icon={drawer.icon}
            onClose={closeDrawer}
          />
        )}
      </OriginDrawer>

      {forgotPinOpen && <ForgotPinSheet onClose={() => setForgotPinOpen(false)} />}
    </div>
  );
}
