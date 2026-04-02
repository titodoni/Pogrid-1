'use client';

/**
 * OriginDrawer
 *
 * Opens by growing FROM the tapped card into a full bottom sheet.
 *
 * Phase 1 (frame 0)  : sheet placed exactly over the card (top/left/width/height from triggerRect)
 * Phase 2 (frame 1+) : sheet transitions to fixed bottom-0, full-width, auto-height
 *
 * Closes by reversing: sheet shrinks back to card position, then unmounts via transitionend.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

const CLOSE_DRAG_PX = 80;
const CLOSE_VEL     = 0.45;

type Phase = 'out' | 'origin' | 'expanded';

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '88vh',
  className = '',
}: OriginDrawerProps) {
  const [phase,   setPhase]   = useState<Phase>('out');
  const [dragY,   setDragY]   = useState(0);
  const [dragging,setDragging]= useState(false);

  const sheetRef   = useRef<HTMLDivElement>(null);
  const startY     = useRef(0);
  const startT     = useRef(0);
  const lastY      = useRef(0);
  const closing    = useRef(false);

  // ── Lifecycle ──
  useEffect(() => {
    if (open && triggerRect) {
      closing.current = false;
      setDragY(0);
      setPhase('origin');   // paint at card position first
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase('expanded'))
      );
    } else if (!open) {
      setPhase('origin');   // animate back to card
      // transitionend will set 'out'
    }
  }, [open, triggerRect]);

  // ── Unmount after close animation ──
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== 'top' && e.propertyName !== 'height' && e.propertyName !== 'width') return;
    if (!open && !closing.current) {
      closing.current = true;
      setPhase('out');
      setDragY(0);
    }
  }, [open]);

  // ── Swipe to close ──
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

  const vw = window.innerWidth;

  // ── Geometry ──
  const isExpanded = phase === 'expanded';

  const top    = isExpanded ? 'auto'              : triggerRect.top;
  const left   = isExpanded ? 0                   : triggerRect.left;
  const bottom = isExpanded ? (dragY > 0 ? -dragY : 0) : 'auto';
  const width  = isExpanded ? vw                  : triggerRect.width;
  const height = isExpanded ? 'auto'              : triggerRect.height;
  const borderRadius = isExpanded ? '20px 20px 0 0' : '12px';
  const maxH   = isExpanded ? maxHeight            : `${triggerRect.height}px`;

  const transition = dragging
    ? 'none'
    : isExpanded
      ? [
          'top 340ms cubic-bezier(0.34,1.2,0.64,1)',
          'left 340ms cubic-bezier(0.34,1.2,0.64,1)',
          'width 340ms cubic-bezier(0.34,1.2,0.64,1)',
          'border-radius 340ms ease',
          'bottom 220ms ease',
        ].join(', ')
      : [
          'top 260ms ease-in',
          'left 260ms ease-in',
          'width 260ms ease-in',
          'border-radius 260ms ease',
        ].join(', ');

  const backdropOpacity = isExpanded ? Math.max(0, 1 - dragY / 240) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropOpacity,
          transition: dragging ? 'none' : 'opacity 300ms ease',
          pointerEvents: isExpanded && dragY < 10 ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={['fixed z-50 bg-white shadow-xl flex flex-col overflow-hidden', className].join(' ')}
        style={{
          top, left, bottom, width, height,
          borderRadius,
          maxHeight: maxH,
          transition,
          willChange: 'top, left, width, border-radius',
          touchAction: 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Drag handle — only when expanded */}
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
