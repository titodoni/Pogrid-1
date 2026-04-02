'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import {
  Pencil,
  ShoppingCart,
  Settings,
  Flame,
  ShieldCheck,
  Truck,
  Cog,
  BarChart2,
  Briefcase,
  Phone,
  Mail,
  MessageCircle,
  X,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { mockUsers } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

// ─── Dept config (9 cards per Amendment #13) ─────────────────────────────────

const DEPT_CARDS: { name: string; icon: LucideIcon }[] = [
  { name: 'Drafting',   icon: Pencil },
  { name: 'Purchasing', icon: ShoppingCart },
  { name: 'Machining',  icon: Settings },
  { name: 'Fabrikasi',  icon: Flame },
  { name: 'QC',         icon: ShieldCheck },
  { name: 'Delivery',   icon: Truck },
  { name: 'Admin',      icon: Cog },
  { name: 'Manager',    icon: BarChart2 },
  { name: 'Sales',      icon: Briefcase },
];

// ─── Subcomponents ─────────────────────────────────────────────────────────

function Overlay({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-40"
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

function UserDrawer({
  deptName,
  onClose,
}: {
  deptName: string;
  onClose: () => void;
}) {
  const users = mockUsers.filter((u) => u.department === deptName);

  function handleUserTap(user: (typeof mockUsers)[number]) {
    useUIStore.getState().setSession({
      userId: user.id,
      name: user.name,
      department: user.department,
      role: user.role,
      isLoggedIn: true,
    });
    window.location.href = '/login';
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center min-w-[48px] min-h-[48px] text-[#6B7280]"
          aria-label="Kembali"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-[#1A1A2E]">
          Pilih Pengguna — {deptName}
        </span>
      </div>

      {/* User list */}
      <div className="overflow-y-auto flex-1">
        {users.length === 0 ? (
          <p className="text-sm text-[#6B7280] text-center py-8">
            Tidak ada pengguna di departemen ini.
          </p>
        ) : (
          users.map((user, idx) => {
            const isLast = idx === users.length - 1;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserTap(user)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 min-h-[56px]',
                  'hover:bg-[#F8F9FA] text-left transition-colors duration-100',
                  !isLast ? 'border-b border-[#E5E7EB]' : '',
                ].join(' ')}
              >
                <div className="w-8 h-8 rounded-full bg-[#2A7B76] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold select-none">
                    {getInitials(user.name)}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base font-semibold text-[#1A1A2E] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[13px] text-[#6B7280] capitalize">
                    {user.role}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ForgotPinSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
        <span className="text-lg font-semibold text-[#1A1A2E]">Lupa PIN</span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center min-w-[48px] min-h-[48px] text-[#6B7280]"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-4">
        <p className="text-sm font-semibold text-[#1A1A2E]">PIN Terlupakan?</p>

        {/* Phone */}
        <a
          href="tel:+62271000000"
          className="flex items-center gap-3 min-h-[48px]"
        >
          <Phone size={20} className="text-[#2A7B76] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#1A1A2E]">+62 271 000 000</span>
            <span className="text-xs text-[#6B7280]">Jam kerja 08:00–17:00</span>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:admin@pogrid.local"
          className="flex items-center gap-3 min-h-[48px]"
        >
          <Mail size={20} className="text-[#2A7B76] flex-shrink-0" />
          <span className="text-sm font-medium text-[#1A1A2E]">admin@pogrid.local</span>
        </a>

        {/* WhatsApp */}
        <a
          href="https://wa.me/6227100000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 min-h-[48px]"
        >
          <MessageCircle size={20} className="text-[#2A7B76] flex-shrink-0" />
          <span className="text-sm font-medium text-[#1A1A2E]">WhatsApp Admin</span>
        </a>

        {/* Note */}
        <p className="text-[13px] text-[#6B7280] leading-relaxed">
          Admin dapat reset PIN Anda. Siapkan identitas karyawan. Estimasi 5 menit.
        </p>
      </div>

      {/* Close button */}
      <div className="px-4 pb-6 pt-2 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[48px] rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#6B7280]"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SelectDeptPage() {
  const selectedDept  = useUIStore((s) => s.selectedDept);
  const drawerOpen    = useUIStore((s) => s.drawerOpen);
  const forgotPinOpen = useUIStore((s) => s.forgotPinOpen);
  const { setSelectedDept, setDrawerOpen, setForgotPinOpen } = useUIStore.getState();

  function handleCardTap(deptName: string) {
    setSelectedDept(deptName);
    setDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setSelectedDept(null);
  }

  const anySheetOpen = drawerOpen || forgotPinOpen;

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-8 relative">

      {/* ── Logo ── */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#2A7B76] flex items-center justify-center">
          <span className="text-white text-2xl font-bold select-none">PG</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] text-center mt-4">
          Pilih Departemen
        </h1>
      </div>

      {/* ── 3×3 Department Card Grid ── */}
      <div className="grid grid-cols-3 gap-3">
        {DEPT_CARDS.map(({ name, icon: Icon }) => {
          const isSelected = selectedDept === name && drawerOpen;
          return (
            <button
              key={name}
              type="button"
              onClick={() => handleCardTap(name)}
              className={[
                'bg-white rounded-xl border border-[#E5E7EB] shadow-sm',
                'p-3 flex flex-col items-center justify-center gap-2',
                'min-h-[80px] min-w-[56px] cursor-pointer',
                'transition-transform duration-150',
                isSelected ? 'scale-[1.02] shadow-md' : 'hover:scale-[1.02]',
              ].join(' ')}
            >
              <Icon size={32} className="text-[#2A7B76]" />
              <span className="text-[14px] font-medium text-[#1A1A2E] leading-tight text-center">
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Lupa PIN link ── */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => setForgotPinOpen(true)}
          className="text-[13px] text-[#2A7B76] underline min-h-[48px] px-2"
        >
          Lupa PIN? Hubungi Admin
        </button>
      </div>

      {/* ── Overlays & Bottom Sheets ── */}
      {anySheetOpen && (
        <Overlay
          onClick={() => {
            setDrawerOpen(false);
            setForgotPinOpen(false);
            setSelectedDept(null);
          }}
        />
      )}

      {drawerOpen && selectedDept && (
        <UserDrawer deptName={selectedDept} onClose={handleCloseDrawer} />
      )}

      {forgotPinOpen && (
        <ForgotPinSheet onClose={() => setForgotPinOpen(false)} />
      )}
    </div>
  );
}
