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
          className="relative w-full max-w-3xl max-h-[94vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:w-full print:shadow-none print:border-none print:rounded-none print:overflow-visible print:block"
        >
          {/* Header Action Bar (Screen Only) */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/90 backdrop-blur-xs shrink-0 print:hidden">
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
          <div className="flex-1 overflow-y-auto p-2 sm:p-5 custom-scrollbar bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible print:block">
            {/* Guaranteed Single-Page A4 Sheet (Compact & Beautiful) */}
            <div 
              id="printable-receipt"
              className="relative mx-auto bg-white sm:rounded-2xl pt-6 sm:pt-8 px-6 sm:px-10 pb-6 sm:pb-8 shadow-xs border border-slate-200/80 print:border-none print:shadow-none print:pt-6 print:px-8 print:pb-4 print:rounded-none overflow-hidden max-w-[210mm] flex flex-col justify-between"
            >
              {/* Soft Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0 overflow-hidden select-none">
                <span className="text-[75px] sm:text-[105px] md:text-[120px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
                  กองสาธารณสุข
                </span>
              </div>

              {/* Document Inner Flow */}
              <div className="relative z-10 flex flex-col justify-between flex-1 gap-4.5">
                
                {/* 1. COMPACT TOP HEADER & METADATA */}
                <div className="space-y-4">
                  
                  {/* Centered Compact Emblem & Title */}
                  <div className="text-center flex flex-col items-center space-y-1.5 pb-3 border-b border-slate-100">
                    <img 
                      src="/nangrong-logo.png" 
                      alt="เทศบาลเมืองนางรอง" 
                      className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-xs mx-auto" 
                    />
                    <div className="text-xs font-semibold text-slate-500 tracking-wide">
                      เทศบาลเมืองนางรอง • กองสาธารณสุขและสิ่งแวดล้อม
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      ใบเสร็จรับเงินอิเล็กทรอนิกส์ (ชำระค่าธรรมเนียมขยะ)
                    </h1>

                    {/* Compact Sub-header Meta Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 font-medium mr-1">เลขที่รายการ:</span>
                        <strong className="font-mono font-bold text-slate-900">#{item.id}</strong>
                      </div>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <div>
                        <span className="text-slate-400 font-medium mr-1">วันที่ชำระ:</span>
                        <span className="text-slate-800 font-medium">{formatThaiDateTime(paidDate)}</span>
                      </div>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                        <CheckCircle2 size={11} /> ชำระเงินเรียบร้อย
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Bento Info Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                    {/* Left: Payer Details */}
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลผู้ชำระเงิน (Billed To)</div>
                      <div className="text-sm font-bold text-slate-900">{item.ownerName || "-"}</div>
                      <div className="text-slate-600 flex items-center gap-2 text-[11px]">
                        <span>บ้านเลขที่: <strong className="text-slate-800 font-semibold">{item.houseNumber || "-"}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>ชุมชน: <span className="text-slate-700 font-medium">{item.zone || "ในเขตเทศบาล"}</span></span>
                      </div>
                    </div>

                    {/* Right: Transaction Details */}
                    <div className="space-y-0.5 sm:text-right sm:border-l sm:border-slate-200/60 sm:pl-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลการชำระเงิน (Payment Info)</div>
                      <div className="text-slate-800 font-medium text-xs">
                        ผู้ทำรายการ: <span className="font-semibold text-slate-900">{item.senderName || item.ownerName || "-"}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        ช่องทาง: <span className="text-slate-800 font-medium">{item.paidVia || "PromptPay QR"}</span>
                        {item.slipRefId && <span className="font-mono text-[10px] text-slate-400 ml-1">({item.slipRefId})</span>}
                      </div>
                    </div>
                  </div>

                  {/* 2. MINIMALIST ITEMS TABLE */}
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                          <th className="py-2 px-3 text-left font-semibold w-12 text-[10px] uppercase tracking-wider">ลำดับ</th>
                          <th className="py-2 px-3 text-left font-semibold text-[10px] uppercase tracking-wider">รายการ</th>
                          <th className="py-2 px-3 text-right font-semibold text-[10px] uppercase tracking-wider w-32 sm:w-36">จำนวนเงิน (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {invoiceList.map((inv, index) => (
                          <tr key={inv.id || index} className="hover:bg-slate-50/40">
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{String(index + 1).padStart(2, "0")}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                                ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ประจำงวดเดือน: <span className="font-medium text-slate-700">{formatThaiMonth(inv.monthYear)}</span> {inv.id ? `(รหัสบิล: #${inv.id})` : ""}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-xs sm:text-sm text-slate-900">
                              {parseFloat(String(inv.amount || 0)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-900/80 bg-slate-50/60">
                          <td colSpan={2} className="py-2.5 px-3 text-slate-700">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                              ยอดชำระสุทธิ (Total Amount)
                            </div>
                            <div className="font-bold text-slate-900 text-xs">
                              {thaiBahtText(totalAmount)}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="text-[10px] font-medium text-slate-400">บาท (THB)</div>
                            <div className="font-mono font-black text-base sm:text-lg text-slate-900 tracking-tight">
                              ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                </div>

                {/* 3. BOTTOM SECTION: DISCLAIMER & SYMMETRICAL SIGNATURES */}
                <div className="space-y-3.5 pt-1">
                  
                  {/* Compact Regulation Disclaimer */}
                  <div className="p-2.5 rounded-lg bg-slate-50/60 text-[10px] text-slate-400 leading-relaxed space-y-0.5 text-center sm:text-left">
                    <p className="font-medium text-slate-600">
                      • ใบเสร็จรับเงินฉบับนี้สร้างโดยระบบอิเล็กทรอนิกส์ของเทศบาลเมืองนางรอง มีผลสมบูรณ์ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535
                    </p>
                    <p>
                      • สอบถามข้อมูลเพิ่มเติม: กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง โทร. 044-624-526 หรือ 044-631-660 ในวันและเวลาราชการ
                    </p>
                  </div>

                  {/* Symmetrical Minimal Signatures */}
                  <div className="grid grid-cols-2 gap-6 sm:gap-12 pt-1">
                    <div className="text-center flex flex-col items-center">
                      <div className="h-8 flex items-end justify-center mb-1 w-40 sm:w-52 border-b border-slate-300 pb-0.5">
                        <span className="text-slate-800 font-medium text-xs truncate max-w-full px-1">
                          {item.ownerName || "-"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">ผู้ชำระเงิน</p>
                      <p className="text-[10px] text-slate-400">(เจ้าของบ้าน / ผู้แทน)</p>
                    </div>

                    <div className="text-center flex flex-col items-center">
                      <div className="h-8 flex items-end justify-center mb-1 w-40 sm:w-52 border-b border-slate-300 pb-0.5">
                        <span className="text-slate-800 font-semibold text-xs truncate max-w-full px-1">
                          {item.verifiedBy === "line_bot" ? "ระบบรับชำระอิเล็กทรอนิกส์อัตโนมัติ" : item.verifiedBy || "เจ้าหน้าที่การเงินและบัญชี"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">ผู้รับเงิน / ผู้ตรวจสอบ</p>
                      <p className="text-[10px] text-slate-400">กองสาธารณสุขและสิ่งแวดล้อม</p>
                    </div>
                  </div>

                  {/* Clean Footer Timestamp */}
                  <div suppressHydrationWarning className="text-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
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
