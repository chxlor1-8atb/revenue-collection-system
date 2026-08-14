"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, ImageOff } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function SlipReviewForm({ 
  transaction, 
  onReviewed 
}: { 
  transaction: any;
  onReviewed?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const router = useRouter();

  const handleReview = async (status: 'verified' | 'rejected') => {
    if (isSubmitting) return;
    if (status === 'rejected') {
      setShowRejectConfirm(true);
      return;
    }
    await executeReview('verified');
  };

  const executeReview = async (status: 'verified' | 'rejected') => {
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
        setShowRejectConfirm(false);
        if (onReviewed) {
          onReviewed();
        } else {
          router.refresh();
        }
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
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
          {transaction.slipImageUrl && transaction.slipImageUrl !== "pending" ? (
            <img 
              src={transaction.slipImageUrl} 
              alt="Slip" 
              style={{ width: "100%", borderRadius: "4px", border: "1px solid var(--border)" }} 
            />
          ) : (
            <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: "4px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", background: "#f8f9fa", color: "#94a3b8" }}>
              <ImageOff size={32} strokeWidth={1.5} />
              <span style={{ fontSize: "12px" }}>ไม่มีรูปสลิป</span>
            </div>
          )}
        </div>
        
        {/* Right side: Details & Actions */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg">รหัสทำรายการ: #{transaction.id}</h3>
            <span className="font-mono font-bold text-xl text-[#3A5A40]">
              ยอดแจ้งชำระ: {parseFloat(transaction.amount).toFixed(2)} ฿
            </span>
          </div>
          
          <div className="perforation-line" style={{ margin: "0.5rem 0 1rem 0" }}></div>

          <div className="mb-4">
            <p className="font-bold mb-2">รายการบิลที่แนบมาด้วย:</p>
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
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} strokeWidth={1.5} /> อนุมัติ (ยอดเงินถูกต้อง)
            </button>
            <button 
              onClick={() => handleReview('rejected')}
              disabled={isSubmitting}
              className="btn flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
            >
              <XCircle size={18} strokeWidth={1.5} /> ปฏิเสธ (สลิปมีปัญหา)
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        onConfirm={() => executeReview('rejected')}
        isLoading={isSubmitting}
        title="ปฏิเสธสลิปการโอนเงิน"
        description="คุณแน่ใจหรือไม่ที่จะปฏิเสธสลิปใบนี้ ?"
        warningText="หากปฏิเสธ สถานะบิลทั้งหมดจะกลับไปเป็นค้างชำระ ผู้จ่ายจะต้องทำการแจ้งชำระเงินเข้ามาใหม่"
        confirmText="ใช่, ปฏิเสธสลิป"
      />
    </div>
  );
}
