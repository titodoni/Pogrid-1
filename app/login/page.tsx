'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Delete, Phone, Mail, MessageCircle, X } from 'lucide-react';
import { mockUsers } from '@/lib/mockData';
import useUIStore from '@/store/uiStore';

// ─── Helpers ───────────────────────────────────────────────────────────────

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
    default:        return '/jobs';
  }
}

// ─── Shared ForgotPinSheet (same component as select-dept) ──────────────────────

function ForgotPinSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[80vh] flex flex-col">
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

        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-4">
          <p className="text-sm font-semibold text-[#1A1A2E]">PIN Terlupakan?</p>

          <a href="tel:+62271000000" className="flex items-center gap-3 min-h-[48px]">
            <Phone size={20} className="text-[#2A7B76] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#1A1A2E]">+62 271 000 000</span>
              <span className="text-xs text-[#6B7280]">Jam kerja 08:00–17:00</span>
            </div>
          </a>

          <a href="mailto:admin@pogrid.local" className="flex items-center gap-3 min-h-[48px]">
            <Mail size={20} className="text-[#2A7B76] flex-shrink-0" />
            <span className="text-sm font-medium text-[#1A1A2E]">admin@pogrid.local</span>
          </a>

          <a
            href="https://wa.me/6227100000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 min-h-[48px]"
          >
            <MessageCircle size={20} className="text-[#2A7B76] flex-shrink-0" />
            <span className="text-sm font-medium text-[#1A1A2E]">WhatsApp Admin</span>
          </a>

          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Admin dapat reset PIN Anda. Siapkan identitas karyawan. Estimasi 5 menit.
          </p>
        </div>

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
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const session = useUIStore((s) => s.session);

  const [pin, setPin]               = useState('');
  const [shaking, setShaking]       = useState(false);
  const [dotError, setDotError]     = useState(false);  // red flash on dots
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [attempts, setAttempts]     = useState(0);
  const [locked, setLocked]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(false);
  const [isOnline, setIsOnline]     = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);

  const shakeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Session guard ──
  useEffect(() => {
    const s = useUIStore.getState().session;
    if (!s || !s.isLoggedIn) {
      window.location.href = '/select-dept';
    }
  }, []);

  // ── Online/offline detection ──
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (shakeRef.current) clearTimeout(shakeRef.current);
      if (errRef.current)   clearTimeout(errRef.current);
      if (toastRef.current) clearTimeout(toastRef.current);
    };
  }, []);

  const MAX_ATTEMPTS = 3;
  const keypadDisabled = submitting || locked || !isOnline;

  function triggerError(msg: string, newAttempts: number) {
    setPin('');
    setShaking(true);
    setDotError(true);
    setErrorMsg(msg);
    setSubmitting(false);

    if (shakeRef.current) clearTimeout(shakeRef.current);
    shakeRef.current = setTimeout(() => {
      setShaking(false);
      setDotError(false);
    }, 400);

    if (errRef.current) clearTimeout(errRef.current);
    errRef.current = setTimeout(() => {
      if (newAttempts < MAX_ATTEMPTS) setErrorMsg(null);
    }, 2000);
  }

  function handleKey(digit: string) {
    if (pin.length >= 4 || keypadDisabled) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      setSubmitting(true);
      setTimeout(() => validatePin(newPin), 150);
    }
  }

  function handleBackspace() {
    if (keypadDisabled) return;
    setPin((prev) => prev.slice(0, -1));
  }

  function validatePin(enteredPin: string) {
    const s = useUIStore.getState().session;
    if (!s) { window.location.href = '/select-dept'; return; }

    const user = mockUsers.find((u) => u.id === s.userId);
    const correct = user?.pin === enteredPin;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      // Success
      useUIStore.getState().setSession({ ...s, isLoggedIn: true });
      setToast(true);
      toastRef.current = setTimeout(() => {
        window.location.href = getRoleHomeRoute(s.role);
      }, 1500);
    } else {
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        triggerError('Terlalu banyak percobaan. Hubungi Admin.', newAttempts);
      } else {
        triggerError('PIN salah', newAttempts);
      }
    }
  }

  const digitKeys: (string | null)[] = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    null, '0', 'backspace',
  ];

  const keyBase =
    'w-full min-w-[72px] min-h-[72px] bg-white border border-[#E5E7EB] rounded-lg ' +
    'text-2xl font-semibold text-[#1A1A2E] flex items-center justify-center ' +
    'transition-colors duration-100 active:bg-[#F8F9FA]';
  const keyDisabled = 'opacity-40 pointer-events-none';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col relative">

      {/* ── App Bar (sticky top-0) ── */}
      <header className="sticky top-0 z-30 bg-[#F8F9FA] flex items-center px-2 h-14">
        <button
          type="button"
          onClick={() => {
            useUIStore.getState().clearSession();
            window.location.href = '/select-dept';
          }}
          className="flex items-center gap-1 min-h-[48px] min-w-[48px] px-2 text-sm text-[#6B7280]"
        >
          ← Kembali
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-[#1A1A2E] pr-[60px]">
          Masukkan PIN
        </h1>
      </header>

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div className="bg-[#DE8F26] text-white text-sm font-medium text-center py-2 px-4">
          Koneksi terputus. Coba lagi.
        </div>
      )}

      {/* ── Success Toast ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#D1FAE5] text-[#065F46] text-sm font-medium px-5 py-2 rounded-xl shadow">
          PIN benar ✓
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 flex flex-col items-center px-6 pb-10 pt-6">

        {/* Identity block */}
        {session && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#2A7B76] flex items-center justify-center">
              <span className="text-white text-base font-semibold select-none">
                {getInitials(session.name)}
              </span>
            </div>
            <p className="text-base font-semibold text-[#1A1A2E] mt-3 text-center">
              {session.name}
            </p>
            <p className="text-[13px] text-[#6B7280] text-center capitalize">
              {session.department} • {session.role}
            </p>
          </div>
        )}

        {/* PIN dot indicator */}
        <div
          className={`flex gap-3 justify-center mt-8 mb-1 ${
            shaking ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((i) => {
            const filled  = i < pin.length;
            const errDot  = dotError && i < 4;
            return (
              <div
                key={i}
                className={[
                  'w-[14px] h-[14px] rounded-full transition-colors duration-150',
                  errDot  ? 'bg-[#B33941]' :
                  filled  ? 'bg-[#2A7B76]' :
                  submitting && i < 4 ? 'border-2 border-[#2A7B76] opacity-50' :
                  'border-2 border-[#E5E7EB]',
                ].join(' ')}
              />
            );
          })}
        </div>

        {/* Error / status message */}
        <p
          className={`text-sm text-[#B33941] text-center mt-1 h-5 transition-opacity duration-150 ${
            errorMsg ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {errorMsg ?? '\u00a0'}
        </p>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[288px] mt-5">
          {digitKeys.map((key, idx) => {
            if (key === null) return <div key={idx} />;
            if (key === 'backspace') {
              return (
                <button
                  key="backspace"
                  type="button"
                  onClick={handleBackspace}
                  disabled={keypadDisabled}
                  className={[keyBase, keypadDisabled ? keyDisabled : ''].join(' ')}
                  aria-label="Hapus"
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
                disabled={keypadDisabled}
                className={[keyBase, keypadDisabled ? keyDisabled : ''].join(' ')}
                aria-label={`Digit ${key}`}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Lupa PIN link */}
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="mt-8 text-[13px] text-[#2A7B76] underline min-h-[48px] px-2"
        >
          Lupa PIN? Hubungi Admin
        </button>
      </div>

      {/* Forgot PIN Sheet */}
      {forgotOpen && <ForgotPinSheet onClose={() => setForgotOpen(false)} />}
    </div>
  );
}
