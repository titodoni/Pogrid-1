'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface StepperControlProps {
  current: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function StepperControl({ current, max, onChange, disabled }: StepperControlProps) {
  const atMin = current === 0;
  const atMax = current === max;

  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <button
        type="button"
        onClick={() => { if (!atMin) onChange(current - 1); }}
        className={`flex items-center justify-center rounded-lg bg-[#F3F4F6] transition-opacity ${atMin ? 'opacity-40' : ''}`}
        style={{ width: 56, height: 48 }}
        aria-label="Kurangi"
      >
        <Minus size={20} color="#1A1A2E" />
      </button>

      <span
        className="text-base font-medium text-[#1A1A2E] text-center"
        style={{ minWidth: 80 }}
      >
        {current} / {max} units
      </span>

      <button
        type="button"
        onClick={() => { if (!atMax) onChange(current + 1); }}
        className={`flex items-center justify-center rounded-lg bg-[#F3F4F6] transition-opacity ${atMax ? 'opacity-40' : ''}`}
        style={{ width: 56, height: 48 }}
        aria-label="Tambah"
      >
        <Plus size={20} color="#1A1A2E" />
      </button>
    </div>
  );
}
