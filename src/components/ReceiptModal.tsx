"use client";

import { useEffect } from "react";
import { X, Printer, ArrowLeft } from "lucide-react";
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
          {/* Header Bar (Screen Only) */}
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
                onClick={() => window.print()}
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

          {/* Scrollable Receipt Body */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 md:p-8 custom-scrollbar bg-slate-100/60 print:bg-white print:p-0 print:overflow-visible print:block">
            {/* Pure Document Sheet with Full Vertical Balance */}
            <div 
              id="printable-receipt"
              className="relative mx-auto bg-white border border-slate-300 sm:rounded-2xl p-6 sm:p-12 shadow-xs print:border-none print:shadow-none print:p-0 print:rounded-none overflow-hidden max-w-[210mm] min-h-[250mm] sm:min-h-[265mm] flex flex-col justify-between"
            >
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0 overflow-hidden select-none">
                <span className="text-[80px] sm:text-[120px] md:text-[140px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
                  กองสาธารณสุข
                </span>
              </div>

              {/* Inner Content with Flex Space Distribution */}
              <div className="relative z-10 flex flex-col h-full justify-between flex-1 gap-8">
                <div>
                  {/* Official Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b-2 border-slate-800 pb-6 mb-6 gap-4 sm:gap-0">
                    <div className="flex gap-5 items-center">
                      <img 
                        src="/nangrong-logo.png" 
                        alt="เทศบาลเมืองนางรอง" 
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0" 
                      />
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">ใบเสร็จรับเงิน</h1>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mt-1">เทศบาลเมืองนางรอง</h2>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">กองสาธารณสุขและสิ่งแวดล้อม อ.นางรอง จ.บุรีรัมย์ 31110</p>
                      </div>
                    </div>
                    <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-baseline sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                      <div className="text-2xl sm:text-4xl font-black tracking-widest text-slate-300 sm:mb-2 order-2 sm:order-1">
                        ชำระค่าขยะ
                      </div>
                      <div className="order-1 sm:order-2 space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-800">เลขที่รายการ: #{item.id}</p>
                        <p className="text-xs sm:text-sm text-slate-600">
                          วันที่ออกใบเสร็จ: {paidDate.toLocaleString("th-TH", { 
                            day: "numeric", month: "long", year: "numeric", 
                            hour: "2-digit", minute: "2-digit" 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info Box */}
                  <div className="border border-slate-300 rounded-xl p-4 sm:p-5 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm mb-6">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลผู้ชำระเงิน</div>
                      <div className="text-base font-bold text-slate-900">{item.ownerName || "-"}</div>
                      <div className="text-slate-600">บ้านเลขที่: <span className="font-semibold text-slate-800">{item.houseNumber || "-"}</span></div>
                      <div className="text-slate-600">ชุมชน / โซน: <span className="font-medium text-slate-700">{item.zone || "ในเขตเทศบาลเมืองนางรอง"}</span></div>
                    </div>
                    <div className="space-y-1.5 sm:text-right sm:border-l sm:border-slate-200 sm:pl-6">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลการรับชำระ</div>
                      <div className="text-slate-800 font-medium">ผู้ทำรายการ: <span className="font-semibold text-slate-900">{item.senderName || item.ownerName || "-"}</span></div>
                      <div className="text-slate-600">ช่องทางการชำระ: <span className="font-semibold text-slate-800">{item.paidVia || "PromptPay QR (ออนไลน์)"}</span></div>
                      {item.slipRefId && (
                        <div className="text-slate-500 text-[11px] font-mono">รหัสอ้างอิง (Ref): {item.slipRefId}</div>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-hidden border border-slate-300 rounded-xl mb-6">
                    <table className="w-full border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                          <th className="py-3 px-3 text-left font-bold w-12 sm:w-16">ลำดับ</th>
                          <th className="py-3 px-4 text-left font-bold">รายการชำระเงิน</th>
                          <th className="py-3 px-4 text-right font-bold w-36 sm:w-44">จำนวนเงิน (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {invoiceList.map((inv, index) => (
                          <tr key={inv.id || index} className="hover:bg-slate-50/50">
                            <td className="py-4 px-3 text-slate-600 text-center font-medium">{index + 1}</td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900 text-sm sm:text-base">ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย</div>
                              <div className="text-xs text-slate-500 mt-1">
                                ประจำงวดเดือน: <span className="font-semibold text-slate-700">{formatThaiMonth(inv.monthYear)}</span> {inv.id ? `(รหัสบิล: #${inv.id})` : ""}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-sm sm:text-base text-slate-900">
                              {parseFloat(String(inv.amount || 0)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t-2 border-slate-800">
                          <td colSpan={2} className="py-4 px-4 text-slate-800 font-bold text-xs sm:text-sm">
                            <span className="text-slate-500 font-normal mr-2">จำนวนเงินรวม (ตัวอักษร):</span>
                            <span className="text-slate-900 font-bold">({thaiBahtText(totalAmount)})</span>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-black text-base sm:text-xl text-slate-900">
                            ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Bottom Section: Notes & Signatures */}
                <div className="mt-auto pt-4 space-y-6">
                  {/* Official Notice */}
                  <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/40 text-[11px] sm:text-xs text-slate-500 leading-relaxed space-y-1">
                    <div className="font-bold text-slate-700">หมายเหตุและระเบียบปฏิบัติ:</div>
                    <p>1. ใบเสร็จรับเงินนี้ออกโดยระบบอิเล็กทรอนิกส์ของเทศบาลเมืองนางรอง มีผลสมบูรณ์ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535</p>
                    <p>2. ได้รับเงินถูกต้องเรียบร้อยแล้ว โปรดเก็บรักษาเอกสารฉบับนี้ไว้เป็นหลักฐานการชำระเงิน</p>
                    <p>3. สอบถามข้อมูลเพิ่มเติม: กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง โทร. 044-631-414 ในวันและเวลาราชการ</p>
                  </div>

                  {/* Symmetrical Signatures Block */}
                  <div className="grid grid-cols-2 gap-8 sm:gap-16 pt-2">
                    <div className="text-center flex flex-col items-center">
                      <div className="h-12 flex items-end justify-center mb-2 w-48 sm:w-64 border-b border-slate-400 border-dashed pb-1.5">
                        <span className="text-slate-900 font-semibold text-xs sm:text-sm truncate max-w-full px-2">
                          {item.ownerName || "-"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">ผู้ชำระเงิน</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">(เจ้าของบ้าน / ตัวแทนผู้ชำระ)</p>
                    </div>

                    <div className="text-center flex flex-col items-center">
                      <div className="h-12 flex items-end justify-center mb-2 w-48 sm:w-64 border-b border-slate-400 border-dashed pb-1.5">
                        <span className="text-slate-900 font-bold text-xs sm:text-sm truncate max-w-full px-2">
                          {item.verifiedBy === "line_bot" ? "ระบบรับชำระอิเล็กทรอนิกส์อัตโนมัติ" : item.verifiedBy || "เจ้าหน้าที่การเงินและบัญชี"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">ผู้รับเงิน / ผู้ตรวจสอบ</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">กองสาธารณสุขและสิ่งแวดล้อม</p>
                    </div>
                  </div>

                  {/* Print Notice Footer */}
                  <div suppressHydrationWarning className="text-center text-[10px] sm:text-xs text-slate-400 pt-3 border-t border-slate-200/80">
                    เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ • เทศบาลเมืองนางรอง • วันที่พิมพ์: {new Date().toLocaleString("th-TH")}
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
