'use client';

/**
 * OriginDrawer — Contextual Expansion (NOT a bottom sheet).
 *
 * The panel is anchored to the tapped card and expands DOWNWARD.
 * It never moves to the bottom of the screen.
 *
 * Positioning:
 *   top   = triggerRect.top          (card's Y — fixed anchor)
 *   left  = triggerRect.left
 *   width = triggerRect.width
 *
 * Animation:
 *   closed : height = triggerRect.height  (looks like the card)
 *   open   : height = measured content height (clamped to maxHeight)
 *
 * NO viewport-height math.
 * NO translateY across the screen.
 * NO bottom anchoring.
 */

import React, {
  useEffect, useLayoutEffect, useRef, useState, useCallback,
} from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;  // default '65vh'
  className?: string;
}

const CLOSE_DRAG_PX = 60;
const CLOSE_VEL     = 0.4;

type Phase = 'out' | 'measure' | 'closed' | 'open' | 'closing';

function toPx(value: string, vh: number): number {
  if (value.endsWith('vh'))  return (parseFloat(value) / 100) * vh;
  if (value.endsWith('px'))  return parseFloat(value);
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
  const [contentH, setContentH] = useState(0);  // measured px height of content
  const [dragY,    setDragY]    = useState(0);
  const [dragging, setDragging] = useState(false);

  const innerRef = useRef<HTMLDivElement>(null);  // measures content
  const startY   = useRef(0);
  const startT   = useRef(0);
  const lastY    = useRef(0);
  const didClose = useRef(false);

  // ── Open / close lifecycle ──
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

  // ── Measure true content height (rendered off-screen) ──
  useLayoutEffect(() => {
    if (phase !== 'measure') return;
    if (!innerRef.current) return;

    const vh    = window.innerHeight;
    const maxPx = toPx(maxHeight, vh);
    const h     = Math.min(innerRef.current.scrollHeight, maxPx);
    setContentH(h);

    // Snap to card size (closed look) with no transition
    setPhase('closed');
    // Then animate open
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase('open'))
    );
  }, [phase, maxHeight]);

  // ── Unmount after close animation ──
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== 'height') return;
    if (phase === 'closing' && !didClose.current) {
      didClose.current = true;
      setPhase('out');
      setDragY(0);
    }
  }, [phase]);

  // ── Swipe down to close ──
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
    if (dy > CLOSE_DRAG_PX || vel > CLOSE_VEL) onClose();
    else setDragY(0);
  }, [onClose]);

  if (phase === 'out' || !triggerRect) return null;

  const vh    = window.innerHeight;
  const maxPx = toPx(maxHeight, vh);

  // ── Anchor: always at card position ──
  const panelTop   = triggerRect.top;
  const panelLeft  = triggerRect.left;
  const panelWidth = triggerRect.width;

  // ── Height: card height when closed, content height when open ──
  const closedH = triggerRect.height;
  const openH   = contentH > 0 ? contentH : maxPx;

  let height:   number | string;
  let overflow: string;

  switch (phase) {
    case 'measure':
      height   = 'auto';
      overflow = 'visible';
      break;
    case 'closed':
    case 'closing':
      height   = closedH;
      overflow = 'hidden';
      break;
    default: // 'open'
      height   = openH + dragY;
      overflow = 'hidden';
  }

  const isOpen = phase === 'open';

  // Height-only animation — no position change
  const transition =
    (phase === 'measure' || phase === 'closed' || dragging)
      ? 'none'
      : isOpen
        ? 'height 320ms cubic-bezier(0.34,1.2,0.64,1), border-radius 320ms ease'
        : 'height 220ms ease-in, border-radius 220ms ease';

  const borderRadius = isOpen ? '12px' : '12px';
  const opacity      = phase === 'measure' ? 0 : 1;
  const backdropOpacity = isOpen ? Math.max(0, 1 - dragY / 160) : 0;

  return (
    <>
      {/* Dim backdrop — tap to close */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: backdropOpacity,
          transition: dragging ? 'none' : 'opacity 280ms ease',
          pointerEvents: isOpen && dragY < 10 ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — anchored to card, expands downward */}
      <div
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white shadow-2xl', className].join(' ')}
        style={{
          top:    panelTop,
          left:   panelLeft,
          width:  panelWidth,
          height,
          overflow,
          borderRadius,
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
        {/* Inner div — measured for content height */}
        <div ref={innerRef} className="flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}

export default OriginDrawer;
