'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import useUIStore from '@/store/uiStore';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProfileAvatar } from '@/components/layout/ProfileAvatar';
import { computeAnalytics, type AnalyticsPeriod } from '@/lib/analyticsUtils';

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: '1M',  value: '1m' },
  { label: '3M',  value: '3m' },
  { label: '6M',  value: '6m' },
  { label: '12M', value: '12m' },
];

// ── Mini horizontal bar ─────────────────────────────────────────────────────
function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="text-[11px] text-[#6B7280] w-6 text-right">{value}</span>
    </div>
  );
}

// ── Delta chip ──────────────────────────────────────────────────────────────
function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-[11px] text-[#9CA3AF]">—</span>;
  const up = value > 0;
  return (
    <span className={`text-[11px] font-medium ${up ? 'text-[#437A3B]' : 'text-[#B33941]'}`}>
      {up ? '▲' : '▼'} {Math.abs(value)}
    </span>
  );
}

// ── Pie-like ring chart (pure CSS) ──────────────────────────────────────────
function RingChart({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1A1A2E">
          {pct}%
        </text>
      </svg>
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const hasHydrated = useUIStore(s => s._hasHydrated);
  const session     = useUIStore(s => s.session);
  const [period, setPeriod] = useState<AnalyticsPeriod>('1m');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || !session.isLoggedIn) { window.location.href = '/select-dept'; return; }
    if (session.role === 'worker') { window.location.href = '/jobs'; return; }
    if (!['manager', 'admin', 'sales', 'finance'].includes(session.role)) {
      window.location.href = '/';
    }
  }, [hasHydrated, session]);

  const analytics = useMemo(() => computeAnalytics(period), [period]);

  if (!hasHydrated || !session || !session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#2A7B76] border-t-transparent animate-spin" />
      </div>
    );
  }

  const {
    totalPOs, onTimeRate, avgCompletionDays, totalRW, totalReturns,
    deltas, onTimeCount, lateCount,
    bottleneck, deptDwell,
    clientRows,
    rwByDept,
    returnRate,
    hasData,
  } = analytics;

  const maxDwell  = Math.max(...deptDwell.map(d => d.avgDays), 1);
  const maxRWDept = Math.max(...rwByDept.map(d => d.count), 1);
  const maxClient = Math.max(...clientRows.map(c => c.poCount), 1);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="sticky top-0 z-30 bg-[#F8F9FA]">
        <StickyHeader
          title="Analytics"
          leftSlot={<ProfileAvatar name={session.name} />}
        />

        {/* PERIOD SELECTOR */}
        <div className="px-4 py-2 flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-4 h-7 text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-[#1A1A2E] text-white'
                  : 'bg-white text-[#6B7280] border border-[#E5E7EB]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 pb-28 flex flex-col gap-4">

        {!hasData && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 flex flex-col items-center gap-2">
            <p className="text-[28px]">📊</p>
            <p className="text-[13px] text-[#9CA3AF] text-center">Belum ada data untuk periode ini</p>
          </div>
        )}

        {/* KPI ROW */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total POs',          value: String(totalPOs),         delta: deltas.totalPOs,    unit: '' },
            { label: 'On-Time Rate',        value: onTimeRate + '%',          delta: deltas.onTimeRate,  unit: '' },
            { label: 'Avg Selesai',         value: avgCompletionDays + 'h',  delta: deltas.avgDays,     unit: '' },
            { label: 'Total RW',            value: String(totalRW),           delta: deltas.totalRW,     unit: '' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border border-[#E5E7EB] p-3">
              <p className="text-[10px] text-[#9CA3AF]">{kpi.label}</p>
              <p className="text-[22px] font-bold text-[#1A1A2E] leading-tight">{kpi.value}</p>
              <Delta value={kpi.delta} />
            </div>
          ))}
        </div>

        {/* ON-TIME vs LATE */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-[13px] font-semibold text-[#1A1A2E] mb-3">On-Time vs Terlambat</p>
          <div className="flex justify-center gap-6 mb-3">
            <RingChart pct={onTimeRate} color="#2A7B76" label="On-Time" />
            <RingChart pct={100 - onTimeRate} color="#B33941" label="Terlambat" />
          </div>
          <div className="flex justify-between text-[11px] text-[#6B7280] px-2">
            <span>✅ {onTimeCount} on-time</span>
            <span>❌ {lateCount} terlambat</span>
          </div>
        </div>

        {/* BOTTLENECK */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[13px] font-semibold text-[#1A1A2E]">Bottleneck Department</p>
            {bottleneck && (
              <span className="bg-[#FEF2F2] text-[#B33941] text-[10px] px-2 h-5 rounded-full flex items-center">
                {bottleneck}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {deptDwell.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF]">Tidak ada data dwell time</p>
            ) : (
              deptDwell.map(d => (
                <div key={d.dept}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#6B7280]">{d.dept}</span>
                    <span className="text-[11px] font-medium text-[#1A1A2E]">{d.avgDays}d avg</span>
                  </div>
                  <HBar value={d.avgDays} max={maxDwell} color={d.dept === bottleneck ? '#B33941' : '#2A7B76'} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* PER-CLIENT */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-[13px] font-semibold text-[#1A1A2E] mb-3">Per-Client Performance</p>
          {clientRows.length === 0 ? (
            <p className="text-[12px] text-[#9CA3AF]">Tidak ada data klien</p>
          ) : (
            <div className="flex flex-col gap-3">
              {clientRows.map(c => (
                <div key={c.clientName}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-medium text-[#1A1A2E]">{c.clientName}</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-[#2A7B76]">{c.onTimePct}% on-time</span>
                      {c.rwCount > 0 && <span className="text-[10px] text-[#DE8F26]">RW:{c.rwCount}</span>}
                      {c.returnCount > 0 && <span className="text-[10px] text-[#B33941]">Ret:{c.returnCount}</span>}
                    </div>
                  </div>
                  <HBar value={c.poCount} max={maxClient} color="#2A7B76" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RW RATE BY DEPT */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-[13px] font-semibold text-[#1A1A2E] mb-3">RW Rate per Department</p>
          {rwByDept.length === 0 ? (
            <p className="text-[12px] text-[#9CA3AF]">Tidak ada rework</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rwByDept.map(d => (
                <div key={d.dept}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-[#6B7280]">{d.dept}</span>
                    <span className="text-[11px] font-medium text-[#1A1A2E]">{d.count} RW</span>
                  </div>
                  <HBar value={d.count} max={maxRWDept} color="#DE8F26" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RETURN RATE */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <p className="text-[13px] font-semibold text-[#1A1A2E] mb-1">Return Rate</p>
          <p className="text-[28px] font-bold text-[#B33941]">{returnRate}%</p>
          <p className="text-[11px] text-[#9CA3AF]">{totalReturns} return dari total item selesai</p>
        </div>

      </div>

      <BottomNav role={session.role} department={session.department} />
    </div>
  );
}
