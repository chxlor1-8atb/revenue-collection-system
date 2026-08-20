"use client";

import { useState } from "react";
import { markInvoiceAsPaidCash } from "../actions";
import { Banknote, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

export default function CashPaymentButton({ invoiceId, monthYear }: { invoiceId: number, monthYear?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  const handleCashPayment = async () => {
    setIsLoading(true);
    try {
      const res = await markInvoiceAsPaidCash(invoiceId);
      if (res.success) {
        setIsConfirmOpen(false);
        router.refresh();
      } else {
        alert(res.error || "เกิดข้อผิดพลาด");
        setIsConfirmOpen(false);
      }
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + e.message);
      setIsConfirmOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        title="รับชำระด้วยเงินสด"
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
        จ่ายเงินสด
      </button>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="ยืนยันรับชำระเงินสด"
        description={<>คุณต้องการรับชำระเงินสดสำหรับบิล{monthYear ? `เดือน ${monthYear}` : 'นี้'} ใช่หรือไม่?</>}
        confirmText="ใช่, รับชำระเงิน"
        onConfirm={handleCashPayment}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={isLoading}
      />
    </>
  );
}
