'use client';

import React from 'react';

interface StageBadgeProps {
  item: {
    stage: string;
    urgent: boolean;
    source: string | null;
    issues: Array<{ resolved: boolean }>;
  };
}

export default function StageBadge({ item }: StageBadgeProps) {
  const hasIssue = item.issues.some((i) => !i.resolved);

  // Priority: ISSUE > URGENT > RETURN > stage
  if (hasIssue) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#B33941] text-white">
        MASALAH
      </span>
    );
  }

  if (item.urgent) {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#DE8F26] text-white animate-pulse-urgent">
        URGENT
      </span>
    );
  }

  if (item.source === 'RETURN') {
    return (
      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#B33941] text-white">
        RETURN
      </span>
    );
  }

  const stageStyles: Record<string, string> = {
    DRAFTING:   'bg-[#E5E7EB] text-[#374151]',
    PURCHASING: 'bg-[#FEF3C7] text-[#DE8F26]',
    MACHINING:  'bg-[#1D3B4D] text-white',
    FABRIKASI:  'bg-[#1D3B4D] text-white',
    QC:         'bg-[#D1FAE5] text-[#2A7B76]',
    DELIVERY:   'bg-[#D1FAE5] text-[#2A7B76]',
    DONE:       'bg-[#D1FAE5] text-[#065F46]',
  };

  const cls = stageStyles[item.stage] ?? 'bg-[#E5E7EB] text-[#374151]';

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {item.stage}
    </span>
  );
}
