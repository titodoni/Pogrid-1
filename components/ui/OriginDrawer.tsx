'use client';

/**
 * OriginDrawer — reusable origin-based drawer pattern.
 *
 * Captures the DOMRect of the trigger element and animates from that
 * position into a full bottom-sheet (mobile) or floating panel (desktop).
 *
 * Usage:
 *   const [rect, setRect] = useState<DOMRect | null>(null)
 *   const [open, setOpen] = useState(false)
 *
 *   <button ref={el => el && setRect(el.getBoundingClientRect())} onClick={() => setOpen(true)}>
 *     Open
 *   </button>
 *
 *   <OriginDrawer open={open} triggerRect={rect} onClose={() => setOpen(false)}>
 *     {children}
 *   </OriginDrawer>
 */

import React, { useEffect, useRef, useState } from 'react';

interface OriginDrawerProps {
  open: boolean;
  triggerRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
  /** Max height of the expanded sheet (default: 70vh) */
  maxHeight?: string;
  className?: string;
}

/**
 * Compute the CSS transform that places the drawer panel
 * at the same visual origin as the trigger element, then
 * transitions it to its natural (full) position.
 *
 * Strategy:
 *   1. The drawer panel is fixed at the bottom of the viewport.
 *   2. In the CLOSED (origin) state, we apply a translateY so the
 *      panel appears to sit at the vertical centre of the trigger rect,
 *      combined with a scale-down that shrinks it to the trigger's width.
 *   3. In the OPEN state, transform is reset to identity.
 */
function computeOriginTransform(
  triggerRect: DOMRect,
  panelRef: React.RefObject<HTMLDivElement>,
): { translateY: number; scaleX: number; scaleY: number } {
  const panel = panelRef.current;
  if (!panel) return { translateY: 0, scaleX: 1, scaleY: 1 };

  const panelRect = panel.getBoundingClientRect();
  const viewportH = window.innerHeight;

  // Trigger vertical centre relative to viewport
  const triggerCentreY = triggerRect.top + triggerRect.height / 2;

  // Panel currently sits at the bottom; its top edge:
  const panelTopY = viewportH - panelRect.height;

  // How far up we need to push the panel so its centre aligns with trigger centre
  const panelCentreY = panelTopY + panelRect.height / 2;
  const translateY   = triggerCentreY - panelCentreY;

  // Scale to match trigger card dimensions
  const scaleX = Math.min(1, triggerRect.width  / panelRect.width);
  const scaleY = Math.min(1, triggerRect.height / panelRect.height);

  return { translateY, scaleX, scaleY };
}

export function OriginDrawer({
  open,
  triggerRect,
  onClose,
  children,
  maxHeight = '70vh',
  className = '',
}: OriginDrawerProps) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const [mounted, setMounted]   = useState(false); // after first paint
  const [visible, setVisible]   = useState(false); // controls opacity overlay
  const [expanded, setExpanded] = useState(false); // controls panel transform

  // Phase 1: mount invisible panel
  useEffect(() => {
    if (open) {
      setMounted(true);
      // Wait one frame for panel to paint so we can measure it
      const raf = requestAnimationFrame(() => {
        setVisible(true);
        // Then expand in next frame
        requestAnimationFrame(() => setExpanded(true));
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // Collapse then unmount
      setExpanded(false);
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  // Compute origin transform (closed state)
  let originTransform = 'translateY(100%)';
  if (triggerRect && panelRef.current && visible) {
    const { translateY, scaleX, scaleY } = computeOriginTransform(triggerRect, panelRef);
    originTransform = `translateY(calc(100% + ${translateY}px)) scaleX(${scaleX.toFixed(4)}) scaleY(${scaleY.toFixed(4)})`;
  }

  const panelTransform = expanded ? 'translateY(0) scaleX(1) scaleY(1)' : originTransform;

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        style={{ opacity: expanded ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        style={{
          transform: panelTransform,
          transition: expanded
            ? 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)'
            : 'transform 250ms ease-in',
          transformOrigin: 'bottom center',
          maxHeight,
          willChange: 'transform',
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
