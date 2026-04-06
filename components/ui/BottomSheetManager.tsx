'use client';

import React from 'react';
import useUIStore from '@/store/uiStore';
import QCGateSheet from '@/components/sheets/QCGateSheet';
import DeliveryGateSheet from '@/components/sheets/DeliveryGateSheet';
import ReturnProtocolSheet from '@/components/sheets/ReturnProtocolSheet';
import IssueReportSheet from '@/components/ui/IssueReportSheet';

export default function BottomSheetManager() {
  const activeBottomSheet = useUIStore((s) => s.activeBottomSheet);
  const bottomSheetItemId = useUIStore((s) => s.bottomSheetItemId);
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet);

  if (!activeBottomSheet) return null;

  const itemId = bottomSheetItemId ?? '';

  switch (activeBottomSheet) {
    case 'qc-gate':
      return <QCGateSheet itemId={itemId} onDismiss={closeBottomSheet} />;
    case 'delivery-gate':
      return <DeliveryGateSheet itemId={itemId} onDismiss={closeBottomSheet} />;
    case 'issue':
      return <IssueReportSheet itemId={itemId} onDismiss={closeBottomSheet} />;
    case 'return':
      return <ReturnProtocolSheet itemId={itemId} onDismiss={closeBottomSheet} />;
    default:
      return null;
  }
}
