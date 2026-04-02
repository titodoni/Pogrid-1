'use client';

/**
 * OriginDrawer — card-origin bottom sheet.
 *
 * Key insight: CSS cannot animate to/from `auto` values.
 * Solution: keep ALL geometry in pixels always.
 *
 * origin  → top=card.top,  left=card.left,  width=card.width,  height=card.height
 * expanded→ top=vh-panelH, left=0,           width=vw,          height=panelH
 *
 * panelH is measured after the panel is rendered at full size (opacity:0)
 * before the origin snap happens.
 */

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;  // default '88vh'
  className?: string;
}

const CLOSE_DRAG_PX = 80;
const CLOSE_VEL     = 0.4;

type Phase =
  | 'out'       // not in DOM
  | 'measure'   // in DOM at expanded size, invisible — measure height
  | 'origin'    // snapped to card rect, no transition
  | 'expanded'  // animating/resting at final position
  | 'closing';  // animating back to card

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '88vh',
  className = '',
}: OriginDrawerProps) {
  const [phase,    setPhase]    = useState<Phase>('out');
  const [panelH,   setPanelH]   = useState(0);   // measured pixel height
  const [dragY,    setDragY]    = useState(0);
  const [dragging, setDragging] = useState(false);

  const sheetRef  = useRef<HTMLDivElement>(null);
  const startY    = useRef(0);
  const startT    = useRef(0);
  const lastY     = useRef(0);
  const didClose  = useRef(false);

  // ── Open: measure → origin → expanded ──
  useEffect(() => {
    if (open && triggerRect) {
      didClose.current = false;
      setDragY(0);
      setPhase('measure');  // render invisible at full size to get height
    } else if (!open) {
      setPhase('closing');  // animate back to card
    }
  }, [open, triggerRect]);

  // After 'measure' paint: read actual height, snap to origin, then expand
  useLayoutEffect(() => {
    if (phase !== 'measure') return;
    if (!sheetRef.current || !triggerRect) return;

    const rect = sheetRef.current.getBoundingClientRect();
    const h = rect.height;
    setPanelH(h);

    // Snap to card (no transition)
    setPhase('origin');
    // Next two frames: expand with transition
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase('expanded'))
    );
  }, [phase, triggerRect]);

  // Unmount after closing animation via transitionend
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== 'top') return;
    if ((phase === 'closing') && !didClose.current) {
      didClose.current = true;
      setPhase('out');
      setDragY(0);
    }
  }, [phase]);

  // ── Touch handlers ──
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
    if (dy > CLOSE_DRAG_PX || vel > CLOSE_VEL) {
      onClose();
    } else {
      setDragY(0);
    }
  }, [onClose]);

  if (phase === 'out' || !triggerRect) return null;

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  // Compute max panel height in px
  let maxHeightPx: number;
  if (maxHeight.endsWith('vh'))      maxHeightPx = (parseFloat(maxHeight) / 100) * vh;
  else if (maxHeight.endsWith('px')) maxHeightPx = parseFloat(maxHeight);
  else                               maxHeightPx = vh * 0.88;

  // Expanded geometry (all pixels)
  const expandedH    = panelH > 0 ? Math.min(panelH, maxHeightPx) : maxHeightPx;
  const expandedTop  = vh - expandedH;
  const expandedLeft = 0;
  const expandedW    = vw;

  // Current geometry based on phase
  const isMeasure  = phase === 'measure';
  const isOrigin   = phase === 'origin';
  const isExpanded = phase === 'expanded';
  const isClosing  = phase === 'closing';

  let top:    number;
  let left:   number;
  let width:  number;
  let height: number;

  if (isMeasure) {
    // Full size, invisible — for measurement
    top    = expandedTop;
    left   = expandedLeft;
    width  = expandedW;
    height = expandedH;
  } else if (isOrigin || isClosing) {
    // At card position
    top    = triggerRect.top;
    left   = triggerRect.left;
    width  = triggerRect.width;
    height = triggerRect.height;
  } else {
    // Expanded (+ drag offset via transform)
    top    = expandedTop;
    left   = expandedLeft;
    width  = expandedW;
    height = expandedH;
  }

  const borderRadius = (isExpanded || isMeasure) ? '20px 20px 0 0' : '12px';

  // Only transform for drag — no top/height change during drag
  const transform = (isExpanded && dragY > 0)
    ? `translateY(${dragY}px)`
    : 'translateY(0px)';

  const transition = (isOrigin || isMeasure || dragging)
    ? 'none'
    : isExpanded
      ? 'top 340ms cubic-bezier(0.34,1.28,0.64,1), left 340ms cubic-bezier(0.34,1.28,0.64,1), width 340ms cubic-bezier(0.34,1.28,0.64,1), height 340ms cubic-bezier(0.34,1.28,0.64,1), border-radius 340ms ease, transform 260ms ease-out'
      : 'top 260ms ease-in, left 260ms ease-in, width 260ms ease-in, height 260ms ease-in, border-radius 260ms ease';

  const opacity = isMeasure ? 0 : 1;
  const backdropOpacity = (isExpanded || isClosing)
    ? Math.max(0, 1 - dragY / 200)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: isExpanded ? backdropOpacity : 0,
          transition: dragging ? 'none' : 'opacity 300ms ease',
          pointerEvents: isExpanded && dragY < 10 ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet — all pixel geometry, no auto values */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white shadow-xl overflow-hidden flex flex-col', className].join(' ')}
        style={{
          top,
          left,
          width,
          height,
          borderRadius,
          opacity,
          transform,
          transition,
          willChange: 'top, left, width, height, transform',
          touchAction: 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Drag handle */}
        {isExpanded && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
            <div className="w-10 h-[5px] rounded-full bg-[#E5E7EB]" />
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {isExpanded && (
          <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        )}
      </div>
    </>
  );
}

export default OriginDrawer;
