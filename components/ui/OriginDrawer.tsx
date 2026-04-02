'use client';

/**
 * BottomSheet / OriginDrawer
 *
 * Lifecycle rules:
 *  - mounted  = open (single source of truth)
 *  - unmount via transitionend (no setTimeout ghost state)
 *  - swipe-down to close (gesture-driven, follows finger)
 *  - tap backdrop to close
 *  - spring open, fast ease-in close
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect?: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

const CLOSE_DRAG_PX  = 80;    // drag distance to trigger close
const CLOSE_VEL      = 0.45;  // px/ms velocity threshold

export function OriginDrawer({
  open,
  onClose,
  children,
  maxHeight = '88vh',
  className = '',
}: OriginDrawerProps) {
  // `inDom`  : whether the sheet node exists in the DOM
  // `visible`: drives translateY(0) — toggling this starts the CSS transition
  const [inDom,   setInDom]   = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragY,   setDragY]   = useState(0);
  const [dragging,setDragging]= useState(false);

  const sheetRef   = useRef<HTMLDivElement>(null);
  const startY     = useRef(0);
  const startT     = useRef(0);
  const lastY      = useRef(0);
  // prevent double-fire from transitionend (multiple properties animate)
  const unmounting = useRef(false);

  // ── OPEN: mount then animate in ──
  useEffect(() => {
    if (open) {
      unmounting.current = false;
      setInDom(true);
      setDragY(0);
      // Paint off-screen first, then set visible to trigger transition
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    } else {
      // Animate out; sheet removes itself via transitionend
      setVisible(false);
      setDragY(0);
    }
  }, [open]);

  // ── transitionend → unmount (no setTimeout, no ghost state) ──
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    // Only act on the transform property finishing on the outer sheet div
    if (e.propertyName !== 'transform') return;
    if (!open && !unmounting.current) {
      unmounting.current = true;
      setInDom(false);
    }
  }, [open]);

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
    setDragY(dy > 0 ? dy : 0);
  }, []);

  const onTouchEnd = useCallback(() => {
    setDragging(false);
    const dy  = lastY.current - startY.current;
    const vel = dy / (performance.now() - startT.current);
    if (dy > CLOSE_DRAG_PX || vel > CLOSE_VEL) {
      onClose();
    } else {
      setDragY(0);
    }
  }, [onClose]);

  if (!inDom) return null;

  const ty = visible ? dragY : '100%';
  const sheetTransform  = `translateY(${typeof ty === 'number' ? ty + 'px' : ty})`;
  const sheetTransition = dragging
    ? 'none'
    : visible
      ? 'transform 360ms cubic-bezier(0.34, 1.28, 0.64, 1)'  // spring open
      : 'transform 260ms cubic-bezier(0.4, 0, 1, 1)';          // fast close

  const backdropOpacity = visible
    ? Math.max(0, 1 - dragY / 240)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropOpacity,
          transition: dragging ? 'none' : 'opacity 280ms ease',
          pointerEvents: visible && dragY < 10 ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet outer — transform target */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={['fixed bottom-0 left-0 right-0 z-50', className].join(' ')}
        style={{
          transform:  sheetTransform,
          transition: sheetTransition,
          willChange: 'transform',
          touchAction: 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Sheet inner — chrome + layout */}
        <div
          className="bg-white flex flex-col overflow-hidden"
          style={{
            borderRadius: '20px 20px 0 0',
            maxHeight,
            boxShadow: '0 -2px 24px rgba(0,0,0,0.10)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
            <div className="w-10 h-[5px] rounded-full bg-[#E5E7EB]" />
          </div>

          {/* Scrollable content */}
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {children}
          </div>

          {/* iOS safe-area bottom */}
          <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      </div>
    </>
  );
}

export default OriginDrawer;
