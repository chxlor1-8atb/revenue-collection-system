"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'paid': return <span className="text-status-verified">ชำระแล้ว</span>;
      case 'pending': return <span className="text-status-pending">รอตรวจสอบสลิป</span>;
      default: return <span className="text-status-dark">ค้างชำระ</span>;
    }
  };

  return (
    <div>
      <div className="space-y-4 mb-6">
        {invoices.length === 0 ? (
          <p className="text-center text-sm text-gray-500">ไม่พบรายการบิลค่าขยะ</p>
        ) : (
          invoices.map((inv) => {
            const isUnpaid = inv.status === 'unpaid';
            return (
              <div key={inv.id} className={`p-3 border flex justify-between items-center ${isUnpaid ? 'bg-white cursor-pointer hover:border-[#3A5A40]' : 'bg-[#F6F4EC] opacity-75'}`}
                   onClick={() => isUnpaid && handleToggle(inv.id)}>
                <div className="flex items-center gap-3">
                  {isUnpaid ? (
                    <input 
                      type="checkbox" 
                      checked={selectedInvoices.includes(inv.id)} 
                      onChange={() => handleToggle(inv.id)}
                      className="w-4 h-4 accent-[#3A5A40]"
                    />
                  ) : (
                    <div className="w-4"></div> /* Placeholder for alignment */
                  )}
                  <div>
                    <p className="font-mono font-semibold">{inv.monthYear}</p>
                    <p className="text-xs">{getStatusDisplay(inv.status)}</p>
                  </div>
                </div>
                <div className="font-mono font-bold">
                  {parseFloat(inv.amount).toFixed(2)} ฿
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="perforation-line"></div>

      <div className="flex justify-between items-center mb-6 mt-4">
        <span className="font-serif font-bold text-lg">ยอดรวมที่ต้องชำระ:</span>
        <span className="font-mono font-bold text-xl text-[#3A5A40]">{calculateTotal().toFixed(2)} ฿</span>
      </div>

      <button 
        onClick={handleProceedToPayment}
        disabled={selectedInvoices.length === 0} 
        className="btn btn-primary w-full font-serif text-lg py-2"
        style={{ opacity: selectedInvoices.length === 0 ? 0.5 : 1 }}
      >
        สร้าง QR Code ชำระเงิน
      </button>
    </div>
  );
}
