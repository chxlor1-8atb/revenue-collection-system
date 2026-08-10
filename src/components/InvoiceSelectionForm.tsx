"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, QrCode } from "lucide-react";

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
    const invoiceIdsStr = selectedInvoices.join(",");
    router.push(`/pay/1?invoices=${invoiceIdsStr}`);
  };

  const calculateTotal = () => {
    return invoices
      .filter(inv => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  };

  return (
    <div className="flex flex-col">
      <div className="space-y-3 mb-8">
        {invoices.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 font-medium">ไม่พบรายการค้างชำระ</p>
          </div>
        ) : (
          invoices.map((inv, index) => {
            if (inv.status !== 'unpaid') return null;
            const isSelected = selectedInvoices.includes(inv.id);
            
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
                    backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF",
                    borderColor: isSelected ? "#059669" : "#E2E8F0"
                  }}
                  whileHover={{ x: isSelected ? 8 : 4 }}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl border cursor-pointer overflow-hidden transition-shadow ${isSelected ? 'shadow-md shadow-emerald-600/10' : 'hover:shadow-sm hover:border-slate-300'}`}
                >
                  {/* Subtle selection indicator bar */}
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

                  <div className="flex items-center gap-4 z-10 pl-2">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-md border transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent group-hover:border-slate-400'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className={`font-sans font-medium text-sm transition-colors ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                        ประจำเดือน {inv.monthYear}
                      </p>
                      <p className="font-mono text-xs text-slate-400 mt-0.5">
                        REF: INV-{inv.id.toString().padStart(5, '0')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="z-10 text-right">
                    <p className={`font-mono text-lg font-bold transition-colors ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                      ฿{parseFloat(inv.amount).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Ticket Footer / Total */}
      <div className="mt-auto pt-6 border-t-2 border-dashed border-slate-200">
        <div className="flex justify-between items-end mb-6">
          <p className="font-sans text-sm font-medium text-slate-500 uppercase tracking-widest">ยอดรวมที่ต้องชำระ</p>
          <div className="text-right">
            <p className="font-mono text-4xl font-bold text-slate-900 tracking-tighter">
              ฿{calculateTotal().toFixed(2)}
            </p>
          </div>
        </div>

        <button 
          className="w-full relative overflow-hidden group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={selectedInvoices.length === 0}
          onClick={handleProceedToPayment}
        >
          <QrCode size={20} />
          <span>สร้าง QR Code ชำระเงิน</span>
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>
      </div>
    </div>
  );
}
