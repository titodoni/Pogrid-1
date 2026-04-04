'use client';

import { useEffect } from 'react';
import useUIStore from '@/store/uiStore';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { ProfileAvatar } from '@/components/layout/ProfileAvatar';

export default function ExportPage() {
  useEffect(() => {
    const session = useUIStore.getState().session;
    if (!session || !session.isLoggedIn) {
      window.location.href = '/select-dept';
    }
  }, []);

  const session = useUIStore((state) => state.session);
  if (!session) return null;

  return (
    <LayoutWrapper
      role={session.role}
      department={session.department}
      headerTitle="Export"
      headerLeft={<ProfileAvatar name={session.name} />}
    >
      <div className="flex items-center justify-center h-40">
        <p className="text-lg font-semibold text-[#6B7280]">Export — Phase 3</p>
      </div>
    </LayoutWrapper>
  );
}
