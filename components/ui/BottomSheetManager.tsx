'use client';

import React from 'react';
import useUIStore from '@/store/uiStore';
import QCGateSheet from './QCGateSheet';
import DeliveryGateSheet from './DeliveryGateSheet';
import IssueReportSheet from './IssueReportSheet';
import ReturnProtocolSheet from './ReturnProtocolSheet';

export default function BottomSheetManager() {
  const activeBottomSheet = useUIStore((s) => s.activeBottomSheet);
  const bottomSheetItemId = useUIStore((s) => s.bottomSheetItemId);
  const closeBottomSheet  = useUIStore((s) => s.closeBottomSheet);

  if (!activeBottomSheet || !bottomSheetItemId) return null;

  const props = { itemId: bottomSheetItemId, onDismiss: closeBottomSheet };

  return (
    <>
      {activeBottomSheet === 'qc-gate'       && <QCGateSheet       {...props} />}
      {activeBottomSheet === 'delivery-gate' && <DeliveryGateSheet  {...props} />}
      {activeBottomSheet === 'issue'         && <IssueReportSheet   {...props} />}
      {activeBottomSheet === 'return'        && <ReturnProtocolSheet {...props} />}
    </>
  );
}
