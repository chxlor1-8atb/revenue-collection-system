"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, QrCode } from "lucide-react";

export default function InvoiceSelectionForm({ invoices, house }: { invoices: any[], house: any }) {
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [advanceMonths, setAdvanceMonths] = useState(0);
  const router = useRouter();

  const handleToggle = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId) 
        : [...prev, invoiceId]
    );
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleProceedToPayment = async () => {
    if (selectedInvoices.length === 0) return;
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
    return 0; // Or a system default if you have one
  };

  const calculateTotal = () => {
    const invoicesTotal = invoices
      .filter(inv => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const advanceTotal = advanceMonths * getAdvanceRate();
    return invoicesTotal + advanceTotal;
  };

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
    <div className="flex flex-col">
      <div className="space-y-3 mb-8">
        {invoices.filter(inv => inv.status === 'unpaid').length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 font-medium">ไม่พบรายการค้างชำระ</p>
          </div>
        ) : (
          invoices.filter(inv => inv.status === 'unpaid').map((inv, index, arr) => {
            const isSelected = selectedInvoices.includes(inv.id);
            const isOverdue = index < arr.length - 1;
            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.div
                  onClick={() => handleToggle(inv.id)}
                  animate={{ 
                    x: isSelected ? 8 : 0,
                    x: isSelected ? 4 : 0,
                    backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF",
                    borderColor: isSelected ? "#059669" : "#E2E8F0"
                  }}
                  whileHover={{ x: isSelected ? 4 : 2 }}
                  className={`group relative flex items-center justify-between p-3 rounded-xl border cursor-pointer overflow-hidden transition-shadow ${isSelected ? 'shadow-sm shadow-emerald-600/10' : 'hover:shadow-sm hover:border-slate-300'}`}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 4 }}
                        exit={{ width: 0 }}
                        className="absolute left-0 top-0 bottom-0 bg-emerald-600"
                      />
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-3 z-10 pl-1">
                    <div className={`w-5 h-5 flex items-center justify-center rounded-md border transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent group-hover:border-slate-400'}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <div>
                      <p className={`font-medium text-sm transition-colors ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                        ประจำเดือน {formatThaiMonth(inv.monthYear)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isOverdue ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 border border-red-200">ค้างชำระ</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">รอบปัจจุบัน</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="z-10 text-right">
                    <p className={`font-mono text-sm font-bold transition-colors ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {Math.floor(parseFloat(inv.amount))} <span className="text-[10px] font-sans font-medium">บาท</span>
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm text-emerald-900 flex items-center gap-2">
            <span className="text-emerald-600">✨</span> ชำระเงินล่วงหน้า
          </h3>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            จ่ายล่วงหน้าเรท {getAdvanceRate()} บาท/เดือน
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1 rounded-xl border border-emerald-200 shadow-sm">
          <button 
            onClick={() => setAdvanceMonths(Math.max(0, advanceMonths - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            disabled={advanceMonths === 0}
          >
            -
          </button>
          <div className="w-12 text-center font-bold text-emerald-800 text-sm">
            {advanceMonths}
          </div>
          <button 
            onClick={() => setAdvanceMonths(advanceMonths + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
            disabled={getAdvanceRate() === 0}
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t-2 border-dashed border-slate-200">
        <div className="flex justify-between items-end mb-4">
          <p className="font-medium text-xs text-slate-500 uppercase tracking-widest">ยอดรวม</p>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-slate-900">
              {Math.floor(calculateTotal())} <span className="text-sm font-sans font-medium text-slate-500">บาท</span>
            </p>
          </div>
        </div>

        <button 
          className="w-full relative overflow-hidden group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          disabled={(selectedInvoices.length === 0 && advanceMonths === 0) || isLoading || calculateTotal() === 0}
          onClick={handleProceedToPayment}
        >
          <QrCode size={18} />
          <span>{isLoading ? "กำลังประมวลผล..." : "สร้าง QR Code ชำระเงิน"}</span>
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>
      </div>
    </div>
  );
}
