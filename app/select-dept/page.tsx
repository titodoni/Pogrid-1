'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { mockUsers, mockDepartments } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

// Ordered dept names: floor first, then management
const DEPT_ORDER = [
  'Drafting',
  'Purchasing',
  'Machining',
  'Fabrikasi',
  'QC',
  'Delivery',
  'Admin',
  'Manager',
  'Sales',
  'Finance',
];

export default function SelectDeptPage() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const sortedDepts = [...mockDepartments].sort(
    (a, b) => DEPT_ORDER.indexOf(a.name) - DEPT_ORDER.indexOf(b.name),
  );

  const usersInDept = selectedDept
    ? mockUsers.filter((u) => u.department === selectedDept)
    : [];

  function handleDeptTap(deptName: string) {
    setSelectedDept((prev) => (prev === deptName ? null : deptName));
  }

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
    <div className="min-h-screen bg-[#F8F9FA] px-4 py-8">
      {/* ── Logo + Heading ── */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center">
          <span className="text-white text-2xl font-bold select-none">PG</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] text-center mt-4">
          Pilih Departemen
        </h1>
      </div>

      {/* ── Department Grid ── */}
      <div className="grid grid-cols-3 gap-3">
        {sortedDepts.map((dept) => {
          const isSelected = selectedDept === dept.name;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => handleDeptTap(dept.name)}
              className={[
                'rounded-xl border shadow-sm p-3',
                'flex flex-col items-center justify-center',
                'min-h-[72px] text-sm font-medium cursor-pointer',
                'transition-colors duration-150',
                isSelected
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:border-brand',
              ].join(' ')}
            >
              {dept.name}
            </button>
          );
        })}
      </div>

      {/* ── User List (shown when a dept is selected) ── */}
      {selectedDept && usersInDept.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="text-sm font-semibold text-[#6B7280] px-4 py-2 border-b border-[#E5E7EB]">
            {selectedDept}
          </div>
          {usersInDept.map((user, idx) => {
            const isLast = idx === usersInDept.length - 1;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserTap(user)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3',
                  'hover:bg-[#F8F9FA] min-h-[56px] text-left',
                  !isLast ? 'border-b border-[#E5E7EB]' : '',
                ].join(' ')}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold select-none">
                    {getInitials(user.name)}
                  </span>
                </div>

                {/* Name + Role */}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-[#1A1A2E]">{user.name}</span>
                  <span className="text-xs text-[#6B7280] capitalize">{user.role}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty dept state */}
      {selectedDept && usersInDept.length === 0 && (
        <div className="mt-4 bg-white rounded-xl border border-[#E5E7EB] px-4 py-6 text-center">
          <p className="text-sm text-[#6B7280]">Tidak ada pengguna di departemen ini.</p>
        </div>
      )}
    </div>
  );
}
