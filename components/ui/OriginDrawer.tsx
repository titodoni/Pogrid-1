'use client';

/**
 * OriginDrawer — Expanding Card Panel
 *
 * Renders a panel fixed at the exact position of the tapped card.
 * Only HEIGHT animates. Position never changes.
 *
 * top   = triggerRect.top                          (locked)
 * left  = triggerRect.left                         (locked)
 * width = clamp(triggerRect.width, 280px, 90vw)    (locked)
 *
 * height: triggerRect.height → contentH (open)
 *         contentH → triggerRect.height (close)
 */

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

type Phase = 'out' | 'measure' | 'closed' | 'open' | 'closing';

function parsePx(v: string): number {
  if (v.endsWith('vh'))  return (parseFloat(v) / 100) * window.innerHeight;
  if (v.endsWith('px'))  return parseFloat(v);
  return window.innerHeight * 0.60;
}

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '60vh',
  className = '',
}: OriginDrawerProps) {
  const [phase,    setPhase]    = useState<Phase>('out');
  const [contentH, setContentH] = useState(0);
  const innerRef  = useRef<HTMLDivElement>(null);
  const didClose  = useRef(false);

  // open → measure → closed (snap) → open (animate)
  useEffect(() => {
    if (open && triggerRect) {
      didClose.current = false;
      setContentH(0);
      setPhase('measure');
    } else if (!open) {
      setPhase('closing');
    }
  }, [open, triggerRect]);

  useLayoutEffect(() => {
    if (phase !== 'measure' || !innerRef.current) return;
    const maxPx = parsePx(maxHeight);
    const h = Math.min(innerRef.current.scrollHeight, maxPx);
    setContentH(h);
    setPhase('closed');
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')));
  }, [phase, maxHeight]);

  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== 'height') return;
    if (phase === 'closing' && !didClose.current) {
      didClose.current = true;
      setPhase('out');
    }
  }, [phase]);

  if (phase === 'out' || !triggerRect) return null;

  const maxPx  = parsePx(maxHeight);
  const openH  = contentH > 0 ? contentH : maxPx;
  const isOpen = phase === 'open';

  // Width: clamp so it's never narrower than 280px or wider than 90vw
  const rawW    = triggerRect.width;
  const clampW  = Math.min(Math.max(rawW, 280), window.innerWidth * 0.9);
  // Re-center if width was clamped
  const centerX = triggerRect.left + rawW / 2;
  const finalL  = Math.max(8, Math.min(centerX - clampW / 2, window.innerWidth - clampW - 8));

  const height: number =
    phase === 'closed' || phase === 'closing'
      ? triggerRect.height
      : openH;

  // measure phase: off-screen, invisible, auto height for scrollHeight read
  if (phase === 'measure') {
    return (
      <div
        ref={innerRef}
        style={{
          position: 'fixed',
          top: -9999,
          left: finalL,
          width: clampW,
          height: 'auto',
          overflow: 'visible',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {children}
      </div>
    );
  }

  const transition =
    phase === 'closed'
      ? 'none'
      : isOpen
        ? 'height 280ms cubic-bezier(0.34,1.15,0.64,1), box-shadow 280ms ease'
        : 'height 200ms ease-in, box-shadow 200ms ease';

  const backdropOpacity = isOpen ? 0.3 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0,0,0,' + backdropOpacity + ')',
          transition: 'background 250ms ease',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — position locked to card */}
      <div
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white rounded-xl shadow-2xl overflow-hidden', className].join(' ')}
        style={{
          top:    triggerRect.top,
          left:   finalL,
          width:  clampW,
          height,
          transition,
          willChange: 'height',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* phase is never 'measure' here — guarded by early return above */}
        <div ref={innerRef} className="flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}

export default OriginDrawer;
