"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Send, 
  Building2, 
  Calendar, 
  Zap, 
  ChevronRight,
  Info,
  Layers,
  Check,
  CalendarClock,
  Globe
} from "lucide-react";
import MonthPicker from "@/components/MonthPicker";

const DEFAULT_ZONES = [
  "หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", 
  "วัดกลาง", "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", 
  "ถนนหักพัฒนา", "สระหญ้าม้า", "โคกสูง", "โคกหลวงเต่า", "ทุ่งแหลม", 
  "ดอนศิลา", "บ้านแพงพัฒนา", "ใหม่สามัคคี", "ศาลาหนองกราด", "ชุมชนร่วมใจ"
];

export default function GenerateInvoiceButton() {
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form State
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStr = nextMonthDate.toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonthStr);
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [sendLineNotification, setSendLineNotification] = useState<boolean>(false);

  // Status & Result State
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [resultData, setResultData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  const router = useRouter();

  const handleOpenModal = () => {
    setShowModal(true);
    setStatus("idle");
    setErrorMessage("");
    setResultData(null);
    setMonth(currentMonthStr);
    setSelectedZone("ALL");
    setSendLineNotification(false);
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
      setErrorMessage("กรุณาระบุเดือน/ปี ให้ถูกต้อง");
      return;
    }

    setIsGenerating(true);
    setStatus("idle");
    setErrorMessage("");
    
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          monthYear: month, 
          amount: "20.00",
          zone: selectedZone,
          sendLineNotification: sendLineNotification
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus("success");
        setResultData(data);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "เกิดข้อผิดพลาดในการสร้างบิล");
      }
    } catch (err: any) {
      console.error("Generate Invoice Error:", err);
      setStatus("error");
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleOpenModal} 
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-md shadow-slate-900/20 active:scale-98 cursor-pointer"
      >
        <FileText size={16} />
        <span>สร้างบิลประจำเดือน</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/90 animate-in zoom-in-95 duration-150 relative">
            
            {/* Modal Header */}
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-[#5B58F2] flex items-center justify-center font-black text-sm">
                  📄
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    สร้างบิลประจำเดือน
                  </h3>
                  <p className="text-xs text-slate-500">ออกบิลค่าธรรมเนียมขยะให้กับลูกบ้าน</p>
                </div>
              </div>

              {!isGenerating && (
                <button 
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              
              {status === "success" && resultData ? (
                /* Success Result Screen */
                <div className="py-3 text-center space-y-4 animate-in fade-in duration-200">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900">สร้างบิลสำเร็จเรียบร้อย!</h4>
                    <p className="text-xs text-slate-500 mt-0.5">รอบเดือน {resultData.formattedMonth}</p>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1 text-left">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div className="text-[11px] text-slate-500 font-medium">สร้างบิลใหม่</div>
                      <div className="text-lg font-black text-emerald-700 font-mono">
                        {resultData.createdCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">หลัง</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div className="text-[11px] text-slate-500 font-medium">ยอดเรียกเก็บรวม</div>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        ฿{resultData.totalBilledAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {resultData.skippedCount > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 col-span-2 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>ข้ามบ้านที่มีบิลเดือนนี้อยู่แล้ว:</span>
                        <span className="font-bold text-slate-800">{resultData.skippedCount.toLocaleString()} หลัง</span>
                      </div>
                    )}

                    {resultData.lineNotifiedCount > 0 && (
                      <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/70 col-span-2 text-[11px] text-emerald-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Send size={13} className="text-emerald-600" /> ส่งแจ้งเตือน LINE สำเร็จ:
                        </span>
                        <span className="font-bold text-emerald-800">{resultData.lineNotifiedCount.toLocaleString()} หลัง</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    เสร็จสิ้น & ปิดหน้าต่าง
                  </button>
                </div>
              ) : (
                /* Form Builder Screen */
                <>
                  {/* 1. Quick Month Picker */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" /> รอบเดือนที่จะสร้างบิล
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMonth(currentMonthStr)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            month === currentMonthStr
                              ? "bg-slate-800 text-white border-slate-800 font-bold"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        ><Zap size={10} className="inline mr-1" /> เดือนนี้</button>
                        <button
                          type="button"
                          onClick={() => setMonth(nextMonthStr)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            month === nextMonthStr
                              ? "bg-slate-800 text-white border-slate-800 font-bold"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        ><CalendarClock size={10} className="inline mr-1" /> เดือนหน้า</button>
                      </div>
                    </div>

                    <MonthPicker
                      value={month}
                      onChange={setMonth}
                      disabled={isGenerating}
                      placement="bottom"
                    />
                  </div>

                  {/* 2. Target Scope Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-500" /> ขอบเขตพื้นที่เป้าหมาย
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedZone("ALL")}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedZone === "ALL"
                            ? "bg-slate-50 border-slate-800 ring-1 ring-slate-800 text-slate-900 font-bold shadow-sm"
                            : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="text-xs"><Globe size={13} className="inline mr-1.5 text-slate-500" /> ทุกชุมชน (20)</div>
                        {selectedZone === "ALL" && <Check size={14} className="text-slate-700" />}
                      </button>

                      <div className="relative">
                        <select
                          value={selectedZone === "ALL" ? "" : selectedZone}
                          onChange={(e) => setSelectedZone(e.target.value || "ALL")}
                          className={`w-full p-2.5 rounded-lg border text-xs font-medium appearance-none cursor-pointer outline-hidden transition-all ${
                            selectedZone !== "ALL"
                              ? "bg-slate-50 border-slate-800 ring-1 ring-slate-800 text-slate-900 font-bold shadow-sm"
                              : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                          }`}
                        >
                          <option value="">📍 เลือกเฉพาะชุมชน...</option>
                          {DEFAULT_ZONES.map((z) => (
                            <option key={z} value={z}>ชุมชน{z}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. Smart Option: LINE Notification */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendLineNotification}
                        onChange={(e) => setSendLineNotification(e.target.checked)}
                        className="mt-0.5 rounded-md text-[#5B58F2] focus:ring-[#5B58F2] cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Send size={13} className="text-emerald-600" />
                          ส่งบิลแจ้งเตือนเข้า LINE ของลูกบ้านทันที
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ระบบจะส่งการ์ด QR Code พร้อมยอดเงินไปยังลูกบ้านที่ผูก LINE ไว้แล้วโดยอัตโนมัติ
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Error Message */}
                  {status === "error" && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200 flex items-start gap-2 animate-in fade-in duration-150">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={isGenerating}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      ยกเลิก
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-md shadow-slate-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>กำลังประมวลผลสร้างบิล...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={15} />
                          <span>ยืนยันสร้างบิลทันที</span>
                        </>
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
