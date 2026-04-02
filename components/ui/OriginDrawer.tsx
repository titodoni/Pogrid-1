'use client';

/**
 * BottomSheet — native mobile bottom sheet.
 *
 * - Anchored to bottom, content-driven height, max 88vh
 * - Opens with spring overshoot (cubic-bezier)
 * - Swipe down to close (gesture-driven, follows finger)
 * - Tap outside closes
 * - Drag handle at top
 * - Header fixed, content scrollable
 *
 * Origin animation (optional): if triggerRect is provided,
 * the sheet slides up from the card's Y position instead of
 * from below the viewport — purely as an enhancement.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect?: DOMRect | null;  // optional origin hint
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;  // default '88vh'
  className?: string;
}

const DRAG_CLOSE_THRESHOLD = 80;   // px dragged down to trigger close
const DRAG_VELOCITY_THRESHOLD = 0.5; // px/ms — fast flick closes even if < threshold

export function OriginDrawer({
  open,
  onClose,
  children,
  maxHeight = '88vh',
  className = '',
}: OriginDrawerProps) {
  const [mounted,   setMounted]   = useState(false);
  const [visible,   setVisible]   = useState(false);  // drives translateY(0)
  const [dragY,     setDragY]     = useState(0);       // live finger offset
  const [isDragging,setIsDragging]= useState(false);

  const sheetRef    = useRef<HTMLDivElement>(null);
  const startY      = useRef(0);
  const startTime   = useRef(0);
  const lastY       = useRef(0);

  // ── Open / close lifecycle ──────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setMounted(true);
      setDragY(0);
      // One frame delay so the browser paints the off-screen start state first
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        setDragY(0);
      }, 340);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Touch handlers ──────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current    = e.touches[0].clientY;
    lastY.current     = e.touches[0].clientY;
    startTime.current = performance.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - startY.current;
    lastY.current = e.touches[0].clientY;
    if (dy > 0) {
      // Only resist downward drag (clamp upward to 0)
      setDragY(dy);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsDragging(false);
    const dy       = lastY.current - startY.current;
    const dt       = performance.now() - startTime.current;
    const velocity = dy / dt;  // px/ms

    if (dy > DRAG_CLOSE_THRESHOLD || velocity > DRAG_VELOCITY_THRESHOLD) {
      onClose();
    } else {
      // Snap back
      setDragY(0);
    }
  }, [onClose]);

  if (!mounted) return null;

  // Sheet transform: slide up from below on enter, follow finger on drag
  const translateY = visible ? dragY : '100%';
  const sheetTransform = `translateY(${
    typeof translateY === 'number' ? `${translateY}px` : translateY
  })`;

  // While dragging, no CSS transition (follows finger exactly)
  // While not dragging: spring on open, fast ease-in on close
  const sheetTransition = isDragging
    ? 'none'
    : visible
      ? 'transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1)'   // spring overshoot
      : 'transform 300ms cubic-bezier(0.4, 0, 1, 1)';          // fast close

  const backdropOpacity = visible && dragY < 40 ? 1 : visible ? 1 - dragY / 200 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0,0,0,0.45)',
          opacity: backdropOpacity,
          transition: isDragging ? 'none' : 'opacity 280ms ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet outer — FLIP/positioning wrapper */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className={['fixed bottom-0 left-0 right-0 z-50', className].join(' ')}
        style={{
          transform: sheetTransform,
          transition: sheetTransition,
          willChange: 'transform',
          touchAction: 'none',  // prevent browser scroll interference
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sheet inner — visual chrome */}
        <div
          className="bg-white flex flex-col overflow-hidden"
          style={{
            borderRadius: '20px 20px 0 0',
            maxHeight,
            boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Drag handle */}
          <div
            className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing"
            aria-hidden="true"
          >
            <div className="w-10 h-[5px] rounded-full bg-[#E5E7EB]" />
          </div>

          {/* Scrollable content area (children own header + list) */}
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {children}
          </div>

          {/* Safe-area bottom spacer */}
          <div className="flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      </div>
    </>
  );
}

export default OriginDrawer;
