'use client';

/**
 * OriginDrawer — animates a bottom-sheet from the tapped card's position.
 *
 * Strategy: the panel is always `fixed bottom-0`. We set `transform-origin`
 * to the Y coordinate of the tapped card (expressed as a % of the panel
 * height from its bottom edge). Closed state = scaleY(0). Open = scaleY(1).
 * This makes the sheet appear to "grow" from the card outward.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string; // default '70vh'
  className?: string;
}

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '70vh',
  className = '',
}: OriginDrawerProps) {
  const [mounted,  setMounted]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Let browser paint the closed state first, then expand
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpanded(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setExpanded(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  /**
   * Compute transform-origin Y as a pixel offset from the panel's BOTTOM edge.
   * The panel is fixed-bottom, so its bottom = viewport bottom.
   * Card centre Y from viewport bottom = (vh - cardCentreY).
   * We express this as "Xpx from bottom" using "50% calc(100% - Ypx)" syntax.
   *
   * transform-origin: "50% YfromTop" where YfromTop is card centre Y.
   * Since the panel is bottom-anchored, card centre relative to panel top:
   *   panelTop ≈ vh - panelHeight
   *   originY  = cardCentreY - panelTop  (can be negative = above panel)
   * Clamped to [0, panelHeight] so origin stays inside panel.
   */
  let transformOriginY = '100%'; // default: grow from bottom

  if (triggerRect && typeof window !== 'undefined') {
    const vh = window.innerHeight;
    const maxHeightPx = maxHeight.endsWith('vh')
      ? (parseFloat(maxHeight) / 100) * vh
      : parseFloat(maxHeight);
    const panelHeight = Math.min(maxHeightPx, vh);
    const panelTop    = vh - panelHeight;
    const cardCentreY = triggerRect.top + triggerRect.height / 2;
    const originY     = Math.max(0, Math.min(panelHeight, cardCentreY - panelTop));
    transformOriginY  = `${originY.toFixed(1)}px`;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        style={{
          opacity: expanded ? 1 : 0,
          transition: 'opacity 280ms ease',
          pointerEvents: expanded ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={[
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white rounded-t-2xl shadow-xl',
          'flex flex-col overflow-hidden',
          className,
        ].join(' ')}
        style={{
          maxHeight,
          transformOrigin: `50% ${transformOriginY}`,
          transform: expanded ? 'scaleY(1)' : 'scaleY(0)',
          opacity: expanded ? 1 : 0,
          transition: expanded
            ? 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease'
            : 'transform 220ms ease-in, opacity 180ms ease',
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </div>
    </>
  );
}

export default OriginDrawer;
