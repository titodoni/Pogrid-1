'use client';

/**
 * OriginDrawer — Contextual Expansion only.
 *
 * The panel is anchored to the tapped card and expands DOWNWARD.
 * Zero viewport math. No bottom-sheet behavior.
 *
 * top   = triggerRect.top   (fixed, never changes)
 * left  = triggerRect.left  (fixed, never changes)
 * width = triggerRect.width (fixed, never changes)
 *
 * Only HEIGHT animates: card.height → contentHeight
 */

import React, {
  useEffect, useLayoutEffect, useRef, useState, useCallback,
} from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;  // e.g. '65vh' — only used to clamp, not position
  className?: string;
}

const CLOSE_DRAG = 60;
const CLOSE_VEL  = 0.4;

type Phase = 'out' | 'measure' | 'closed' | 'open' | 'closing';

function toPx(v: string, vh: number): number {
  if (v.endsWith('vh'))  return (parseFloat(v) / 100) * vh;
  if (v.endsWith('px'))  return parseFloat(v);
  return vh * 0.65;
}

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '65vh',
  className = '',
}: OriginDrawerProps) {
  const [phase,    setPhase]    = useState<Phase>('out');
  const [contentH, setContentH] = useState(0);
  const [dragY,    setDragY]    = useState(0);
  const [dragging, setDragging] = useState(false);

  const innerRef = useRef<HTMLDivElement>(null);
  const startY   = useRef(0);
  const startT   = useRef(0);
  const lastY    = useRef(0);
  const didClose = useRef(false);

  // ── lifecycle ──
  useEffect(() => {
    if (open && triggerRect) {
      didClose.current = false;
      setDragY(0);
      setContentH(0);
      setPhase('measure');
    } else if (!open) {
      setPhase('closing');
    }
  }, [open, triggerRect]);

  // ── measure true content height ──
  useLayoutEffect(() => {
    if (phase !== 'measure') return;
    if (!innerRef.current) return;
    const maxPx = toPx(maxHeight, window.innerHeight);
    const h     = Math.min(innerRef.current.scrollHeight, maxPx);
    setContentH(h);
    setPhase('closed');  // snap to card size (no transition)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase('open'))  // then animate open
    );
  }, [phase, maxHeight]);

  // ── unmount after close animation ──
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== 'height') return;
    if (phase === 'closing' && !didClose.current) {
      didClose.current = true;
      setPhase('out');
      setDragY(0);
    }
  }, [phase]);

  // ── swipe down to close ──
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    lastY.current  = e.touches[0].clientY;
    startT.current = performance.now();
    setDragging(true);
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - startY.current;
    lastY.current = e.touches[0].clientY;
    if (dy > 0) setDragY(dy);
  }, []);
  const onTouchEnd = useCallback(() => {
    setDragging(false);
    const dy  = lastY.current - startY.current;
    const vel = dy / Math.max(1, performance.now() - startT.current);
    if (dy > CLOSE_DRAG || vel > CLOSE_VEL) onClose();
    else setDragY(0);
  }, [onClose]);

  if (phase === 'out' || !triggerRect) return null;

  const maxPx  = toPx(maxHeight, window.innerHeight);
  const openH  = contentH > 0 ? contentH : maxPx;
  const isOpen = phase === 'open';

  // Height per phase — position NEVER changes
  const height: number | string =
    phase === 'measure' ? 'auto' :
    phase === 'closed'  ? triggerRect.height :
    phase === 'closing' ? triggerRect.height :
    openH;  // 'open'

  const overflow = phase === 'measure' ? 'visible' : 'hidden';
  const opacity  = phase === 'measure' ? 0 : 1;

  const transition =
    phase === 'measure' || phase === 'closed' || dragging
      ? 'none'
      : isOpen
        ? 'height 300ms cubic-bezier(0.34,1.2,0.64,1)'
        : 'height 200ms ease-in';

  const backdropOpacity = isOpen ? Math.max(0, 1 - dragY / 160) : 0;

  return (
    <>
      {/* Backdrop — tap to close */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: backdropOpacity,
          transition: dragging ? 'none' : 'opacity 250ms ease',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — anchored to card, grows downward */}
      <div
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white shadow-xl rounded-xl overflow-hidden', className].join(' ')}
        style={{
          top:    triggerRect.top,
          left:   triggerRect.left,
          width:  triggerRect.width,
          height,
          overflow,
          opacity,
          transition,
          willChange: 'height',
          touchAction: 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Inner div — ref for scrollHeight measurement */}
        <div ref={innerRef} className="flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}

export default OriginDrawer;
