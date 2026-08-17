"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, Loader2, AlertCircle, FileText } from "lucide-react";
import MonthPicker from "@/components/MonthPicker";

export default function GenerateInvoiceButton() {
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const router = useRouter();

  const handleOpenModal = () => {
    setShowModal(true);
    setStatus("idle");
    setMessage("");
    setMonth(new Date().toISOString().slice(0, 7));
  };

  const handleCloseModal = () => {
    if (isGenerating) return;
    setShowModal(false);
    if (status === "success") {
      router.refresh();
    }
  };

  const handleGenerate = async () => {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      setStatus("error");
      setMessage("รูปแบบเดือน/ปี ไม่ถูกต้อง");
      return;
    }

    setIsGenerating(true);
    setStatus("idle");
    
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthYear: month, amount: "20.00" })
      });

      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setMessage(`สร้างบิลประจำเดือน ${month} จำนวน ${data.count} ใบเรียบร้อยแล้ว`);
      } else {
        setStatus("error");
        setMessage(`เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleOpenModal} 
        className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
      >
        <FileText size={14} />
        สร้างบิลประจำเดือน (ทุกบ้าน)
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                🧾 สร้างบิลประจำเดือนใหม่
              </h3>
              {!isGenerating && (
                <button 
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6">
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                  <h4 className="text-xl font-bold text-slate-800 mb-2">สำเร็จ!</h4>
                  <p className="text-slate-600 mb-6">{message}</p>
                  <button
                    onClick={handleCloseModal}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    ระบบจะทำการสร้างบิลค่าขยะรอบเดือนที่คุณเลือก ให้กับ <strong>บ้านทุกหลัง</strong> ในระบบโดยอัตโนมัติ (ยอดเงิน 20 บาท/หลัง)
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ระบุเดือน/ปี สำหรับบิลที่จะสร้าง <span className="text-red-500">*</span>
                    </label>
                    <MonthPicker
                      value={month}
                      onChange={setMonth}
                      disabled={isGenerating}
                      placement="top"
                    />
                  </div>

                  {status === "error" && (
                    <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{message}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isGenerating}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#1F2E22" }}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          กำลังสร้างบิล...
                        </>
                      ) : (
                        "ยืนยันสร้างบิล"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
