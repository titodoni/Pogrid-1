'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import useUIStore from '@/store/uiStore';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockPOs, mockItems } from '@/lib/mockData';

export default function NewPOPage() {
  const hasHydrated = useUIStore(s => s._hasHydrated);
  const session = useUIStore(s => s.session);

  const autoPoNumber = 'PO-' + new Date().getFullYear() + '-' + String(mockPOs.length + 1).padStart(3, '0');

  const [clientName, setClientName] = useState('');
  const [poNumber, setPoNumber] = useState(autoPoNumber);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemType, setItemType] = useState('machining');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!session || !session.isLoggedIn) { window.location.href = '/select-dept'; return; }
    if (session.role === 'worker') { window.location.href = '/jobs'; return; }
    if (!['manager', 'admin', 'sales'].includes(session.role)) { window.location.href = '/pos'; }
  }, [hasHydrated, session]);

  if (!hasHydrated || !session || !session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#2A7B76] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isValid = clientName.trim().length >= 3 && poNumber.trim().length > 0 && deliveryDate !== '';

  function executeCreatePO() {
    if (!isValid || submitting) return;
    setSubmitting(true);

    const now = new Date().toISOString();
    const newPO = {
      id: 'po-' + Date.now(),
      number: poNumber.trim(),
      clientName: clientName.trim(),
      deliveryDate: new Date(deliveryDate).toISOString(),
      status: 'ACTIVE',
      urgent,
      notes: notes.trim() || null,
      createdAt: now,
      updatedAt: now,
    };
    mockPOs.push(newPO);

    if (itemName.trim()) {
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      mockItems.push({
        id: 'item-' + Date.now(),
        poId: newPO.id,
        po: { number: newPO.number, clientName: newPO.clientName, deliveryDate: newPO.deliveryDate, urgent },
        name: itemName.trim(),
        qty: itemQty,
        progress: 0,
        stage: 'DRAFTING',
        productionType: itemType,
        vendorJob: false,
        urgent,
        allNG: false,
        parentItemId: null,
        parent: null,
        source: null,
        returnBreadcrumb: null,
        invoiceStatus: 'UNPAID',
        notes: null,
        createdAt: now,
        updatedAt: now,
        lastEventLabel: 'Item dibuat',
        lastEventTime: timeStr,
        issues: [],
        stageBreakdown: [{ stage: 'DRAFTING', progress: 0, isStalled: false }],
      });
    }

    window.location.href = '/pos/' + newPO.id;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <StickyHeader
        title="Buat PO Baru"
        leftSlot={
          <button
            type="button"
            onClick={() => { window.location.href = '/pos'; }}
            className="w-10 h-10 flex items-center justify-center text-[#1A1A2E]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        }
      />

      <div className="px-4 pt-4 pb-28 flex flex-col gap-4">
        {/* Nama Klien */}
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-[#374151]">
            Nama Klien <span className="text-[#B33941]">*</span>
          </label>
          <input
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="PT. / CV. ..."
            className="h-11 px-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1A1A2E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2A7B76] focus:ring-1 focus:ring-[#2A7B76]"
          />
        </div>

        {/* Nomor PO */}
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-[#374151]">
            Nomor PO <span className="text-[#B33941]">*</span>
          </label>
          <input
            type="text"
            value={poNumber}
            onChange={e => setPoNumber(e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1A1A2E] focus:outline-none focus:border-[#2A7B76] focus:ring-1 focus:ring-[#2A7B76]"
          />
        </div>

        {/* Tanggal Tenggat */}
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-[#374151]">
            Tanggal Tenggat <span className="text-[#B33941]">*</span>
          </label>
          <input
            type="date"
            value={deliveryDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setDeliveryDate(e.target.value)}
            className="h-11 px-3 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1A1A2E] focus:outline-none focus:border-[#2A7B76] focus:ring-1 focus:ring-[#2A7B76]"
          />
        </div>

        {/* Catatan */}
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-[#374151]">
            Catatan <span className="text-[#9CA3AF] font-normal">(opsional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Instruksi khusus..."
            className="px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[14px] text-[#1A1A2E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2A7B76] focus:ring-1 focus:ring-[#2A7B76] resize-none"
          />
        </div>

        {/* Toggle Urgent */}
        <div className="flex justify-between items-center bg-white rounded-xl border border-[#E5E7EB] px-4 py-3">
          <span className="text-[14px] text-[#1A1A2E] font-medium">Urgent</span>
          <button
            type="button"
            onClick={() => setUrgent(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
              urgent ? 'bg-[#2A7B76]' : 'bg-[#D1D5DB]'
            }`}
            role="switch"
            aria-checked={urgent}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              urgent ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Item Awal */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-[#6B7280]">
            Item Awal <span className="font-normal">(opsional)</span>
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] text-[#6B7280]">Nama Item</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="Nama komponen..."
              className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 w-24">
              <label className="text-[12px] text-[#6B7280]">Qty</label>
              <input
                type="number"
                min={1}
                value={itemQty}
                onChange={e => setItemQty(Math.max(1, Number(e.target.value)))}
                className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[12px] text-[#6B7280]">Tipe Produksi</label>
              <select
                value={itemType}
                onChange={e => setItemType(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-[13px] text-[#1A1A2E] bg-white focus:outline-none focus:border-[#2A7B76]"
              >
                <option value="machining">Machining</option>
                <option value="fabrication">Fabrication</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          disabled={!isValid || submitting}
          onClick={executeCreatePO}
          className={`w-full h-12 rounded-xl text-[14px] font-semibold transition-opacity ${
            isValid && !submitting
              ? 'bg-[#1A1A2E] text-white'
              : 'bg-[#1A1A2E] text-white opacity-40 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Menyimpan...' : 'Simpan PO'}
        </button>
      </div>

      <BottomNav role={session.role} department={session.department} />
    </div>
  );
}
