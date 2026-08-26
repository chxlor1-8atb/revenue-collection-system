"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

  const formatMonthEng = (monthYear: string) => {
    if (!monthYear) return "";
    const [yearStr, monthStr] = monthYear.split('-');
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${yearStr}`;
    }
    return monthYear;
  };

  return (
    <div className="font-mono text-sm text-slate-900 w-full">
      
      {/* ITEMS HEADER */}
      <div className="flex justify-between items-end mb-2 text-xs font-bold border-b border-slate-300 pb-1">
        <span>DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>

      {/* INVOICE ITEMS */}
      <div className="space-y-1 mb-4">
        {unpaidInvoices.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            NO PENDING INVOICES
          </div>
        ) : (
          unpaidInvoices.map((inv) => {
            const isSelected = selectedInvoices.includes(inv.id);
            const amountNum = parseFloat(inv.amount || "0");
            
            return (
              <div 
                key={inv.id}
                onClick={() => handleToggle(inv.id)}
                className={`flex justify-between items-baseline cursor-pointer group ${isSelected ? 'bg-amber-100/50' : 'hover:bg-slate-100'} px-1 py-1 -mx-1 transition-colors`}
              >
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                  <span className="font-bold shrink-0">
                    {isSelected ? '[X]' : '[ ]'}
                  </span>
                  <span className="tracking-tighter">
                    {formatMonthEng(inv.monthYear)}
                  </span>
                  <span className="text-slate-300 tracking-widest hidden sm:inline"> ..........................</span>
                </div>
                <div className="shrink-0 pl-2">
                  {(amountNum).toFixed(2)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADVANCE PAYMENT */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-bold">ADVANCE PMT (@{advanceRate}/MTH)</span>
          <span className="text-slate-300 tracking-widest hidden sm:inline overflow-hidden whitespace-nowrap px-2"> .................</span>
          <span>{(advanceTotal).toFixed(2)}</span>
        </div>
        
        {/* Stepper */}
        <div className="flex items-center gap-4 bg-slate-100/50 p-2 border border-slate-200">
          <button 
            type="button"
            onClick={() => setAdvanceMonths(Math.max(0, advanceMonths - 1))}
            className="w-8 h-8 flex items-center justify-center border border-slate-400 bg-white active:bg-slate-200 disabled:opacity-30 cursor-pointer"
            disabled={advanceMonths === 0}
          >
            -
          </button>
          <div className="w-16 text-center font-bold tracking-widest">
            {advanceMonths.toString().padStart(2, '0')}
          </div>
          <button 
            type="button"
            onClick={() => setAdvanceMonths(advanceMonths + 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-400 bg-white active:bg-slate-200 disabled:opacity-30 cursor-pointer"
            disabled={advanceRate === 0}
          >
            +
          </button>
        </div>
      </div>

      {/* TOTALS */}
      <div className="border-t-[3px] border-double border-slate-900/60 pt-4 mb-6">
        <div className="flex justify-between items-baseline text-xs mb-1">
          <span>SUBTOTAL</span>
          <span>{(grandTotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-baseline text-xs mb-3">
          <span>VAT (0%)</span>
          <span>0.00</span>
        </div>
        <div className="flex justify-between items-baseline text-lg sm:text-xl font-bold bg-slate-900 text-white p-2">
          <span>TOTAL DUE</span>
          <span>฿ {(grandTotal).toFixed(2)}</span>
        </div>
      </div>

      {/* BUTTON */}
      <button 
        type="button"
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-4 px-6 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm cursor-pointer shadow-sm"
        disabled={(selectedInvoices.length === 0 && advanceMonths === 0) || isLoading || grandTotal === 0}
        onClick={handleProceedToPayment}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>PROCESSING...</span>
          </>
        ) : (
          <span>PRINT QR CODE</span>
        )}
      </button>

    </div>
  );
}
