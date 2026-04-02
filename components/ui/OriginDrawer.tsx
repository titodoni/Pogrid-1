'use client';

/**
 * OriginDrawer — card-origin bottom sheet.
 *
 * All geometry is pixels (no `auto` in transitions).
 *
 * measure  : width=vw, height=auto, overflow=visible → read scrollHeight
 * origin   : snap to card rect (no transition)
 * expanded : animate to vh-contentH, left=0, width=vw, height=contentH
 * closing  : animate back to card rect
 * out      : unmounted
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

  useEffect(() => {
    if (open && triggerRect) {
      didClose.current = false;
      setDragY(0);
      setPhase('measure');
    } else if (!open) {
      setPhase('closing');
    }
  }, [open, triggerRect]);

  useLayoutEffect(() => {
    if (phase !== 'measure') return;
    if (!sheetRef.current || !triggerRect) return;

    const vh = window.innerHeight;
    let maxPx: number;
    if (maxHeight.endsWith('vh'))      maxPx = (parseFloat(maxHeight) / 100) * vh;
    else if (maxHeight.endsWith('px')) maxPx = parseFloat(maxHeight);
    else                               maxPx = vh * 0.88;

    // scrollHeight gives true content height because height=auto during measure
    const contentH = sheetRef.current.scrollHeight;
    const clampedH = Math.min(contentH, maxPx);
    setPanelH(clampedH);

    setPhase('origin');
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase('expanded'))
    );
  }, [phase, triggerRect, maxHeight]);

  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== 'top') return;
    if (phase === 'closing' && !didClose.current) {
      didClose.current = true;
      setPhase('out');
      setDragY(0);
    }
  }, [phase]);

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

  const vh = window.innerHeight;
  const vw = window.innerWidth;

  let maxPx: number;
  if (maxHeight.endsWith('vh'))      maxPx = (parseFloat(maxHeight) / 100) * vh;
  else if (maxHeight.endsWith('px')) maxPx = parseFloat(maxHeight);
  else                               maxPx = vh * 0.88;

  const expandedH   = panelH > 0 ? panelH : maxPx;
  const expandedTop = vh - expandedH;

  const isMeasure  = phase === 'measure';
  const isOrigin   = phase === 'origin';
  const isExpanded = phase === 'expanded';
  const isClosing  = phase === 'closing';

  // Geometry — all pixels
  let top:    number | string;
  let left:   number;
  let width:  number | string;
  let height: number | string;
  let overflow: string;

  if (isMeasure) {
    // Render at full viewport width, height=auto so content flows freely
    top      = expandedTop;
    left     = 0;
    width    = vw;
    height   = 'auto';     // <— key: lets scrollHeight reflect true content
    overflow = 'visible';  // <— no clipping during measure
  } else if (isOrigin || isClosing) {
    top      = triggerRect.top;
    left     = triggerRect.left;
    width    = triggerRect.width;
    height   = triggerRect.height;
    overflow = 'hidden';
  } else {
    top      = expandedTop;
    left     = 0;
    width    = vw;
    height   = expandedH;  // <— measured content height, clamped
    overflow = 'hidden';
  }

  const borderRadius = (isExpanded || isMeasure) ? '20px 20px 0 0' : '12px';
  const transform    = (isExpanded && dragY > 0) ? `translateY(${dragY}px)` : 'translateY(0px)';
  const opacity      = isMeasure ? 0 : 1;

  const transition = (isMeasure || isOrigin || dragging)
    ? 'none'
    : isExpanded
      ? 'top 340ms cubic-bezier(0.34,1.28,0.64,1), left 340ms cubic-bezier(0.34,1.28,0.64,1), width 340ms cubic-bezier(0.34,1.28,0.64,1), height 340ms cubic-bezier(0.34,1.28,0.64,1), border-radius 340ms ease, transform 260ms ease-out'
      : 'top 260ms ease-in, left 260ms ease-in, width 260ms ease-in, height 260ms ease-in, border-radius 260ms ease';

  const backdropOpacity = (isExpanded || isClosing)
    ? Math.max(0, 1 - dragY / 200)
    : 0;

  return (
    <>
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

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white shadow-xl flex flex-col', className].join(' ')}
        style={{
          top, left, width, height,
          overflow,
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

        {/* Content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* iOS safe area */}
        {isExpanded && (
          <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        )}
      </div>
    </>
  );
}

export default OriginDrawer;
