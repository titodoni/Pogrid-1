'use client';

import { useEffect } from 'react';
import useUIStore from '@/store/uiStore';

function getRoleHomeRoute(role: string): string {
  switch (role) {
    case 'admin':
    case 'manager':
    case 'sales':   return '/board';
    case 'finance': return '/invoicing';
    default:        return '/jobs'; // worker
  }
}

export default function RootPage() {
  useEffect(() => {
    const session = useUIStore.getState().session;
    if (session && session.isLoggedIn) {
      window.location.href = getRoleHomeRoute(session.role);
    } else {
      window.location.href = '/select-dept';
    }
  }, []);

  // Loading splash while redirect is pending
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center">
        <span className="text-white text-2xl font-bold select-none">PG</span>
      </div>
    </div>
  );
}
