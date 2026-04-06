'use client';

import React, { useEffect, useState } from 'react';
import useUIStore from '@/store/uiStore';

interface BottomSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onDismiss, children }: BottomSheetProps) {
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);
  const [visible, setVisible] = useState(isOpen);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setAnimClass('animate-slide-up');
    } else {
      setAnimClass('');
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!visible) return null;

  function handleOverlayTap() {
    closeBottomSheet();
    onDismiss();
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        style={{ animation: isOpen ? 'fadeIn 200ms ease forwards' : 'fadeOut 200ms ease forwards' }}
        onClick={handleOverlayTap}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white rounded-t-2xl',
          'max-h-[90vh] overflow-y-auto scrollbar-hide',
          'px-4 pt-2 pb-8',
          animClass,
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#E5E7EB] rounded-full mx-auto mb-4" />
        {children}
      </div>
    </>
  );
}
