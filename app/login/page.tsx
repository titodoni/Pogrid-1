'use client';

import { useState, useEffect, useRef } from 'react';
import { Delete } from 'lucide-react';
import useUIStore from '@/store/uiStore';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

function getRoleHomeRoute(role: string): string {
  switch (role) {
    case 'admin':
    case 'manager':
    case 'sales':   return '/board';
    case 'finance': return '/invoicing';
    default:        return '/jobs'; // worker
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read session from store (re-render on change)
  const session = useUIStore((state) => state.session);

  // ── Session guard ──
  useEffect(() => {
    const s = useUIStore.getState().session;
    if (!s || !s.isLoggedIn) {
      window.location.href = '/select-dept';
    }
  }, []);

  // ── Cleanup shake timeout on unmount ──
  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  // ── PIN handlers ──
  function handleKey(digit: string) {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      // 150ms delay for last dot to fill visually, then redirect
      setTimeout(() => {
        const s = useUIStore.getState().session;
        if (s) {
          window.location.href = getRoleHomeRoute(s.role);
        }
      }, 150);
    }
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1));
  }

  function triggerError() {
    setError(true);
    setPin('');
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => setError(false), 400);
  }

  // ── Keypad layout ──
  const digitKeys: (string | null)[] = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    null, '0', 'backspace',
  ];

  const keyBtnClass =
    'w-full aspect-square min-w-[72px] min-h-[72px] bg-white border border-[#E5E7EB] ' +
    'rounded-xl text-2xl font-semibold text-[#1A1A2E] flex items-center justify-center ' +
    'active:bg-[#F8F9FA] transition-colors duration-100';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center px-6 pt-12 pb-8 relative">

      {/* ── Back button ── */}
      <button
        type="button"
        onClick={() => {
          useUIStore.getState().clearSession();
          window.location.href = '/select-dept';
        }}
        className="absolute top-4 left-4 text-sm text-[#6B7280] min-h-[48px] min-w-[48px] flex items-center"
      >
        ← Kembali
      </button>

      {/* ── User identity block ── */}
      {session && (
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center">
            <span className="text-white text-xl font-semibold select-none">
              {getInitials(session.name)}
            </span>
          </div>
          {/* Name */}
          <p className="text-lg font-semibold text-[#1A1A2E] mt-3 text-center">
            {session.name}
          </p>
          {/* Department · Role */}
          <p className="text-sm text-[#6B7280] text-center capitalize">
            {session.department} · {session.role}
          </p>
        </div>
      )}

      {/* ── PIN dot indicator ── */}
      <div
        className={`flex gap-4 justify-center mt-8 mb-2 ${
          error ? 'animate-shake' : ''
        }`}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={
              i < pin.length
                ? 'w-4 h-4 rounded-full bg-brand'
                : 'w-4 h-4 rounded-full border-2 border-[#E5E7EB]'
            }
          />
        ))}
      </div>

      {/* Error text — always rendered, visibility via opacity */}
      <p
        className={`text-sm text-danger text-center mt-1 h-5 transition-opacity duration-150 ${
          error ? 'opacity-100' : 'opacity-0'
        }`}
      >
        PIN salah
      </p>

      {/* ── Keypad ── */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mt-6">
        {digitKeys.map((key, idx) => {
          if (key === null) {
            // Empty spacer
            return <div key={idx} />;
          }
          if (key === 'backspace') {
            return (
              <button
                key="backspace"
                type="button"
                onClick={handleBackspace}
                className={keyBtnClass}
                aria-label="Hapus digit terakhir"
              >
                <Delete size={24} className="text-[#1A1A2E]" />
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className={keyBtnClass}
              aria-label={`Digit ${key}`}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* ── Dev: Test Error Button (removed in Phase 5) ── */}
      <button
        type="button"
        onClick={triggerError}
        className="mt-6 text-xs text-[#9CA3AF] underline"
      >
        Test Error State
      </button>

    </div>
  );
}
