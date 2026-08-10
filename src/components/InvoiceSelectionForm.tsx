"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
          invoices.map((inv, index) => {
            const isUnpaid = inv.status === 'unpaid';
            if (!isUnpaid) return null;
            return (
              <AnimatedCard 
                key={inv.id} 
                delay={index * 0.1}
                className={`border p-4 mb-3 flex items-center gap-4 cursor-pointer transition-colors ${
                  selectedInvoices.includes(inv.id) ? "bg-[#eaf1ec] border-[#3A5A40]" : "bg-white border-gray-200"
                }`}
                onClick={() => handleToggle(inv.id)}
              >
                <input 
                  type="checkbox" 
                  checked={selectedInvoices.includes(inv.id)}
                  onChange={() => handleToggle(inv.id)}
                  className="w-5 h-5 accent-[#3A5A40]"
                />
                <div className="flex-1">
                  <p className="font-serif font-bold text-lg">ค่าขยะประจำเดือน {inv.monthYear}</p>
                  <p className="font-mono text-status-pending">ยอดค้างชำระ: {parseFloat(inv.amount).toFixed(2)} ฿</p>
                </div>
              </AnimatedCard>
            );
          })
        )}
      </div>

      <div className="perforation-line my-6"></div>

      <div className="flex justify-between items-end mb-6">
        <p className="font-serif text-gray-500">รวมยอดที่ต้องชำระ:</p>
        <p className="font-mono text-3xl font-bold text-[#1F2E22]">
          {calculateTotal().toFixed(2)} ฿
        </p>
      </div>

      <div className="flex gap-4">
        <AnimatedButton 
          className="btn font-serif flex-1" 
          style={{ backgroundColor: "#e5e7eb", color: "#374151" }}
          onClick={() => router.push("/")}
        >
          ย้อนกลับ
        </AnimatedButton>
        <AnimatedButton 
          className="btn btn-primary font-serif flex-1"
          disabled={selectedInvoices.length === 0}
          onClick={handleProceedToPayment}
        >
          สร้าง QR Code ชำระเงิน
        </AnimatedButton>
      </div>
    </div>
  );
}
