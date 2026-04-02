'use client';

/**
 * OriginDrawer — card-origin bottom sheet.
 *
 * Phase flow:
 *   measure  → render OFF-SCREEN (top: vh+100) at full width, height:auto
 *              read scrollHeight → store as panelH
 *   origin   → SNAP (no transition) to card rect
 *   expanded → ANIMATE (spring) from card rect → bottom of screen
 *   closing  → ANIMATE (ease-in) back to card rect
 *   out      → unmount
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

const CLOSE_DRAG_PX = 80;
const CLOSE_VEL     = 0.4;

type Phase = 'out' | 'measure' | 'origin' | 'expanded' | 'closing';

function maxHeightToPx(maxHeight: string, vh: number): number {
  if (maxHeight.endsWith('vh'))  return (parseFloat(maxHeight) / 100) * vh;
  if (maxHeight.endsWith('px'))  return parseFloat(maxHeight);
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
  const [panelH,   setPanelH]   = useState(0);
  const [dragY,    setDragY]    = useState(0);
  const [dragging, setDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const startY   = useRef(0);
  const startT   = useRef(0);
  const lastY    = useRef(0);
  const didClose = useRef(false);

  // ── open/close triggers ──
  useEffect(() => {
    if (open && triggerRect) {
      didClose.current = false;
      setDragY(0);
      setPanelH(0);
      setPhase('measure');
    } else if (!open) {
      setPhase('closing');
    }
  }, [open, triggerRect]);

  // ── measure: read true content height ──
  useLayoutEffect(() => {
    if (phase !== 'measure') return;
    if (!sheetRef.current || !triggerRect) return;

    const vh    = window.innerHeight;
    const maxPx = maxHeightToPx(maxHeight, vh);
    // scrollHeight = true content height (sheet has height:auto, no overflow clip)
    const h = Math.min(sheetRef.current.scrollHeight, maxPx);
    setPanelH(h);

    // Snap to card — no transition
    setPhase('origin');
    // Two frames later: animate to expanded
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase('expanded'))
    );
  }, [phase, triggerRect, maxHeight]);

  // ── unmount after close animation ──
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== 'top') return;
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
    if (dy > CLOSE_DRAG_PX || vel > CLOSE_VEL) onClose();
    else setDragY(0);
  }, [onClose]);

  // ── bail if not mounted ──
  if (phase === 'out' || !triggerRect) return null;

  const vh    = window.innerHeight;
  const vw    = window.innerWidth;
  const maxPx = maxHeightToPx(maxHeight, vh);

  // Use measured height or fall back to maxPx until measurement is done
  const expandedH   = panelH > 0 ? panelH : maxPx;
  const expandedTop = vh - expandedH;

  // ── per-phase geometry (ALL pixels, no `auto` in animated props) ──
  let top:      number;
  let left:     number;
  let width:    number;
  let height:   number | string;
  let overflow: string;

  switch (phase) {
    case 'measure':
      // Completely off-screen below viewport so user never sees it
      top      = vh + 100;
      left     = 0;
      width    = vw;
      height   = 'auto';    // must be auto so scrollHeight = content height
      overflow = 'visible'; // no clip during measure
      break;

    case 'origin':
    case 'closing':
      // At the tapped card
      top      = triggerRect.top;
      left     = triggerRect.left;
      width    = triggerRect.width;
      height   = triggerRect.height;
      overflow = 'hidden';
      break;

    default: // 'expanded'
      top      = expandedTop;
      left     = 0;
      width    = vw;
      height   = expandedH;
      overflow = 'hidden';
  }

  const borderRadius =
    phase === 'expanded' ? '20px 20px 0 0' :
    phase === 'measure'  ? '20px 20px 0 0' :
    '12px';

  const transform = (phase === 'expanded' && dragY > 0)
    ? `translateY(${dragY}px)`
    : 'translateY(0px)';

  // No transition during measure (off-screen) or origin (instant snap)
  // Spring on expand, fast ease-in on close
  const transition =
    (phase === 'measure' || phase === 'origin' || dragging)
      ? 'none'
      : phase === 'expanded'
        ? 'top 360ms cubic-bezier(0.34,1.28,0.64,1), left 360ms cubic-bezier(0.34,1.28,0.64,1), width 360ms cubic-bezier(0.34,1.28,0.64,1), height 360ms cubic-bezier(0.34,1.28,0.64,1), border-radius 360ms ease, transform 240ms ease-out'
        : 'top 260ms ease-in, left 260ms ease-in, width 260ms ease-in, height 260ms ease-in, border-radius 260ms ease';

  const opacity          = phase === 'measure' ? 0 : 1;
  const backdropOpacity  = phase === 'expanded'
    ? Math.max(0, 1 - dragY / 200)
    : phase === 'closing' ? 0
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropOpacity,
          transition: dragging ? 'none' : 'opacity 300ms ease',
          pointerEvents: phase === 'expanded' && dragY < 10 ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white shadow-xl flex flex-col', className].join(' ')}
        style={{
          top, left, width, height, overflow,
          borderRadius, opacity, transform, transition,
          willChange: 'top, left, width, height, transform',
          touchAction: 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Drag handle — only when expanded */}
        {phase === 'expanded' && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
            <div className="w-10 h-[5px] rounded-full bg-[#E5E7EB]" />
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* iOS safe area */}
        {phase === 'expanded' && (
          <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        )}
      </div>
    </>
  );
}

export default OriginDrawer;
