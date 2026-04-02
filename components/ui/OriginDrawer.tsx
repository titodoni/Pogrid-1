'use client';

/**
 * OriginDrawer — true FLIP animation.
 *
 * FIRST  : panel renders at exact triggerRect (top, left, width, height)
 * LAST   : final layout = fixed bottom-0, full width, maxHeight
 * INVERT : compute translate+scale from FIRST → LAST
 * PLAY   : remove the invert transform, CSS transition does the work
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string; // default '70vh'
  className?: string;
}

type Phase = 'unmounted' | 'first' | 'play' | 'closing';

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '70vh',
  className = '',
}: OriginDrawerProps) {
  const [phase, setPhase] = useState<Phase>('unmounted');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setPhase('first');  // render panel at card position
    } else {
      if (phase === 'play') {
        setPhase('closing');
        setTimeout(() => setPhase('unmounted'), 280);
      } else {
        setPhase('unmounted');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // After 'first' paint, kick to 'play' in next frame
  useLayoutEffect(() => {
    if (phase === 'first') {
      const id = requestAnimationFrame(() => setPhase('play'));
      return () => cancelAnimationFrame(id);
    }
  }, [phase]);

  if (phase === 'unmounted' || !triggerRect) return null;

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 400;

  // ── LAST position: full-width bottom sheet ──────────────────────────────
  const maxHeightPx = maxHeight.endsWith('vh')
    ? (parseFloat(maxHeight) / 100) * vh
    : parseFloat(maxHeight);

  const finalW = vw;
  const finalH = maxHeightPx;
  const finalX = 0;                    // left edge
  const finalY = vh - finalH;          // top edge of panel

  // ── FIRST position: matches triggerRect exactly ─────────────────────────
  const firstX = triggerRect.left;
  const firstY = triggerRect.top;
  const firstW = triggerRect.width;
  const firstH = triggerRect.height;

  // ── INVERT transform: how to move LAST → FIRST ─────────────────────────
  //   panel renders at LAST dimensions; we invert it to FIRST via transform
  const invertTX    = firstX + firstW / 2 - (finalX + finalW / 2);  // centre-to-centre
  const invertTY    = firstY + firstH / 2 - (finalY + finalH / 2);
  const invertScaleX = firstW / finalW;
  const invertScaleY = firstH / finalH;

  const invertTransform =
    `translate(${invertTX.toFixed(2)}px, ${invertTY.toFixed(2)}px)` +
    ` scale(${invertScaleX.toFixed(4)}, ${invertScaleY.toFixed(4)})`;

  const isFirst   = phase === 'first';
  const isClosing = phase === 'closing';
  const isPlay    = phase === 'play';

  // During FIRST and CLOSING, apply invert; during PLAY, identity
  const panelTransform  = (isFirst || isClosing) ? invertTransform : 'translate(0,0) scale(1,1)';
  const panelOpacity    = (isFirst || isClosing) ? 0.5 : 1;
  const overlayOpacity  = isPlay ? 1 : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        style={{
          opacity: overlayOpacity,
          transition: 'opacity 280ms ease',
          pointerEvents: isPlay ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — always sized to LAST (final) dimensions */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={[
          'fixed z-50 bg-white rounded-2xl shadow-xl',
          'flex flex-col overflow-hidden',
          className,
        ].join(' ')}
        style={{
          // LAST geometry
          left:   finalX,
          top:    finalY,
          width:  finalW,
          height: finalH,
          // FLIP transform
          transform:      panelTransform,
          transformOrigin: 'center center',
          opacity:   panelOpacity,
          transition: isFirst
            ? 'none'   // no transition on first frame — snap to card
            : 'transform 320ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 240ms ease',
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </div>
    </>
  );
}

export default OriginDrawer;
