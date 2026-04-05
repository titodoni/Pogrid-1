'use client';

import React, { useState } from 'react';
import { X, KeyRound, LogOut } from 'lucide-react';
import useUIStore from '@/store/uiStore';

interface ProfileAvatarProps {
  name: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.charAt(0).toUpperCase() ?? '';
  const last = words.length > 1 ? words[words.length - 1].charAt(0).toUpperCase() : '';
  return first + last;
}

// ─── PIN Change Mini-Flow ────────────────────────────────────────────────────
type PinStep = 'idle' | 'old' | 'new' | 'confirm';

function PinPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  function tap(k: string) {
    if (k === '⌫') { onChange(value.slice(0, -1)); return; }
    if (k === '') return;
    if (value.length < 4) onChange(value + k);
  }
  return (
    <div className="mt-3">
      <div className="flex justify-center gap-3 mb-4">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-3 h-3 rounded-full transition-all ${
            value.length > i ? 'bg-[#2A7B76]' : 'bg-[#E5E7EB]'
          }`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(k)}
            className="h-14 rounded-xl text-lg font-semibold text-[#1A1A2E] bg-[#F3F4F6] active:bg-[#E5E7EB] transition-colors disabled:opacity-0"
            disabled={k === ''}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileDrawer({ onClose }: { onClose: () => void }) {
  const session = useUIStore((s) => s.session);
  const [pinStep, setPinStep] = useState<PinStep>('idle');
  const [pinOld, setPinOld] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  const MOCK_PIN = session?.role === 'admin' ? '0000' : '1234';

  function handleOldDone() {
    if (pinOld !== MOCK_PIN) {
      setPinError('PIN lama salah');
      setTimeout(() => { setPinOld(''); setPinError(''); }, 800);
      return;
    }
    setPinError('');
    setPinStep('new');
  }

  function handleNewDone() {
    if (pinNew.length < 4) return;
    setPinStep('confirm');
  }

  function handleConfirmDone() {
    if (pinConfirm !== pinNew) {
      setPinError('PIN tidak cocok');
      setTimeout(() => { setPinConfirm(''); setPinError(''); }, 800);
      return;
    }
    setPinSuccess(true);
    setTimeout(() => { onClose(); }, 1800);
  }

  function resetPin() {
    setPinStep('idle'); setPinOld(''); setPinNew(''); setPinConfirm('');
    setPinError(''); setPinSuccess(false);
  }

  function handleLogout() {
    useUIStore.getState().clearSession();
    window.location.href = '/select-dept';
  }

  const initials = session ? getInitials(session.name) : 'PG';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Left drawer — top-0 to bottom-0, not clipped by navbar */}
      <div
        className="fixed top-0 left-0 bottom-0 z-50 bg-white shadow-2xl flex flex-col animate-slide-in-left"
        style={{ width: '80vw', maxWidth: 320 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 border-b border-[#E5E7EB] flex-shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 12 }}>
          <span className="text-base font-semibold text-[#1A1A2E]">Profil</span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center min-w-[48px] min-h-[48px] text-[#6B7280]"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-5">
          {/* Avatar + info */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#2A7B76] flex items-center justify-center">
              <span className="text-white text-2xl font-bold select-none">{initials}</span>
            </div>
            <p className="text-lg font-semibold text-[#1A1A2E] text-center">{session?.name}</p>
            <p className="text-sm text-[#6B7280] capitalize text-center">
              {session?.role} · {session?.department}
            </p>
          </div>

          {/* Ganti PIN */}
          {pinStep === 'idle' && !pinSuccess && (
            <button
              type="button"
              onClick={() => setPinStep('old')}
              className="w-full flex items-center gap-3 min-h-[52px] px-4 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#1A1A2E] mb-3"
            >
              <KeyRound size={18} className="text-[#2A7B76]" />
              Ganti PIN
            </button>
          )}

          {pinSuccess && (
            <div className="w-full text-center py-3 rounded-xl bg-[#D1FAE5] text-[#065F46] text-sm font-medium mb-3 animate-fade-in">
              PIN berhasil diubah ✓
            </div>
          )}

          {pinStep === 'old' && (
            <div className="animate-fade-in">
              <p className="text-sm font-semibold text-[#1A1A2E] mb-1">Masukkan PIN lama</p>
              {pinError && <p className="text-xs text-[#B33941] mb-1 animate-shake">{pinError}</p>}
              <PinPad value={pinOld} onChange={setPinOld} />
              <button type="button" onClick={handleOldDone} disabled={pinOld.length < 4}
                className="mt-3 w-full h-12 rounded-xl bg-[#2A7B76] text-white text-sm font-medium disabled:opacity-40">
                Lanjut
              </button>
              <button type="button" onClick={resetPin} className="mt-2 w-full h-10 text-sm text-[#6B7280]">Batal</button>
            </div>
          )}

          {pinStep === 'new' && (
            <div className="animate-fade-in">
              <p className="text-sm font-semibold text-[#1A1A2E] mb-1">PIN baru</p>
              <PinPad value={pinNew} onChange={setPinNew} />
              <button type="button" onClick={handleNewDone} disabled={pinNew.length < 4}
                className="mt-3 w-full h-12 rounded-xl bg-[#2A7B76] text-white text-sm font-medium disabled:opacity-40">
                Lanjut
              </button>
              <button type="button" onClick={resetPin} className="mt-2 w-full h-10 text-sm text-[#6B7280]">Batal</button>
            </div>
          )}

          {pinStep === 'confirm' && (
            <div className="animate-fade-in">
              <p className="text-sm font-semibold text-[#1A1A2E] mb-1">Konfirmasi PIN baru</p>
              {pinError && <p className="text-xs text-[#B33941] mb-1 animate-shake">{pinError}</p>}
              <PinPad value={pinConfirm} onChange={setPinConfirm} />
              <button type="button" onClick={handleConfirmDone} disabled={pinConfirm.length < 4}
                className="mt-3 w-full h-12 rounded-xl bg-[#2A7B76] text-white text-sm font-medium disabled:opacity-40">
                Simpan PIN
              </button>
              <button type="button" onClick={resetPin} className="mt-2 w-full h-10 text-sm text-[#6B7280]">Batal</button>
            </div>
          )}
        </div>

        {/* Keluar — pinned to bottom, clears navbar + safe area */}
        <div
          className="px-4 pt-3 flex-shrink-0 border-t border-[#F3F4F6]"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
        >
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-[#FECACA] text-sm font-medium text-[#B33941] active:bg-[#FEF2F2] transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </div>
    </>
  );
}

export function ProfileAvatar({ name }: ProfileAvatarProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center min-w-[48px] min-h-[48px]"
        aria-label={`Profile: ${name}`}
      >
        <div className="w-8 h-8 bg-[#2A7B76] rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold leading-none select-none">
            {getInitials(name)}
          </span>
        </div>
      </button>
      {open && <ProfileDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
