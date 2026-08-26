"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Plus, Minus, Receipt } from "lucide-react";

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
    <>
      <div className="w-full">
        {/* INVOICE ITEMS SECTION */}
        <h3 className="text-sm font-bold text-slate-800 mb-3 px-1 flex items-center gap-2">
          <Receipt size={16} className="text-emerald-600" />
          รายการบิลค้างชำระ
        </h3>
        
        <div className="space-y-3 mb-6">
          {unpaidInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-emerald-500" />
              </div>
              <h4 className="font-bold text-slate-800 mb-1">ยอดเยี่ยมมาก!</h4>
              <p className="text-sm text-slate-500">คุณไม่มีบิลค้างชำระในระบบ</p>
            </div>
          ) : (
            unpaidInvoices.map((inv) => {
              const isSelected = selectedInvoices.includes(inv.id);
              const amountNum = parseFloat(inv.amount || "0");
              
              return (
                <div 
                  key={inv.id}
                  onClick={() => handleToggle(inv.id)}
                  className={`flex justify-between items-center cursor-pointer p-4 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                        บิลประจำเดือน
                      </p>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-emerald-700/80' : 'text-slate-500'}`}>
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
        <h3 className="text-sm font-bold text-slate-800 mb-3 px-1 mt-8">
          ชำระล่วงหน้า (รายเดือน)
        </h3>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-bold text-slate-800 text-sm">จำนวนเดือนที่ต้องการ</p>
              <p className="text-xs text-slate-500 mt-0.5">เดือนละ ฿{advanceRate.toFixed(2)}</p>
            </div>
            
            {/* Stepper */}
            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <button 
                type="button"
                onClick={() => setAdvanceMonths(Math.max(0, advanceMonths - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-700 active:bg-slate-100 disabled:opacity-30 disabled:active:bg-white"
                disabled={advanceMonths === 0}
              >
                <Minus size={16} />
              </button>
              <div className="w-6 text-center font-bold text-slate-800 text-lg">
                {advanceMonths}
              </div>
              <button 
                type="button"
                onClick={() => setAdvanceMonths(advanceMonths + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-700 active:bg-slate-100 disabled:opacity-30"
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
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  advanceMonths === m 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                +{m} เดือน
              </button>
            ))}
          </div>

          {advanceTotal > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600">ยอดยกยอดล่วงหน้า</span>
              <span className="font-bold text-slate-800 text-base">฿{advanceTotal.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM CHECKOUT BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-30">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 mb-0.5">ยอดที่ต้องชำระทั้งหมด</span>
            <div className="flex items-baseline gap-1">
              <span className="text-emerald-600 font-bold text-sm">฿</span>
              <span className="text-emerald-600 font-black text-2xl tracking-tight leading-none">{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="button"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
            disabled={(selectedInvoices.length === 0 && advanceMonths === 0) || isLoading || grandTotal === 0}
            onClick={handleProceedToPayment}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>กำลังเตรียม QR...</span>
              </>
            ) : (
              <span>สแกน QR ชำระเงิน</span>
            )}
          </button>
          
        </div>
        <div className="max-w-md mx-auto mt-3 text-center pb-safe">
            <p className="text-[10px] text-slate-400">ระบบชำระเงินออนไลน์ เทศบาลเมืองนางรอง</p>
        </div>
      </div>
    </>
  );
}
