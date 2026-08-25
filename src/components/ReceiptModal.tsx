"use client";

import { useEffect } from "react";
import { X, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceItem {
  id?: number;
  monthYear: string;
  amount: string | number;
  houseNumber?: string;
  ownerName?: string;
}

interface ReceiptData {
  id: number;
  amount: string | number;
  paidAt?: string | Date | null;
  createdAt?: string | Date | null;
  verifiedBy?: string | null;
  slipRefId?: string | null;
  houseNumber?: string;
  ownerName?: string;
  senderName?: string | null;
  paidVia?: string;
  zone?: string | null;
  invoices?: InvoiceItem[];
  months?: string[];
  receiptCode?: string | null;
  bookNumber?: number | null;
  receiptNumber?: number | null;
  fiscalYear?: string | null;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ReceiptData | null;
}

function formatThaiMonth(monthYear: string) {
  if (!monthYear) return "-";
  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const parts = monthYear.split("-");
  if (parts.length < 2) return monthYear;
  const [year, month] = parts;
  const monthIdx = parseInt(month, 10);
  const yearBe = parseInt(year, 10) + 543;
  return `${thaiMonths[monthIdx] || month} ${yearBe}`;
}

function formatThaiDateTime(date: Date) {
  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth() + 1];
  const yearBe = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${yearBe} เวลา ${hours}:${minutes} น.`;
}

function thaiBahtText(num: number): string {
  if (isNaN(num) || num === 0) return "ศูนย์บาทถ้วน";
  const thaiNums = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiUnits = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  const [intStr, decStr] = num.toFixed(2).split(".");
  
  function convertGroup(nStr: string): string {
    let res = "";
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr[i], 10);
      const unit = thaiUnits[len - i - 1];
      if (digit !== 0) {
        if (unit === "สิบ" && digit === 1) {
          res += "สิบ";
        } else if (unit === "สิบ" && digit === 2) {
          res += "ยี่สิบ";
        } else if (unit === "" && digit === 1 && len > 1 && parseInt(nStr[len - 2], 10) !== 0) {
          res += "เอ็ด";
        } else {
          res += thaiNums[digit] + unit;
        }
      }
    }
    return res;
  }

  let bahtPart = "";
  let intNum = intStr;
  if (intNum.length > 6) {
    const millionPart = intNum.slice(0, -6);
    intNum = intNum.slice(-6);
    bahtPart = convertGroup(millionPart) + "ล้าน" + convertGroup(intNum);
  } else {
    bahtPart = convertGroup(intNum);
  }
  bahtPart += "บาท";

  let satangPart = "";
  if (decStr && decStr !== "00") {
    satangPart = convertGroup(decStr) + "สตางค์";
  } else {
    satangPart = "ถ้วน";
  }

  return bahtPart + satangPart;
}

export default function ReceiptModal({ isOpen, onClose, item }: ReceiptModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const totalAmount = parseFloat(String(item.amount || "0"));
  const paidDate = item.paidAt ? new Date(item.paidAt) : item.createdAt ? new Date(item.createdAt) : new Date();

  // Prepare invoice rows
  const invoiceList: InvoiceItem[] = 
    item.invoices && item.invoices.length > 0 
      ? item.invoices 
      : item.months && item.months.length > 0 
        ? item.months.map((m, idx) => ({
            id: idx + 1,
            monthYear: m,
            amount: totalAmount / (item.months?.length || 1),
            houseNumber: item.houseNumber,
            ownerName: item.ownerName
          }))
        : [{
            id: 1,
            monthYear: new Date().toISOString().slice(0, 7),
            amount: totalAmount,
            houseNumber: item.houseNumber,
            ownerName: item.ownerName
          }];

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "";
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white print:static print:block print:z-auto">
        {/* Backdrop click to close */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 print:hidden"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:w-full print:shadow-none print:border-none print:rounded-none print:overflow-visible print:block"
        >
          {/* Header Action Bar (Screen Only) */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/90 backdrop-blur-xs shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft size={14} />
                <span>ย้อนกลับ</span>
              </button>
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                | ใบเสร็จรับเงิน #{item.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#5B58F2] hover:bg-[#4A47D1] rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>พิมพ์ใบเสร็จ (A4)</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Receipt Area */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 md:p-8 custom-scrollbar bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible print:block">
            {/* Beautifully Distributed A4 Sheet (Safe margins & Harmonious vertical flow) */}
            <div 
              id="printable-receipt"
              className="relative mx-auto bg-white sm:rounded-2xl p-6 sm:p-12 shadow-xs border border-slate-200/80 print:border-none print:shadow-none print:rounded-none overflow-hidden max-w-[210mm] min-h-[250mm] sm:min-h-[265mm] flex flex-col justify-between"
            >
              {/* Soft Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.065] z-0 overflow-hidden select-none">
                <span className="text-[85px] sm:text-[115px] md:text-[135px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
                  กองสาธารณสุข
                </span>
              </div>

              {/* Document Inner Flow */}
              <div className="relative z-10 flex flex-col justify-between flex-1 gap-6">
                
                {/* 1. TOP HEADER & METADATA */}
                <div className="space-y-6">
                  
                  {/* Centered Large Emblem & Official Titles */}
                  <div className="text-center flex flex-col items-center space-y-2 pb-5 border-b border-slate-100">
                    <img 
                      src="/nangrong-logo.png" 
                      alt="เทศบาลเมืองนางรอง" 
                      className="w-20 h-20 sm:w-22 sm:h-22 object-contain drop-shadow-xs mx-auto mb-1" 
                    />
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold tracking-wide">
                      เทศบาลเมืองนางรอง
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      ใบเสร็จรับเงินอิเล็กทรอนิกส์
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      กองสาธารณสุขและสิ่งแวดล้อม • อำเภอนางรอง จังหวัดบุรีรัมย์ 31110
                    </p>

                    {/* Compact Single-Line Sub-header Meta Bar */}
                    <div className="flex items-center justify-center gap-2.5 sm:gap-4 pt-1.5 text-xs text-slate-600 flex-wrap sm:flex-nowrap">
                      {item.receiptCode ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">รหัสกำกับ:</span>
                          <strong className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">{item.receiptCode}</strong>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 mr-1">เลขที่รายการ:</span>
                          <strong className="font-mono font-bold text-slate-900">#{item.id}</strong>
                        </div>
                      )}
                      <span className="text-slate-300">•</span>
                      <div>
                        <span className="text-slate-400 mr-1">วันที่ชำระ:</span>
                        <span className="text-slate-800 font-medium">
                          {paidDate.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold shrink-0">
                        <CheckCircle2 size={11} /> ชำระเงินเรียบร้อย
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Bento Info Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4.5 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm">
                    {/* Left: Payer Details */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลผู้ชำระเงิน (Billed To)</div>
                      <div className="text-base font-bold text-slate-900">{item.ownerName || "-"}</div>
                      <div className="text-slate-600 flex items-center gap-2">
                        <span>บ้านเลขที่: <strong className="text-slate-800 font-semibold">{item.houseNumber || "-"}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>ชุมชน: <span className="text-slate-700 font-medium">{item.zone || "ในเขตเทศบาล"}</span></span>
                      </div>
                    </div>

                    {/* Right: Transaction Details */}
                    <div className="space-y-1 sm:text-right sm:border-l sm:border-slate-200/60 sm:pl-5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลการชำระเงิน (Payment Info)</div>
                      <div className="text-slate-800 font-medium">
                        ผู้ทำรายการ: <span className="font-semibold text-slate-900">{item.senderName || item.ownerName || "-"}</span>
                      </div>
                      <div className="text-slate-600 text-xs">
                        ช่องทาง: <span className="text-slate-800 font-medium">{item.paidVia || "PromptPay QR (ออนไลน์)"}</span>
                        {item.slipRefId && <span className="font-mono text-[11px] text-slate-400 ml-1.5">({item.slipRefId})</span>}
                      </div>
                    </div>
                  </div>

                  {/* 2. MINIMALIST ITEMS TABLE */}
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                          <th className="py-3 px-4 text-left font-semibold w-12 sm:w-16 text-[11px] uppercase tracking-wider">ลำดับ</th>
                          <th className="py-3 px-4 text-left font-semibold text-[11px] uppercase tracking-wider">รายการ</th>
                          <th className="py-3 px-4 text-right font-semibold text-[11px] uppercase tracking-wider w-36 sm:w-44">จำนวนเงิน (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {invoiceList.map((inv, index) => (
                          <tr key={inv.id || index} className="hover:bg-slate-50/40">
                            <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">{String(index + 1).padStart(2, "0")}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                                ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                ประจำงวดเดือน: <span className="font-medium text-slate-700">{formatThaiMonth(inv.monthYear)}</span> {inv.id ? `(รหัสบิล: #${inv.id})` : ""}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-semibold text-sm sm:text-base text-slate-900">
                              {parseFloat(String(inv.amount || 0)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-900/80 bg-slate-50/60">
                          <td colSpan={2} className="py-3.5 px-4 text-slate-700">
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                              ยอดชำระสุทธิ (Total Amount)
                            </div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {thaiBahtText(totalAmount)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="text-[11px] font-medium text-slate-400">บาท (THB)</div>
                            <div className="font-mono font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                              ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                </div>

                {/* 3. BOTTOM SECTION: DISCLAIMER & SYMMETRICAL SIGNATURES */}
                <div className="space-y-5 pt-2">
                  
                  {/* Official Regulation Disclaimer */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 text-[11px] text-slate-500 leading-relaxed space-y-0.5 text-center sm:text-left">
                    <p className="font-medium text-slate-700">
                      • ใบเสร็จรับเงินฉบับนี้สร้างโดยระบบอิเล็กทรอนิกส์ของเทศบาลเมืองนางรอง มีผลสมบูรณ์ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535
                    </p>
                    <p>
                      • สอบถามข้อมูลเพิ่มเติม: กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง โทร. 044-624-526 หรือ 044-631-660 ในวันและเวลาราชการ
                    </p>
                  </div>

                  {/* Symmetrical Signatures */}
                  <div className="grid grid-cols-2 gap-8 sm:gap-16 pt-2">
                    <div className="text-center flex flex-col items-center">
                      <div className="h-10 flex items-end justify-center mb-1.5 w-44 sm:w-60 border-b border-slate-300 pb-1">
                        <span className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-full px-1">
                          {item.ownerName || "-"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">ผู้ชำระเงิน</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">(เจ้าของบ้าน / ผู้แทน)</p>
                    </div>

                    <div className="text-center flex flex-col items-center">
                      <div className="h-10 flex items-end justify-center mb-1.5 w-44 sm:w-60 border-b border-slate-300 pb-1">
                        <span className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-full px-1">
                          {item.verifiedBy === "line_bot" ? "ระบบรับชำระอิเล็กทรอนิกส์อัตโนมัติ" : item.verifiedBy || "เจ้าหน้าที่การเงินและบัญชี"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">ผู้รับเงิน / ผู้ตรวจสอบ</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">กองสาธารณสุขและสิ่งแวดล้อม</p>
                    </div>
                  </div>

                  {/* Clean Footer Timestamp */}
                  <div suppressHydrationWarning className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                    เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ • เทศบาลเมืองนางรอง • วันที่พิมพ์: {formatThaiDateTime(new Date())}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
