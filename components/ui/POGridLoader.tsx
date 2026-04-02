'use client';

/**
 * POGridLoader — animated logo loader
 *
 * Usage examples:
 * // Page-level loading:    <POGridLoaderOverlay />
 * // Inline small loader:   <POGridLoader size="sm" showWordmark={false} />
 * // Full centered loader:  <POGridLoader size="lg" />
 */

import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface POGridLoaderProps {
  size?: 'sm' | 'md' | 'lg';   // default: 'md'
  showWordmark?: boolean;        // default: true
  className?: string;
}

// ─── Tile color map (row-major, 9 tiles) ─────────────────────────────────────
//   Row 1: [teal, teal, amber]
//   Row 2: [teal, red,  amber]
//   Row 3: [teal, teal, teal ]

const TILE_COLORS: string[] = [
  '#2A7B76', '#2A7B76', '#DE8F26',
  '#2A7B76', '#B33941', '#DE8F26',
  '#2A7B76', '#2A7B76', '#2A7B76',
];

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { tile: 32, gap: 4,  padding: 8,  wordmark: 16 },
  md: { tile: 52, gap: 6,  padding: 10, wordmark: 22 },
  lg: { tile: 72, gap: 8,  padding: 14, wordmark: 28 },
} as const;

// ─── Keyframe injection (once per document) ───────────────────────────────────

const KEYFRAME_ID = 'pogrid-tilepulse';
const KEYFRAME_CSS = `
@keyframes tilepulse {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%       { opacity: 1;    transform: scale(1.08); }
}
`;

function injectKeyframe() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAME_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAME_ID;
  style.textContent = KEYFRAME_CSS;
  document.head.appendChild(style);
}

// ─── POGridLoader ─────────────────────────────────────────────────────────────

export function POGridLoader({
  size = 'md',
  showWordmark = true,
  className = '',
}: POGridLoaderProps) {
  // Inject keyframe CSS on first render (client-only)
  React.useEffect(() => { injectKeyframe(); }, []);

  const cfg = SIZE_CONFIG[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>

      {/* 3×3 Grid inside navy frame */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: cfg.gap,
          padding: cfg.padding,
          backgroundColor: '#1D3B4D',
          borderRadius: 16,
        }}
      >
        {TILE_COLORS.map((color, i) => (
          <div
            key={i}
            style={{
              width: cfg.tile,
              height: cfg.tile,
              borderRadius: 10,
              backgroundColor: color,
              animation: `tilepulse 1.08s ease-in-out infinite`,
              animationDelay: `${i * 120}ms`,
              opacity: 0.35, // initial opacity before animation fires
            }}
          />
        ))}
      </div>

      {/* Wordmark + tagline */}
      {showWordmark && (
        <div className="flex flex-col items-center gap-1">
          {/* "POgrid.id" wordmark */}
          <p
            style={{ fontSize: cfg.wordmark, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.01em' }}
            className="font-sans"
          >
            <span style={{ color: '#1D3B4D' }}>PO</span>
            <span style={{ color: '#2A7B76' }}>grid.id</span>
          </p>

          {/* Tagline */}
          <p
            className="tracking-widest font-medium text-[#6B7280]"
            style={{ fontSize: 10 }}
          >
            MONITOR · CONTROL · DELIVER
          </p>
        </div>
      )}
    </div>
  );
}

// ─── POGridLoaderOverlay ──────────────────────────────────────────────────────

export function POGridLoaderOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <POGridLoader size="md" showWordmark={true} />
    </div>
  );
}

// Default export for convenience
export default POGridLoader;
