"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, QrCode, Loader2, Sparkles, CheckSquare, Square } from "lucide-react";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function InvoiceSelectionForm({ invoices, house }: { invoices: any[], house: any }) {
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
  
  // Default select all unpaid invoices or current month
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

  const handleSelectAll = () => {
    if (selectedInvoices.length === unpaidInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(unpaidInvoices.map(inv => inv.id));
    }
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
    return 20; // Default municipal standard rate
  };

  const advanceRate = getAdvanceRate();

  const invoicesTotal = invoices
    .filter(inv => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  
  const advanceTotal = advanceMonths * advanceRate;
  const grandTotal = invoicesTotal + advanceTotal;

  const formatThaiMonth = (monthYear: string) => {
    if (!monthYear) return "";
    const [yearStr, monthStr] = monthYear.split('-');
    if (!yearStr || !monthStr) return monthYear;
    
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    
    const monthIndex = parseInt(monthStr, 10) - 1;
    const thaiYear = parseInt(yearStr, 10) + 543;
    
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${thaiYear}`;
    }
    return monthYear;
  };

  return (
    <div className="flex flex-col font-sans">
      
      {/* 1. Unpaid Invoices Header with Quick Select All */}
      {unpaidInvoices.length > 1 && (
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-slate-500 font-medium">เลือกบิลที่ต้องการชำระ ({selectedInvoices.length}/{unpaidInvoices.length})</span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer transition-colors"
          >
            {selectedInvoices.length === unpaidInvoices.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
          </button>
        </div>
      )}

      {/* 2. Unpaid Invoices List */}
      <div className="space-y-2.5 mb-6">
        {unpaidInvoices.length === 0 ? (
          <div className="py-7 text-center bg-emerald-50/60 rounded-2xl border border-dashed border-emerald-200/80">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <Check size={20} strokeWidth={3} />
            </div>
            <p className="text-sm font-bold text-emerald-900">ไม่มีบิลค้างชำระในระบบ</p>
            <p className="text-xs text-emerald-700 mt-0.5">คุณสามารถเลือกชำระล่วงหน้าในส่วนถัดไปได้ทันที</p>
          </div>
        ) : (
          unpaidInvoices.map((inv, index, arr) => {
            const isSelected = selectedInvoices.includes(inv.id);
            const isOverdue = index < arr.length - 1;
            const amountNum = parseFloat(inv.amount || "0");

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div
                  onClick={() => handleToggle(inv.id)}
                  className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 ${
                    isSelected 
                      ? 'bg-emerald-50/70 border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/20' 
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Custom Minimal Checkbox */}
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'border border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                      {isSelected && <Check size={13} strokeWidth={3.5} />}
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate transition-colors ${
                        isSelected ? 'text-emerald-950' : 'text-slate-800'
                      }`}>
                        ประจำเดือน {formatThaiMonth(inv.monthYear)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isOverdue ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200/80">
                            ค้างชำระ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                            รอบปัจจุบัน
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Amount with Lining Numerals */}
                  <div className="text-right shrink-0">
                    <p className={`font-mono text-base sm:text-lg font-black transition-colors ${
                      isSelected ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {amountNum % 1 === 0 ? amountNum.toFixed(0) : amountNum.toFixed(2)}
                      <span className="text-xs font-sans font-medium text-slate-500 ml-1">บาท</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 3. Minimal Advance Payment Stepper */}
      <div className="mb-6 p-4 sm:p-4.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-row items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">✨</span>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              ชำระเงินล่วงหน้า
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            จ่ายล่วงหน้าเพื่อความสะดวก (เรท {advanceRate} บาท/เดือน)
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
          <button 
            type="button"
            onClick={() => setAdvanceMonths(Math.max(0, advanceMonths - 1))}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 disabled:opacity-30 text-sm font-bold transition-all cursor-pointer"
            disabled={advanceMonths === 0}
          >
            -
          </button>
          <div className="min-w-12 text-center font-mono font-bold text-slate-800 text-xs sm:text-sm">
            {advanceMonths} <span className="font-sans text-[11px] font-normal text-slate-500">เดือน</span>
          </div>
          <button 
            type="button"
            onClick={() => setAdvanceMonths(advanceMonths + 1)}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 active:scale-95 text-emerald-800 disabled:opacity-30 text-sm font-bold transition-all cursor-pointer"
            disabled={advanceRate === 0}
          >
            +
          </button>
        </div>
      </div>

      {/* 4. Receipt Calculation Ledger & Total */}
      <div className="pt-5 border-t border-dashed border-slate-200">
        
        {/* Itemized Calculation Preview */}
        {(selectedInvoices.length > 0 || advanceMonths > 0) && (
          <div className="space-y-1.5 mb-4 text-xs text-slate-500">
            {selectedInvoices.length > 0 && (
              <div className="flex justify-between items-center">
                <span>ยอดบิลรอบปกติ ({selectedInvoices.length} รายการ)</span>
                <span className="font-mono text-slate-700 font-semibold">฿{invoicesTotal.toFixed(2)}</span>
              </div>
            )}
            {advanceMonths > 0 && (
              <div className="flex justify-between items-center text-emerald-700">
                <span>ยอดชำระล่วงหน้า ({advanceMonths} เดือน @ {advanceRate}฿)</span>
                <span className="font-mono font-semibold">+฿{advanceTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-baseline mb-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ยอดรวมที่ต้องชำระ</p>
            <p className="text-xs text-slate-500 mt-0.5">รวมภาษีและค่าบริการเรียบร้อย</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {grandTotal % 1 === 0 ? grandTotal.toFixed(0) : grandTotal.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-600">บาท</span>
            </div>
          </div>
        </div>

        {/* Primary Action: QR Code Generator */}
        <button 
          type="button"
          className="w-full relative overflow-hidden group bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-600/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer"
          disabled={(selectedInvoices.length === 0 && advanceMonths === 0) || isLoading || grandTotal === 0}
          onClick={handleProceedToPayment}
        >
          {isLoading ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              <span>กำลังเตรียม QR Code...</span>
            </>
          ) : (
            <>
              <QrCode size={20} />
              <span>สร้าง QR Code ชำระเงิน</span>
            </>
          )}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>
      </div>

    </div>
  );
}
