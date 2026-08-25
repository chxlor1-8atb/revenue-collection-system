import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PrintTrigger from "./PrintTrigger";
import { CheckCircle2 } from "lucide-react";

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

export default async function ReceiptPage(props: { params: Promise<{ txId: string }> }) {
  const params = await props.params;
  const txId = parseInt(params.txId, 10);
  if (isNaN(txId)) return notFound();

  // Fetch transaction
  const txList = await db.select().from(transactions).where(eq(transactions.id, txId));
  if (txList.length === 0) return notFound();
  const tx = txList[0];

  // Fetch invoices and house
  const relatedInvoices = await db.select({
    id: invoices.id,
    monthYear: invoices.monthYear,
    amount: invoices.amount,
    houseNumber: houses.houseNumber,
    ownerName: houses.ownerName,
    zone: houses.zone,
  })
    .from(invoices)
    .innerJoin(houses, eq(invoices.houseId, houses.id))
    .where(eq(invoices.transactionId, txId));

  const house = relatedInvoices.length > 0 ? relatedInvoices[0] : {
    houseNumber: "-",
    ownerName: "-",
    zone: "-"
  };

  // Fetch line messages (for sender name)
  const lineMsgs = await db.select().from(lineMessages).where(eq(lineMessages.transactionId, txId));
  const senderName = lineMsgs.length > 0 ? lineMsgs[0].senderName : (house.ownerName || "-");
  const paidVia = tx.verifiedBy === "line_bot" || lineMsgs.length > 0 ? "LINE Bot (ออนไลน์)" : tx.verifiedBy === "admin_cash" ? "เงินสด (หน้าเคาน์เตอร์)" : "PromptPay QR (เว็บไซต์)";

  const totalAmount = parseFloat(tx.amount || "0");
  const paidDate = tx.paidAt || tx.createdAt || new Date();

  return (
    <div className="min-h-screen bg-slate-200 py-4 sm:py-8 font-sans print:bg-white print:py-0">
      <PrintTrigger />
      
      <div 
        id="printable-receipt"
        className="max-w-[210mm] mx-auto bg-white pt-8 sm:pt-10 px-6 sm:px-12 pb-8 sm:pb-10 shadow-md print:shadow-none print:p-0 print:m-0 border border-slate-200/80 print:border-none relative overflow-hidden flex flex-col justify-between"
      >
        {/* Soft Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.065] z-0 overflow-hidden select-none">
          <span className="text-[80px] sm:text-[110px] md:text-[130px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
            กองสาธารณสุข
          </span>
        </div>

        {/* Document Inner Flow */}
        <div className="relative z-10 flex flex-col justify-between flex-1 gap-6">
          
          {/* 1. TOP HEADER (CENTERED COMPACT LOGO) & METADATA */}
          <div className="space-y-5">
            
            {/* Centered Logo & Titles */}
            <div className="text-center flex flex-col items-center space-y-2 pb-4 border-b border-slate-100">
              <img 
                src="/nangrong-logo.png" 
                alt="เทศบาลเมืองนางรอง" 
                className="w-20 h-20 sm:w-22 sm:h-22 object-contain drop-shadow-xs mx-auto mb-1" 
              />
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tracking-wide">
                เทศบาลเมืองนางรอง
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                ใบเสร็จรับเงินอิเล็กทรอนิกส์
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                กองสาธารณสุขและสิ่งแวดล้อม • อำเภอนางรอง จังหวัดบุรีรัมย์ 31110
              </p>

              {/* Sub-header Meta Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-5 pt-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 font-medium mr-1">รายการ:</span>
                  <strong className="text-slate-800 font-semibold">ค่าธรรมเนียมจัดเก็บขยะ</strong>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div>
                  <span className="text-slate-400 font-medium mr-1">เลขที่:</span>
                  <strong className="font-mono font-bold text-slate-900">#{tx.id}</strong>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div>
                  <span className="text-slate-400 font-medium mr-1">วันที่:</span>
                  <span className="text-slate-800 font-medium">{paidDate.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                  <CheckCircle2 size={12} /> ชำระเงินเรียบร้อย
                </div>
              </div>
            </div>

            {/* 2-Column Bento Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 sm:p-4.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลผู้ชำระเงิน (Billed To)</div>
                <div className="text-sm sm:text-base font-bold text-slate-900">{house.ownerName || "-"}</div>
                <div className="text-slate-600 flex items-center gap-2 text-xs">
                  <span>บ้านเลขที่: <strong className="text-slate-800 font-semibold">{house.houseNumber || "-"}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>ชุมชน: <span className="text-slate-700 font-medium">{house.zone || "ในเขตเทศบาล"}</span></span>
                </div>
              </div>

              <div className="space-y-1 sm:text-right sm:border-l sm:border-slate-200/60 sm:pl-5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลการชำระเงิน (Payment Info)</div>
                <div className="text-slate-800 font-medium text-xs sm:text-sm">
                  เวลาที่ชำระ: <span className="font-semibold text-slate-900">{paidDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.</span>
                </div>
                <div className="text-slate-600 text-xs">
                  ช่องทาง: <span className="text-slate-800 font-medium">{paidVia}</span>
                  {tx.slipRefId && <span className="font-mono text-[10px] text-slate-400 ml-1">({tx.slipRefId})</span>}
                </div>
              </div>
            </div>

            {/* 2. MINIMALIST ITEMS TABLE */}
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
                    <th className="py-2.5 px-3.5 text-left font-semibold w-12 sm:w-16 text-[10px] sm:text-[11px] uppercase tracking-wider">ลำดับ</th>
                    <th className="py-2.5 px-3.5 text-left font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider">รายการ</th>
                    <th className="py-2.5 px-3.5 text-right font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider w-36 sm:w-44">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {relatedInvoices.length > 0 ? (
                    relatedInvoices.map((inv, index) => (
                      <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-3.5 text-slate-400 font-mono text-xs">{String(index + 1).padStart(2, "0")}</td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            ประจำงวดเดือน: <span className="font-medium text-slate-700">{formatThaiMonth(inv.monthYear)}</span> (รหัสบิล: #{inv.id})
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-xs sm:text-sm text-slate-900">
                          {parseFloat(inv.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 px-3.5 text-slate-400 font-mono text-xs">01</td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">ชำระตามรายการธุรกรรม #{tx.id}</div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-semibold text-xs sm:text-sm text-slate-900">
                        {totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900/80 bg-slate-50/60">
                    <td colSpan={2} className="py-3.5 px-3.5 text-slate-700">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                        ยอดชำระสุทธิ (Total Amount)
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {thaiBahtText(totalAmount)}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <div className="text-[10px] font-medium text-slate-400">บาท (THB)</div>
                      <div className="font-mono font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                        ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

          {/* 3. BOTTOM SECTION */}
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-50/60 text-[10px] sm:text-[11px] text-slate-400 leading-relaxed space-y-0.5 text-center sm:text-left">
              <p className="font-medium text-slate-600">
                • ใบเสร็จรับเงินฉบับนี้สร้างโดยระบบอิเล็กทรอนิกส์ของเทศบาลเมืองนางรอง มีผลสมบูรณ์ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535
              </p>
              <p>
                • สอบถามข้อมูลเพิ่มเติม: กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง โทร. 044-631-414 ในวันและเวลาราชการ
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:gap-14 pt-2">
              <div className="text-center flex flex-col items-center">
                <div className="h-9 flex items-end justify-center mb-1 w-44 sm:w-56 border-b border-slate-300 pb-1">
                  <span className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-full px-1">
                    {house.ownerName || "-"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700">ผู้ชำระเงิน</p>
                <p className="text-[10px] text-slate-400 mt-0.5">(เจ้าของบ้าน / ผู้แทน)</p>
              </div>

              <div className="text-center flex flex-col items-center">
                <div className="h-9 flex items-end justify-center mb-1 w-44 sm:w-56 border-b border-slate-300 pb-1">
                  <span className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-full px-1">
                    {tx.verifiedBy === "line_bot" ? "ระบบรับชำระอิเล็กทรอนิกส์อัตโนมัติ" : tx.verifiedBy || "เจ้าหน้าที่การเงินและบัญชี"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700">ผู้รับเงิน / ผู้ตรวจสอบ</p>
                <p className="text-[10px] text-slate-400 mt-0.5">กองสาธารณสุขและสิ่งแวดล้อม</p>
              </div>
            </div>

            <div suppressHydrationWarning className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ • เทศบาลเมืองนางรอง • วันที่พิมพ์: {new Date().toLocaleString("th-TH")}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
