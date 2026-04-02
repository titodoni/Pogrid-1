'use client';

/**
 * OriginDrawer
 *
 * MOBILE  (≤ 768px): origin animation starts at card, final state = full-width
 *                     bottom sheet anchored to bottom of screen.
 * DESKTOP (> 768px): panel anchors to card, expands downward with card width.
 *
 * Both share the same phase flow:
 *   measure → closed (snap to card) → open (animate to final) → closing → out
 */

import React, {
  useEffect, useLayoutEffect, useRef, useState, useCallback,
} from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

const MOBILE_BP    = 768;
const CLOSE_DRAG   = 80;
const CLOSE_VEL    = 0.4;

type Phase = 'out' | 'measure' | 'closed' | 'open' | 'closing';

function toPx(v: string, vh: number) {
  if (v.endsWith('vh'))  return (parseFloat(v) / 100) * vh;
  if (v.endsWith('px'))  return parseFloat(v);
  return vh * 0.88;
}

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '88vh',
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

  // ── measure content height ──
  useLayoutEffect(() => {
    if (phase !== 'measure') return;
    if (!innerRef.current) return;
    const vh    = window.innerHeight;
    const maxPx = toPx(maxHeight, vh);
    const h     = Math.min(innerRef.current.scrollHeight, maxPx);
    setContentH(h);
    setPhase('closed');
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')));
  }, [phase, maxHeight]);

  // ── unmount via transitionend ──
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    // mobile animates 'top', desktop animates 'height'
    if (e.propertyName !== 'top' && e.propertyName !== 'height') return;
    if (phase === 'closing' && !didClose.current) {
      didClose.current = true;
      setPhase('out');
      setDragY(0);
    }
  }, [phase]);

  // ── swipe to close ──
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

  const vh       = window.innerHeight;
  const vw       = window.innerWidth;
  const maxPx    = toPx(maxHeight, vh);
  const isMobile = vw <= MOBILE_BP;
  const openH    = contentH > 0 ? contentH : maxPx;
  const isOpen   = phase === 'open';

  // ─────────────────────────────────────────────────────────────────
  // Geometry per phase + breakpoint
  // ─────────────────────────────────────────────────────────────────

  let top:          number | string;
  let left:         number;
  let width:        number | string;
  let height:       number | string;
  let overflow:     string;
  let borderRadius: string;
  let transform:    string;
  let transition:   string;

  if (phase === 'measure') {
    // Off-screen: full-width at vw so inner content lays out at real width
    top          = vh + 200;
    left         = 0;
    width        = isMobile ? vw : triggerRect.width;
    height       = 'auto';
    overflow     = 'visible';
    borderRadius = isMobile ? '20px 20px 0 0' : '12px';
    transform    = 'none';
    transition   = 'none';

  } else if (phase === 'closed' || phase === 'closing') {
    // At card — both mobile and desktop start/end at card position
    top          = triggerRect.top;
    left         = triggerRect.left;
    width        = triggerRect.width;
    height       = triggerRect.height;
    overflow     = 'hidden';
    borderRadius = '12px';
    transform    = 'none';
    transition   = phase === 'closed'
      ? 'none'
      : isMobile
        ? 'top 260ms ease-in, left 260ms ease-in, width 260ms ease-in, height 260ms ease-in, border-radius 260ms ease'
        : 'height 220ms ease-in, border-radius 220ms ease';

  } else {
    // OPEN — final resting state differs by breakpoint
    if (isMobile) {
      // Full-width bottom sheet
      top          = vh - openH + dragY;
      left         = 0;
      width        = vw;
      height       = openH;
      overflow     = 'hidden';
      borderRadius = '20px 20px 0 0';
      transform    = 'none';
      transition   = dragging
        ? 'none'
        : 'top 360ms cubic-bezier(0.34,1.28,0.64,1), left 360ms cubic-bezier(0.34,1.28,0.64,1), width 360ms cubic-bezier(0.34,1.28,0.64,1), height 360ms cubic-bezier(0.34,1.28,0.64,1), border-radius 360ms ease';
    } else {
      // Desktop: expand downward from card
      top          = triggerRect.top;
      left         = triggerRect.left;
      width        = triggerRect.width;
      height       = openH;
      overflow     = 'hidden';
      borderRadius = '12px';
      transform    = 'none';
      transition   = dragging
        ? 'none'
        : 'height 320ms cubic-bezier(0.34,1.2,0.64,1), border-radius 320ms ease';
    }
  }

  const opacity         = phase === 'measure' ? 0 : 1;
  const backdropOpacity = isOpen ? Math.max(0, 1 - dragY / 200) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropOpacity,
          transition: dragging ? 'none' : 'opacity 280ms ease',
          pointerEvents: isOpen && dragY < 10 ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white shadow-2xl flex flex-col', className].join(' ')}
        style={{
          top, left, width, height, overflow,
          borderRadius, opacity, transform, transition,
          willChange: 'top, left, width, height',
          touchAction: 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Drag handle — mobile open only */}
        {isOpen && isMobile && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
            <div className="w-10 h-[5px] rounded-full bg-[#E5E7EB]" />
          </div>
        )}

        {/* Inner — measured + scrollable */}
        <div
          ref={innerRef}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>

        {/* iOS safe area — mobile only */}
        {isOpen && isMobile && (
          <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        )}
      </div>
    </>
  );
}

export default OriginDrawer;
