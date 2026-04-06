'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import useUIStore from '@/store/uiStore';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockItems, mockPOs, mockInvoiceActions } from '@/lib/mockData';
import { formatDateID } from '@/lib/poUtils';

type FilterTab = 'Semua' | 'Belum Invoice' | 'Menunggu Bayar' | 'Lunas';

export default function InvoicingPage() {
  const hasHydrated = useUIStore(s => s._hasHydrated);
  const session = useUIStore(s => s.session);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Semua');
  const [tick, setTick] = useState(0);

  const forceUpdate = () => setTick(t => t + 1);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || !session.isLoggedIn) { window.location.href = '/select-dept'; return; }
    if (session.role === 'worker') { window.location.href = '/jobs'; return; }
    if (!['finance', 'manager', 'admin'].includes(session.role)) { window.location.href = '/'; }
  }, [hasHydrated, session]);

  if (!hasHydrated || !session || !session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#2A7B76] border-t-transparent animate-spin" />
      </div>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const doneItems = useMemo(() => mockItems.filter(i => i.stage === 'DONE'), [tick]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const unpaidCount = useMemo(
    () => mockItems.filter(i => i.stage === 'DONE' && i.invoiceStatus === 'UNPAID').length,
    [tick]
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const invoicedCount = useMemo(
    () => mockItems.filter(i => i.invoiceStatus === 'INVOICED').length,
    [tick]
  );
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const paidCount = useMemo(
    () => mockItems.filter(i => i.invoiceStatus === 'PAID').length,
    [tick]
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredItems = useMemo(() => {
    if (activeFilter === 'Belum Invoice') return doneItems.filter(i => i.invoiceStatus === 'UNPAID');
    if (activeFilter === 'Menunggu Bayar') return doneItems.filter(i => i.invoiceStatus === 'INVOICED');
    if (activeFilter === 'Lunas') return doneItems.filter(i => i.invoiceStatus === 'PAID');
    return doneItems;
  }, [activeFilter, doneItems]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const groupedByPO = useMemo(() => {
    const map = new Map<string, typeof filteredItems>();
    filteredItems.forEach(item => {
      const arr = map.get(item.poId) ?? [];
      arr.push(item);
      map.set(item.poId, arr);
    });
    return map;
  }, [filteredItems]);

  function executeSendInvoice(itemId: string) {
    const item = mockItems.find(i => i.id === itemId);
    if (!item) return;
    item.invoiceStatus = 'INVOICED';
    item.updatedAt = new Date().toISOString();
    mockInvoiceActions.push({
      itemId,
      action: 'INVOICED',
      performedById: session!.userId,
      createdAt: new Date().toISOString(),
    });
    forceUpdate();
  }

  function executeMarkPaid(itemId: string) {
    const item = mockItems.find(i => i.id === itemId);
    if (!item) return;
    item.invoiceStatus = 'PAID';
    item.updatedAt = new Date().toISOString();
    mockInvoiceActions.push({
      itemId,
      action: 'PAID',
      performedById: session!.userId,
      createdAt: new Date().toISOString(),
    });
    forceUpdate();
  }

  const FILTERS: FilterTab[] = ['Semua', 'Belum Invoice', 'Menunggu Bayar', 'Lunas'];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="sticky top-0 z-30 bg-[#F8F9FA]">
        <StickyHeader
          title="Invoicing"
          leftSlot={
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              className="w-10 h-10 flex items-center justify-center text-[#1A1A2E]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          }
        />

        {/* FILTER TABS */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 rounded-full px-3 h-7 text-xs font-medium transition-colors ${
                activeFilter === f
                  ? 'bg-[#1A1A2E] text-white'
                  : 'bg-white text-[#6B7280] border border-[#E5E7EB]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-28">
        {/* KPI ROW */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Belum Invoice',  value: unpaidCount,   color: '#B33941' },
            { label: 'Menunggu Bayar', value: invoicedCount, color: '#DE8F26' },
            { label: 'Lunas',          value: paidCount,     color: '#437A3B' },
          ].map(kpi => (
            <div key={kpi.label} className="flex flex-col items-center">
              <p className="text-[10px] text-[#9CA3AF]">{kpi.label}</p>
              <p className="text-[22px] font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* GROUPED ITEMS */}
        <div className="px-4 pt-3">
          {groupedByPO.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-[22px]">🎉</p>
              <p className="text-[14px] text-[#6B7280]">Semua invoice beres!</p>
            </div>
          ) : (
            Array.from(groupedByPO.entries()).map(([poId, poItems]) => {
              const po = mockPOs.find(p => p.id === poId);
              return (
                <div key={poId} className="mb-4">
                  {/* PO Group Header */}
                  <div className="pt-2 pb-1">
                    <p className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      {po?.number ?? poId}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">{po?.clientName}</p>
                  </div>

                  {/* Invoice Items */}
                  {poItems.map(item => (
                    <div key={item.id} className="bg-white rounded-xl border border-[#E5E7EB] p-3 mb-2">
                      {/* ROW A */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[13px] font-semibold text-[#1A1A2E]">{item.name}</p>
                          <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.qty} unit</p>
                        </div>
                        {item.invoiceStatus === 'UNPAID' && (
                          <span className="bg-[#FEF2F2] text-[#B33941] text-[10px] px-2 h-5 rounded-full flex items-center">
                            Belum Invoice
                          </span>
                        )}
                        {item.invoiceStatus === 'INVOICED' && (
                          <span className="bg-[#ECFDF5] text-[#2A7B76] text-[10px] px-2 h-5 rounded-full flex items-center">
                            Invoice Terkirim
                          </span>
                        )}
                        {item.invoiceStatus === 'PAID' && (
                          <span className="bg-[#F0FDF4] text-[#437A3B] text-[10px] px-2 h-5 rounded-full flex items-center">
                            ✓ Lunas
                          </span>
                        )}
                      </div>

                      {/* ROW B — action */}
                      <div className="mt-2 flex justify-end">
                        {item.invoiceStatus === 'UNPAID' && (
                          <button
                            type="button"
                            onClick={() => executeSendInvoice(item.id)}
                            className="bg-[#2A7B76] text-white rounded-lg px-3 h-8 text-xs font-medium"
                          >
                            📤 Buat Invoice
                          </button>
                        )}
                        {item.invoiceStatus === 'INVOICED' && (
                          <button
                            type="button"
                            onClick={() => executeMarkPaid(item.id)}
                            className="bg-[#437A3B] text-white rounded-lg px-3 h-8 text-xs font-medium"
                          >
                            ✅ Tandai Lunas
                          </button>
                        )}
                        {item.invoiceStatus === 'PAID' && (
                          <span className="text-[12px] text-[#437A3B]">✓ Selesai</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav role={session.role} department={session.department} />
    </div>
  );
}
