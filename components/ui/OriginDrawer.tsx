'use client';

/**
 * OriginDrawer — origin-based drawer that animates FROM the tapped card.
 *
 * Usage:
 *   const [rect, setRect] = useState<DOMRect | null>(null)
 *   const [open, setOpen] = useState(false)
 *
 *   <button onClick={e => { setRect(e.currentTarget.getBoundingClientRect()); setOpen(true) }}>
 *     Open
 *   </button>
 *
 *   <OriginDrawer open={open} triggerRect={rect} onClose={() => setOpen(false)}>
 *     {children}
 *   </OriginDrawer>
 */

import React, { useEffect, useRef, useState } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  /** DOMRect of the element that was tapped — captured at tap time */
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  /** CSS max-height of the expanded sheet. Default: "70vh" */
  maxHeight?: string;
  className?: string;
}

/**
 * Build the CSS transform for the CLOSED (origin) state.
 *
 * The panel is `fixed bottom-0`, so in its natural position its bottom
 * edge is at viewport bottom. We need to:
 *   1. Scale it down to roughly the card's size.
 *   2. Translate it UP so it appears centred over the card.
 *
 * We estimate panel height from `maxHeight` (default 70% of viewport)
 * rather than measuring the DOM — this gives us the value BEFORE the
 * first paint, eliminating the two-RAF delay.
 */
function buildClosedTransform(triggerRect: DOMRect, maxHeightPx: number): string {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  const panelH = Math.min(maxHeightPx, vh * 0.95);
  const panelW = vw; // full width

  // Scale to match card
  const scaleX = Math.min(1, triggerRect.width  / panelW);
  const scaleY = Math.min(1, triggerRect.height / panelH);

  // Card centre Y (viewport-relative)
  const cardCY = triggerRect.top + triggerRect.height / 2;

  // Panel centre Y when sitting at bottom (no translateY applied)
  const panelCY = vh - panelH / 2;

  // translateY needed so panel centre aligns with card centre
  // (positive = move down, negative = move up)
  const ty = cardCY - panelCY;

  return `translateY(${ty.toFixed(1)}px) scaleX(${scaleX.toFixed(4)}) scaleY(${scaleY.toFixed(4)})`;
}

function parseMaxHeightPx(maxHeight: string): number {
  if (maxHeight.endsWith('vh')) {
    return (parseFloat(maxHeight) / 100) * window.innerHeight;
  }
  if (maxHeight.endsWith('px')) {
    return parseFloat(maxHeight);
  }
  // fallback
  return window.innerHeight * 0.7;
}

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '70vh',
  className = '',
}: OriginDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Two booleans let us separate mount/unmount from the expand animation
  const [mounted,  setMounted]  = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Single RAF — panel painted at closed transform, then immediately expand
      const id = requestAnimationFrame(() => setExpanded(true));
      return () => cancelAnimationFrame(id);
    } else {
      setExpanded(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  // Derive closed transform synchronously from known triggerRect
  const closedTransform =
    triggerRect && typeof window !== 'undefined'
      ? buildClosedTransform(triggerRect, parseMaxHeightPx(maxHeight))
      : 'translateY(100%)';

  const panelTransform = expanded
    ? 'translateY(0px) scaleX(1) scaleY(1)'
    : closedTransform;

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        style={{ opacity: expanded ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — starts at card position, expands to full sheet */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        style={{
          transform: panelTransform,
          transition: expanded
            ? 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease'
            : 'transform 220ms ease-in, opacity 150ms ease',
          transformOrigin: 'bottom center',
          maxHeight,
          willChange: 'transform, opacity',
          opacity: expanded ? 1 : 0.6,
        }}
        className={[
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white rounded-t-2xl shadow-xl',
          'flex flex-col overflow-hidden',
          className,
        ].join(' ')}
      >
        {children}
      </div>
    </>
  );
}

export default OriginDrawer;
