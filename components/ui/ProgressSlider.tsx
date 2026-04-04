'use client';

import React from 'react';

interface ProgressSliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function ProgressSlider({ value, onChange, disabled }: ProgressSliderProps) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #2A7B76 ${value}%, #E5E7EB ${value}%)`,
          // Thumb styling via globals.css or inline for cross-browser
        }}
      />
      <span
        className="text-sm font-medium text-[#1A1A2E] text-right"
        style={{ minWidth: 40 }}
      >
        {value}%
      </span>
    </div>
  );
}
