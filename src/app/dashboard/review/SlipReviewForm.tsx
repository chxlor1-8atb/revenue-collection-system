"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ImageOff, Eye, Calendar, Home, User, Hash, Clock, AlertTriangle, Download } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import SlipModalButton from "@/components/SlipModalButton";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

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

  const hasSlipImage = Boolean(transaction.slipImageUrl && transaction.slipImageUrl !== "pending");

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Column: Slip Image */}
        <div className="lg:col-span-4 bg-slate-50 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100 relative group">
          {hasSlipImage ? (
            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white group/img">
              <img 
                src={transaction.slipImageUrl} 
                alt={`Slip for transaction #${transaction.id}`}
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-4">
                <SlipModalButton imageUrl={transaction.slipImageUrl}>
                  <span className="px-3.5 py-2 bg-white/95 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-lg backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105">
                    <Eye size={14} /> ขยายดูสลิป
                  </span>
                </SlipModalButton>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[280px] aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-2 text-slate-400">
              <ImageOff size={36} strokeWidth={1.5} className="text-slate-300" />
              <span className="text-xs font-semibold">ไม่มีรูปภาพสลิป</span>
            </div>
          )}

          {transaction.slipRefId && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                Ref: {transaction.slipRefId}
              </span>
            </div>
          )}
        </div>
        
        {/* Right Column: Transaction Details & Actions */}
        <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col justify-between">
          <div>
            {/* Header: ID, Date & Total Amount */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                    #{transaction.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                    <Clock size={12} /> รอตรวจสอบ
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                  <Calendar size={13} className="text-slate-400" />
                  อัปโหลดเมื่อ: {new Date(transaction.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">ยอดเงินที่โอน</span>
                <span className="font-mono font-bold text-2xl lg:text-3xl text-emerald-700">
                  ฿{parseFloat(transaction.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Attached Invoices List */}
            <div className="mt-5 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>รายการบิลที่แจ้งชำระ ({transaction.invoices?.length || 0} รายการ)</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {transaction.invoices?.map((inv: any) => (
                  <div 
                    key={inv.id} 
                    className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 text-sm transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs shrink-0 font-mono font-bold text-xs">
                        <Home size={14} className="text-[#5B58F2]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>บ้านเลขที่ {inv.houseNumber}</span>
                          <span className="text-xs font-normal text-slate-500">({inv.ownerName})</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          งวดประจำเดือน: <strong className="text-slate-700">{formatThaiMonth(inv.monthYear)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="font-mono font-bold text-slate-800">
                      ฿{parseFloat(inv.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {transaction.payerNote && (
              <div className="mt-4 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900">
                <span className="font-bold">หมายเหตุจากผู้โอน:</span> {transaction.payerNote}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <button 
              onClick={() => handleReview('verified')}
              disabled={isSubmitting}
              aria-label="อนุมัติสลิปนี้"
              className="w-full sm:flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={18} strokeWidth={2.2} /> 
              {isSubmitting ? "กำลังบันทึก..." : "อนุมัติ (ยอดเงินถูกต้อง)"}
            </button>

            <button 
              onClick={() => handleReview('rejected')}
              disabled={isSubmitting}
              aria-label="ปฏิเสธสลิปนี้"
              className="w-full sm:flex-1 h-12 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <XCircle size={18} strokeWidth={2.2} /> 
              ปฏิเสธ (สลิปไม่ถูกต้อง)
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRejectConfirm}
        onCancel={() => setShowRejectConfirm(false)}
        onConfirm={() => executeReview('rejected')}
        isLoading={isSubmitting}
        title="ปฏิเสธสลิปการโอนเงิน"
        description={<>คุณต้องการปฏิเสธสลิปรายการ #{transaction.id} ใช่หรือไม่?</>}
        warningText="หากปฏิเสธ สถานะบิลทั้งหมดจะกลับไปเป็นค้างชำระ ผู้ชำระจะต้องทำการแจ้งชำระเงินเข้ามาใหม่อีกครั้ง"
        confirmText="ใช่, ปฏิเสธสลิป"
      />
    </div>
  );
}
