"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Calendar, DollarSign, FileCheck2, User, Home } from "lucide-react";
import AnimatedButton from "@/components/AnimatedButton";

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
    <div className="receipt-card border border-slate-200 bg-white shadow-sm p-6 rounded-xl font-sans">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left side: Slip Image */}
        <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-slate-200/60">
          <a href={transaction.slipImageUrl} target="_blank" rel="noopener noreferrer" className="relative group block overflow-hidden rounded-lg">
            <img 
              src={transaction.slipImageUrl} 
              alt="Slip" 
              className="max-h-80 w-auto rounded-lg border border-slate-200 transition-transform duration-300 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-white transition-opacity duration-200">
              คลิกเพื่อดูภาพขนาดเต็ม
            </div>
          </a>
        </div>
        
        {/* Right side: Details & Actions */}
        <div className="md:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-sans font-bold text-lg text-slate-800">ตรวจสอบหลักฐานการโอน</h3>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                  รหัสอ้างอิง: #{transaction.id}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-2xl text-teal-600">
                  ฿{parseFloat(transaction.amount).toFixed(2)}
                </span>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider mt-0.5 font-sans">ยอดเงินในสลิป</p>
              </div>
            </div>
            
            <div className="perforation-line" style={{ margin: "0.5rem 0 1rem 0" }}></div>
 
            <div className="mb-4">
              <p className="font-sans text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-teal-600" />
                บิลค่าธรรมเนียมขยะมูลฝอยที่แนบชำระ:
              </p>
              <ul className="font-sans text-xs space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {transaction.invoices.map((inv: any) => (
                  <li key={inv.id} className="flex justify-between items-center text-slate-600 py-1.5 border-b border-slate-200/50 last:border-b-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-slate-400" />
                        บ้านเลขที่ {inv.houseNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        เจ้าบ้าน: {inv.ownerName} • รอบเดือน {inv.monthYear}
                      </span>
                    </div>
                    <span className="font-mono text-slate-700 font-bold">
                      ฿{parseFloat(inv.amount).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
 
            <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-5 font-sans">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>วันเวลาอัปโหลดสลิป: {new Date(transaction.createdAt).toLocaleString('th-TH')}</span>
            </div>
          </div>
 
          <div className="flex gap-3">
            <AnimatedButton 
              onClick={() => handleReview('verified')}
              disabled={isSubmitting}
              className="btn btn-primary flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={14} /> อนุมัติการชำระเงิน
            </AnimatedButton>
            <AnimatedButton 
              onClick={() => handleReview('rejected')}
              disabled={isSubmitting}
              className="btn flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fee2e2" }}
            >
              <XCircle size={14} /> ปฏิเสธสลิปไม่ถูกต้อง
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
}
