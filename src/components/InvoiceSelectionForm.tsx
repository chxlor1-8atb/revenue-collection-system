"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, CreditCard, ChevronRight, CheckCircle2, ArrowLeft } from "lucide-react";
import AnimatedCard from "./AnimatedCard";
import AnimatedButton from "./AnimatedButton";

export default function InvoiceSelectionForm({ invoices, houseId }: { invoices: any[], houseId: number }) {
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const router = useRouter();

  const handleToggle = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId) 
        : [...prev, invoiceId]
    );
  };

  const handleProceedToPayment = () => {
    if (selectedInvoices.length === 0) return;
    
    // Pass selected invoices via query param
    const invoiceIdsStr = selectedInvoices.join(",");
    // Defaulting to qrCodeId = 1 for the test collector
    router.push(`/pay/1?invoices=${invoiceIdsStr}`);
  };

  const calculateTotal = () => {
    return invoices
      .filter(inv => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  };

  const hasUnpaid = invoices.some(inv => inv.status === 'unpaid');

  return (
    <div className="w-full font-sans">
      <div className="space-y-2 mb-5">
        {!hasUnpaid ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 border border-slate-100 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto mb-2 opacity-80" />
            <p className="font-sans font-bold text-slate-800">ไม่มียอดค้างชำระ</p>
            <p className="text-xs text-slate-400 mt-0.5">บ้านเลขที่นี้ได้ทำการชำระค่าบริการเสร็จสิ้นแล้ว</p>
          </div>
        ) : (
          invoices.map((inv, index) => {
            const isUnpaid = inv.status === 'unpaid';
            if (!isUnpaid) return null;
            const isSelected = selectedInvoices.includes(inv.id);
            return (
              <AnimatedCard 
                key={inv.id} 
                delay={index * 0.03}
                className={`border p-3.5 rounded-lg flex items-center gap-4 cursor-pointer transition-all duration-150 ${
                  isSelected 
                    ? "bg-teal-50/40 border-teal-500 shadow-sm" 
                    : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
                onClick={() => handleToggle(inv.id)}
              >
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggle(inv.id)}
                    className="w-4.5 h-4.5 rounded accent-teal-600 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-sans font-semibold text-slate-800 text-sm">
                    ค่าขยะประจำเดือน {inv.monthYear}
                  </p>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>งวดชำระประจำเดือน</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-slate-900 text-base font-bold">
                    ฿{parseFloat(inv.amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-amber-600 font-semibold font-sans mt-0.5">
                    ค้างชำระ
                  </p>
                </div>
              </AnimatedCard>
            );
          })
        )}
      </div>

      <div className="perforation-line my-4"></div>

      <div className="flex justify-between items-center mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <p className="font-sans text-[11px] text-slate-500 uppercase tracking-wider font-semibold">ยอดเงินรวมที่เลือก</p>
          <p className="font-sans text-[10px] text-slate-400 mt-0.5">รวมบิลที่เลือก {selectedInvoices.length} บิล</p>
        </div>
        <p className="font-mono text-2xl font-bold text-teal-600">
          ฿{calculateTotal().toFixed(2)}
        </p>
      </div>

      <div className="flex gap-3">
        <AnimatedButton 
          className="btn font-sans flex-1 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-800 py-2.5 text-xs font-semibold"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          ย้อนกลับ
        </AnimatedButton>
        <AnimatedButton 
          className="btn btn-primary font-sans flex-[2] py-2.5 text-xs font-semibold"
          disabled={selectedInvoices.length === 0}
          onClick={handleProceedToPayment}
        >
          <CreditCard className="w-3.5 h-3.5" />
          ชำระเงินออนไลน์
          <ChevronRight className="w-3.5 h-3.5" />
        </AnimatedButton>
      </div>
    </div>
  );
}
