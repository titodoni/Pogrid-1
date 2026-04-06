import { mockItems, mockPOs, mockReturnItems } from './mockData';

export type AnalyticsPeriod = '1m' | '3m' | '6m' | '12m';

const PERIOD_MONTHS: Record<AnalyticsPeriod, number> = {
  '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

function startOf(period: AnalyticsPeriod): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - PERIOD_MONTHS[period]);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function computeAnalytics(period: AnalyticsPeriod) {
  const since    = startOf(period);
  const sincePrev = startOf(period === '1m' ? '1m' : period === '3m' ? '3m' : period === '6m' ? '6m' : '12m');
  // previous period start = 2x back
  const prevSince = new Date(since.getTime() - (since.getTime() - sincePrev.getTime()));

  // ── items in period ─────────────────────────────────────────────────────
  const periodItems = mockItems.filter(i => new Date(i.createdAt) >= since);
  const prevItems   = mockItems.filter(i => {
    const d = new Date(i.createdAt);
    return d >= prevSince && d < since;
  });

  // ── POs in period ───────────────────────────────────────────────────────
  const periodPOIds = new Set(periodItems.map(i => i.poId));
  const periodPOs   = mockPOs.filter(p => periodPOIds.has(p.id));
  const prevPOIds   = new Set(prevItems.map(i => i.poId));
  const prevPOs     = mockPOs.filter(p => prevPOIds.has(p.id));

  const hasData = periodPOs.length > 0;

  // ── On-time ─────────────────────────────────────────────────────────────
  function isItemOnTime(item: typeof mockItems[number]): boolean {
    const po = mockPOs.find(p => p.id === item.poId);
    if (!po) return false;
    if (item.stage === 'DONE') {
      return new Date(item.updatedAt) <= new Date(po.deliveryDate);
    }
    return new Date() <= new Date(po.deliveryDate);
  }

  const onTimeItems   = periodItems.filter(isItemOnTime).length;
  const lateItems     = periodItems.length - onTimeItems;
  const onTimeRate    = periodItems.length === 0 ? 0 : Math.round((onTimeItems / periodItems.length) * 100);
  const prevOnTimeRate = prevItems.length === 0 ? 0 : Math.round(
    (prevItems.filter(isItemOnTime).length / prevItems.length) * 100
  );

  // ── Avg completion days ─────────────────────────────────────────────────
  const doneItems = periodItems.filter(i => i.stage === 'DONE');
  const avgHrs = doneItems.length === 0 ? 0 : Math.round(
    doneItems.reduce((acc, i) => {
      const hrs = (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / 3_600_000;
      return acc + hrs;
    }, 0) / doneItems.length
  );
  const prevDoneItems = prevItems.filter(i => i.stage === 'DONE');
  const prevAvgHrs = prevDoneItems.length === 0 ? 0 : Math.round(
    prevDoneItems.reduce((acc, i) => {
      return acc + (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / 3_600_000;
    }, 0) / prevDoneItems.length
  );

  // ── RW ──────────────────────────────────────────────────────────────────
  const rwItems     = periodItems.filter(i => i.parentItemId !== null);
  const prevRWItems = prevItems.filter(i => i.parentItemId !== null);

  // ── Returns ─────────────────────────────────────────────────────────────
  const periodReturns = mockReturnItems.filter(r => new Date(r.createdAt) >= since);
  const returnRate    = doneItems.length === 0 ? 0 : Math.round((periodReturns.length / doneItems.length) * 100);

  // ── Bottleneck: avg dwell per stage (using updatedAt-createdAt as proxy) ─
  const STAGES = ['DRAFTING','PURCHASING','MACHINING','FABRIKASI','QC','DELIVERY'];
  const deptDwell = STAGES.map(stage => {
    const stageItems = periodItems.filter(i => i.stage === stage || i.stageBreakdown?.some((s: { stage: string }) => s.stage === stage));
    if (stageItems.length === 0) return { dept: stage, avgDays: 0 };
    const avgMs = stageItems.reduce((acc, i) => {
      return acc + (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime());
    }, 0) / stageItems.length;
    return { dept: stage, avgDays: Math.round(avgMs / 86_400_000 * 10) / 10 };
  }).filter(d => d.avgDays > 0);

  const bottleneck = deptDwell.length === 0 ? null
    : deptDwell.reduce((a, b) => a.avgDays > b.avgDays ? a : b).dept;

  // ── Per-client ──────────────────────────────────────────────────────────
  const clientMap = new Map<string, { poIds: Set<string>; rwCount: number; returnCount: number }>();
  periodPOs.forEach(po => {
    if (!clientMap.has(po.clientName)) {
      clientMap.set(po.clientName, { poIds: new Set(), rwCount: 0, returnCount: 0 });
    }
    clientMap.get(po.clientName)!.poIds.add(po.id);
  });
  rwItems.forEach(i => {
    const po = mockPOs.find(p => p.id === i.poId);
    if (po && clientMap.has(po.clientName)) {
      clientMap.get(po.clientName)!.rwCount++;
    }
  });
  periodReturns.forEach(r => {
    const item = mockItems.find(i => i.id === r.originalItemId);
    const po   = item ? mockPOs.find(p => p.id === item.poId) : null;
    if (po && clientMap.has(po.clientName)) {
      clientMap.get(po.clientName)!.returnCount++;
    }
  });

  const clientRows = Array.from(clientMap.entries()).map(([clientName, data]) => {
    const clientItems = periodItems.filter(i => data.poIds.has(i.poId));
    const onTime = clientItems.filter(isItemOnTime).length;
    const onTimePct = clientItems.length === 0 ? 0 : Math.round((onTime / clientItems.length) * 100);
    return {
      clientName,
      poCount: data.poIds.size,
      onTimePct,
      rwCount: data.rwCount,
      returnCount: data.returnCount,
    };
  }).sort((a, b) => b.poCount - a.poCount);

  // ── RW by dept ──────────────────────────────────────────────────────────
  const rwDeptMap = new Map<string, number>();
  rwItems.forEach(i => {
    const dept = i.stage;
    rwDeptMap.set(dept, (rwDeptMap.get(dept) ?? 0) + 1);
  });
  const rwByDept = Array.from(rwDeptMap.entries())
    .map(([dept, count]) => ({ dept, count }))
    .sort((a, b) => b.count - a.count);

  // ── Deltas ──────────────────────────────────────────────────────────────
  const deltas = {
    totalPOs:    periodPOs.length - prevPOs.length,
    onTimeRate:  onTimeRate - prevOnTimeRate,
    avgDays:     avgHrs - prevAvgHrs,
    totalRW:     rwItems.length - prevRWItems.length,
  };

  return {
    hasData,
    totalPOs:           periodPOs.length,
    onTimeRate,
    onTimeCount:        onTimeItems,
    lateCount:          lateItems,
    avgCompletionDays:  avgHrs,
    totalRW:            rwItems.length,
    totalReturns:       periodReturns.length,
    returnRate,
    bottleneck,
    deptDwell,
    clientRows,
    rwByDept,
    deltas,
  };
}
