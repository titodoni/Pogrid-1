'use client';

/**
 * OriginDrawer — FLIP animation with content-driven height.
 *
 * The panel uses height:auto + max-height so it hugs content.
 * We measure its actual rendered size AFTER the first paint,
 * then compute the FLIP invert transform from real dimensions.
 *
 * FIRST  : panel renders at bottom (identity), transition:none, opacity:0
 *          → we measure its real rect here via useLayoutEffect
 * INVERT : apply translate+scale to move panel to triggerRect visually
 *          still transition:none — snap instantly to card position
 * PLAY   : remove transform → CSS transition carries it to final position
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  /** CSS max-height for the panel. Default: '90vh' */
  maxHeight?: string;
  className?: string;
}

type Phase =
  | 'unmounted'   // not in DOM
  | 'measure'     // in DOM at natural position, invisible — we read its size
  | 'first'       // transform snapped to card, still no transition
  | 'play'        // transform animating to identity
  | 'closing';    // transform animating back to card

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '90vh',
  className = '',
}: OriginDrawerProps) {
  const [phase, setPhase]         = useState<Phase>('unmounted');
  const [invertTx, setInvertTx]   = useState(0);
  const [invertTy, setInvertTy]   = useState(0);
  const [invertSx, setInvertSx]   = useState(1);
  const [invertSy, setInvertSy]   = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  // Open/close state driver
  useEffect(() => {
    if (open) {
      setPhase('measure');
    } else {
      setPhase((prev) => {
        if (prev === 'play' || prev === 'first') {
          setTimeout(() => setPhase('unmounted'), 280);
          return 'closing';
        }
        return 'unmounted';
      });
    }
  }, [open]);

  // After 'measure' paint: read real rect, compute invert, snap to 'first'
  useLayoutEffect(() => {
    if (phase !== 'measure') return;
    if (!panelRef.current || !triggerRect) return;

    const finalRect = panelRef.current.getBoundingClientRect();

    // centre-to-centre delta
    const tx = triggerRect.left + triggerRect.width  / 2 - (finalRect.left + finalRect.width  / 2);
    const ty = triggerRect.top  + triggerRect.height / 2 - (finalRect.top  + finalRect.height / 2);
    const sx = triggerRect.width  / finalRect.width;
    const sy = triggerRect.height / finalRect.height;

    setInvertTx(tx);
    setInvertTy(ty);
    setInvertSx(sx);
    setInvertSy(sy);

    // Snap to card (no transition) then immediately play
    setPhase('first');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('play'));
    });
  }, [phase, triggerRect]);

  if (phase === 'unmounted') return null;

  const isClosing = phase === 'closing';
  const isMeasure = phase === 'measure';
  const isFirst   = phase === 'first';
  const isPlay    = phase === 'play';

  const invertTransform =
    `translate(${invertTx.toFixed(2)}px, ${invertTy.toFixed(2)}px)` +
    ` scale(${invertSx.toFixed(4)}, ${invertSy.toFixed(4)})`;

  // measure  : identity transform, invisible (we read size here)
  // first    : invert transform, no transition (snap to card)
  // play     : identity transform, transition on (animate to final)
  // closing  : invert transform, transition on (animate back to card)
  const panelTransform = (isFirst || isClosing)
    ? invertTransform
    : 'translate(0px,0px) scale(1,1)';

  const hasTransition = isPlay || isClosing;

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        style={{
          opacity: isPlay ? 1 : 0,
          transition: 'opacity 280ms ease',
          pointerEvents: isPlay ? 'auto' : 'none',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/*
        Outer positioning wrapper — fixed bottom-0, full width.
        height: auto so it hugs content.
        max-height caps it and enables internal scroll.
      */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={['fixed bottom-0 left-0 right-0 z-50', className].join(' ')}
        style={{
          // Content-driven sizing
          height:    'auto',
          maxHeight,
          // FLIP transform
          transform:       panelTransform,
          transformOrigin: 'center center',
          // Visibility
          opacity: isMeasure ? 0 : 1,
          // Transition only on play + closing
          transition: hasTransition
            ? 'transform 320ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 240ms ease'
            : 'none',
          willChange: 'transform, opacity',
        }}
      >
        {/*
          Inner layout wrapper — owns the visual chrome + flex column.
          Separate from the transform wrapper so content is never distorted
          by scale during the animation.
        */}
        <div
          className="bg-white rounded-t-2xl shadow-xl flex flex-col overflow-hidden"
          style={{ maxHeight }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export default OriginDrawer;
