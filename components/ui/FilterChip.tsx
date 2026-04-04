'use client';

import React from 'react';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 h-9 text-sm font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0',
        active
          ? 'bg-[#2A7B76] text-white border-transparent'
          : 'bg-white text-[#374151] border border-[#E5E7EB]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
