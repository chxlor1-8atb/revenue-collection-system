"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ImageOff, Eye, Calendar, Home, User, Hash, Clock, AlertTriangle, Download } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import SlipModalButton from "@/components/SlipModalButton";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export interface TransactionReview {
  id: number;
  slipStatus: string;
  amountClaimedByPayer?: string;
  slipImageUrl?: string;
  slipRefId?: string;
  createdAt: string;
  amount: string;
  payerNote?: string;
  invoices: {
    id: number;
    houseNumber: string;
    ownerName?: string;
    monthYear: string;
    amount: string;
  }[];
}

export default function SlipReviewForm({ 
  transaction, 
  onReviewed,
  layout = "detailed"
}: { 
  transaction: TransactionReview;
  onReviewed?: () => void;
  layout?: "detailed" | "grid";
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState(transaction.amountClaimedByPayer || "0");
  const [rejectReason, setRejectReason] = useState("ยอดเงินไม่ตรงกับที่เรียกเก็บ");
  const router = useRouter();

  // Lock the transaction when the form is mounted (e.g. user expands it or views it in detailed mode)
  useEffect(() => {
    if (!transaction || transaction.slipStatus !== 'pending') return;
    
    // Attempt to lock
    fetch(`/api/transactions/${transaction.id}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock: true })
    }).catch(() => {});

    return () => {
      // Release lock on unmount
      fetch(`/api/transactions/${transaction.id}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: false }),
        keepalive: true
      }).catch(() => {});
    };
  }, [transaction?.id]);


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
          status,
          rejectReason: status === 'rejected' ? rejectReason : undefined,
        verifiedAmount: status === 'verified' ? verifiedAmount : undefined
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

  if (layout === "grid") {
    const firstInvoice = transaction.invoices?.[0];
    const totalInvoices = transaction.invoices?.length || 0;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-[#5B58F2]/40 hover:shadow-md transition-all p-5 flex flex-col justify-between h-full group">
        <div>
          {/* Card Top: ID & Ref */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              #{transaction.id}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {new Date(transaction.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Slip Image Thumbnail */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xs border border-slate-200 bg-slate-50 mb-3 group/img">
            {hasSlipImage ? (
              <>
                <img 
                  src={transaction.slipImageUrl} 
                  alt={`Slip #${transaction.id}`} 
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-2">
                  <SlipModalButton imageUrl={transaction.slipImageUrl || ""}>
                    <span className="px-3 py-1.5 bg-white/95 text-slate-900 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                      <Eye size={13} /> ขยายดู
                    </span>
                  </SlipModalButton>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                <ImageOff size={24} />
                <span className="text-[11px]">ไม่มีรูปสลิป</span>
              </div>
            )}

            {transaction.slipRefId && (
              <div className="absolute bottom-1.5 left-1.5 right-1.5 text-center">
                <span className="inline-block truncate max-w-full font-mono text-[10px] font-bold text-slate-700 bg-white/95 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  Ref: {transaction.slipRefId}
                </span>
              </div>
            )}
          </div>

          {/* House Info */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs">
                {firstInvoice ? `บ้าน ${firstInvoice.houseNumber}` : "ไม่ระบุบ้าน"}
              </span>
              {totalInvoices > 1 && (
                <span className="text-[10px] font-bold text-[#5B58F2] bg-[#EEF0FF] px-2 py-0.5 rounded-full">
                  +{totalInvoices - 1} บิล
                </span>
              )}
            </div>
            
            <div className="font-bold text-slate-800 text-sm truncate mt-1">
              {firstInvoice?.ownerName || "ไม่ระบุชื่อ"}
            </div>
            
            <div className="text-xs text-slate-500 truncate">
              {firstInvoice ? `งวด: ${formatThaiMonth(firstInvoice.monthYear)}` : "-"}
            </div>
          </div>
        </div>

        {/* Card Footer: Amount & Quick Actions */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">ยอดเงินโอน</span>
            <span className="font-mono font-bold text-base text-emerald-700">
              ฿{parseFloat(transaction.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReview('verified')}
              disabled={isSubmitting}
              className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> อนุมัติ
            </button>
            <button
              onClick={() => handleReview('rejected')}
              disabled={isSubmitting}
              className="h-9 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center transition-all disabled:opacity-50"
              title="ปฏิเสธสลิป"
            >
              <XCircle size={14} />
            </button>
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
                <SlipModalButton imageUrl={transaction.slipImageUrl || ""}>
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
