"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Plus, Minus } from "lucide-react";

export default function InvoiceSelectionForm({ invoices, house }: { invoices: any[], house: any }) {
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  
  // Default select all unpaid invoices
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>(() => {
    return unpaidInvoices.map(inv => inv.id);
  });
  const [advanceMonths, setAdvanceMonths] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId) 
        : [...prev, invoiceId]
    );
  };

  const handleProceedToPayment = async () => {
    if (selectedInvoices.length === 0 && advanceMonths === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          invoiceIds: selectedInvoices,
          advanceMonths,
          houseId: house.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาดในการสร้างรายการ");
        setIsLoading(false);
        return;
      }
      
      if (data.transactionId) {
        router.push(`/pay/${data.transactionId}`);
      }
    } catch (error) {
      console.error("Failed to generate payment intent", error);
      setIsLoading(false);
    }
  };

  const getAdvanceRate = () => {
    if (house.defaultBillingAmount) return parseFloat(house.defaultBillingAmount);
    if (invoices.length > 0) return parseFloat(invoices[invoices.length - 1].amount);
    return 20;
  };

  const advanceRate = getAdvanceRate();

  const invoicesTotal = invoices
    .filter(inv => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  
  const advanceTotal = advanceMonths * advanceRate;
  const grandTotal = invoicesTotal + advanceTotal;

  const formatMonthThai = (monthYear: string) => {
    if (!monthYear) return "";
    const [yearStr, monthStr] = monthYear.split('-');
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const monthIndex = parseInt(monthStr, 10) - 1;
    const thaiYear = parseInt(yearStr, 10) + 543;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${thaiYear}`;
    }
    return monthYear;
  };

  return (
    <div className="w-full font-sans">
      
      {/* INVOICE ITEMS SECTION */}
      <h3 className="text-sm font-bold text-slate-800 mb-3">รายการค้างชำระ</h3>
      
      <div className="space-y-3 mb-6">
        {unpaidInvoices.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check size={20} />
            </div>
            <p className="font-bold text-slate-700 text-sm">ไม่มีบิลค้างชำระ</p>
          </div>
        ) : (
          unpaidInvoices.map((inv) => {
            const isSelected = selectedInvoices.includes(inv.id);
            const amountNum = parseFloat(inv.amount || "0");
            
            return (
              <div 
                key={inv.id}
                onClick={() => handleToggle(inv.id)}
                className={`flex justify-between items-center cursor-pointer p-3.5 rounded-2xl border transition-all ${
                  isSelected 
                    ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                    isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
                  }`}>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                      บิลประจำเดือน
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {formatMonthThai(inv.monthYear)}
                    </p>
                  </div>
                </div>
                <div className={`font-bold text-base ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                  ฿{amountNum.toFixed(2)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADVANCE PAYMENT SECTION */}
      <h3 className="text-sm font-bold text-slate-800 mb-3">ชำระล่วงหน้า (เพื่อความสะดวก)</h3>
      
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-bold text-slate-800 text-sm">ระบุจำนวนเดือน</p>
            <p className="text-xs text-slate-500 mt-0.5">อัตราเดือนละ ฿{advanceRate.toFixed(2)}</p>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              type="button"
              onClick={() => setAdvanceMonths(Math.max(0, advanceMonths - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              disabled={advanceMonths === 0}
            >
              <Minus size={16} />
            </button>
            <div className="w-6 text-center font-bold text-slate-800 text-base">
              {advanceMonths}
            </div>
            <button 
              type="button"
              onClick={() => setAdvanceMonths(advanceMonths + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              disabled={advanceRate === 0}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Quick Add Chips */}
        <div className="flex gap-2">
          {[1, 3, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => setAdvanceMonths(m)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                advanceMonths === m 
                  ? 'bg-slate-800 text-white border-slate-800' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              +{m} เดือน
            </button>
          ))}
        </div>
      </div>

      {/* TOTAL & BUTTON INSIDE CARD */}
      <div className="pt-5 border-t border-slate-200">
        <div className="flex justify-between items-end mb-5">
          <span className="text-sm font-semibold text-slate-600">ยอดชำระรวมทั้งสิ้น</span>
          <div className="flex items-baseline gap-1">
            <span className="text-slate-800 font-bold text-sm">฿</span>
            <span className="text-slate-900 font-black text-3xl tracking-tight leading-none">{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button 
          type="button"
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          disabled={(selectedInvoices.length === 0 && advanceMonths === 0) || isLoading || grandTotal === 0}
          onClick={handleProceedToPayment}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>กำลังเตรียม QR Code...</span>
            </>
          ) : (
            <span>สร้าง QR Code ชำระเงิน</span>
          )}
        </button>
      </div>

    </div>
  );
}
