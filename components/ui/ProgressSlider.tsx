'use client';

import React, { useRef, useCallback } from 'react';

interface ProgressSliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

const STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function snapToNearest(rawPercent: number): number {
  return Math.min(100, Math.max(0, Math.round(rawPercent / 10) * 10));
}

export default function ProgressSlider({ value, onChange, disabled }: ProgressSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const percentFromPointer = useCallback((clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const raw = ((clientX - rect.left) / rect.width) * 100;
    return snapToNearest(raw);
  }, [value]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    onChange(percentFromPointer(e.clientX));
  }, [disabled, onChange, percentFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || disabled) return;
    onChange(percentFromPointer(e.clientX));
  }, [disabled, onChange, percentFromPointer]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      className={`select-none${disabled ? ' opacity-40 pointer-events-none' : ''}`}
      style={{ minHeight: 72 }}
    >
      {/* Track + value label row */}
      <div className="flex items-center gap-3">
        {/* Track */}
        <div
          ref={trackRef}
          className="relative flex-1"
          style={{ height: 18, cursor: disabled ? 'default' : 'pointer' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Track background */}
          <div
            className="absolute inset-0"
            style={{ background: '#E5E7EB', borderRadius: 9 }}
          />

          {/* Track fill */}
          <div
            className="absolute top-0 left-0 h-full"
            style={{
              width: `${value}%`,
              background: '#2A7B76',
              borderRadius: 9,
              transition: 'width 80ms ease-out',
            }}
          />

          {/* Dots */}
          {STEPS.map((step) => {
            const isActive = step === value;
            const isFilled = step < value;

            return (
              <div
                key={step}
                style={{
                  position: 'absolute',
                  left: `${step}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  touchAction: 'none',
                }}
                onPointerDown={(e) => {
                  if (disabled) return;
                  e.stopPropagation();
                  onChange(step);
                }}
              >
                {isActive ? (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#2A7B76',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(42,123,118,0.35)',
                    }}
                  >
                    <div
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: isFilled ? '#2A7B76' : '#fff',
                      border: `2px solid ${isFilled ? '#2A7B76' : '#E5E7EB'}`,
                      transition: 'background 80ms ease-out, border-color 80ms ease-out',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Value label */}
        <span
          style={{
            minWidth: 44,
            fontSize: 16,
            fontWeight: 500,
            color: '#1A1A2E',
            textAlign: 'right',
            fontFamily: 'DM Sans, sans-serif',
            flexShrink: 0,
          }}
        >
          {value}%
        </span>
      </div>

      {/* Step labels row — below track, aligned to each dot */}
      <div className="relative flex-1" style={{ height: 20, marginTop: 4 }}>
        {STEPS.map((step) => {
          const isActive = step === value;
          // only show label at 0, 25, 50, 75, 100 to avoid crowding,
          // but always show the active step
          const showLabel = isActive || step === 0 || step === 50 || step === 100;
          if (!showLabel) return null;
          return (
            <span
              key={step}
              style={{
                position: 'absolute',
                left: `${step}%`,
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#2A7B76' : '#9CA3AF',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {step}%
            </span>
          );
        })}
      </div>
    </div>
  );
}
