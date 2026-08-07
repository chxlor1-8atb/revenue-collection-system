"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CheckCircle, XCircle } from "lucide-react";

export default function SlipReviewForm({ transaction }: { transaction: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleReview = async (status: 'verified' | 'rejected') => {
    if (isSubmitting) return;
    if (status === 'rejected' && !confirm("คุณแน่ใจหรือไม่ที่จะปฏิเสธสลิปนี้?")) return;

    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/transactions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transactionId: transaction.id, 
          status 
        })
      });

      if (res.ok) {
        router.refresh(); // Refresh the page to remove the reviewed slip
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ledger-card">
      <div className="flex gap-4">
        {/* Left side: Slip Image */}
        <div style={{ flex: "0 0 300px" }}>
          <img 
            src={transaction.slipImageUrl} 
            alt="Slip" 
            style={{ width: "100%", borderRadius: "4px", border: "1px solid var(--border)" }} 
          />
        </div>
        
        {/* Right side: Details & Actions */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-serif font-bold text-lg">รหัสทำรายการ: #{transaction.id}</h3>
            <span className="font-mono font-bold text-xl text-[#3A5A40]">
              ยอดแจ้งชำระ: {parseFloat(transaction.amount).toFixed(2)} ฿
            </span>
          </div>
          
          <div className="perforation-line" style={{ margin: "0.5rem 0 1rem 0" }}></div>

          <div className="mb-4">
            <p className="font-serif font-bold mb-2">รายการบิลที่แนบมาด้วย:</p>
            <ul className="font-mono text-sm space-y-1 bg-[#F6F4EC] p-3 rounded-sm border">
              {transaction.invoices.map((inv: any) => (
                <li key={inv.id} className="flex justify-between">
                  <span>บ้านเลขที่: {inv.houseNumber} ({inv.ownerName}) - บิล: {inv.monthYear}</span>
                  <span>{parseFloat(inv.amount).toFixed(2)} ฿</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            เวลาอัปโหลด: {new Date(transaction.createdAt).toLocaleString('th-TH')}
          </p>

          <div style={{ marginTop: "auto", display: "flex", gap: "1rem" }}>
            <button 
              onClick={() => handleReview('verified')}
              disabled={isSubmitting}
              className="btn btn-primary font-serif flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} strokeWidth={1.5} /> อนุมัติ (ยอดเงินถูกต้อง)
            </button>
            <button 
              onClick={() => handleReview('rejected')}
              disabled={isSubmitting}
              className="btn font-serif flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
            >
              <XCircle size={18} strokeWidth={1.5} /> ปฏิเสธ (สลิปมีปัญหา)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
