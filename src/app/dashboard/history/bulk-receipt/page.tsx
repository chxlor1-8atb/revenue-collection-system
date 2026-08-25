import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { inArray, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PrintTrigger from "../[txId]/receipt/PrintTrigger";
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

export default async function BulkReceiptPage(props: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await props.searchParams;
  const idsStr = params.ids || "";
  const txIds = idsStr
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));

  if (txIds.length === 0) return notFound();

  // Fetch all transactions
  const txList = await db
    .select()
    .from(transactions)
    .where(inArray(transactions.id, txIds));

  if (txList.length === 0) return notFound();

  // Fetch all invoices matching these transactions
  const allInvoices = await db
    .select({
      id: invoices.id,
      transactionId: invoices.transactionId,
      monthYear: invoices.monthYear,
      amount: invoices.amount,
      houseNumber: houses.houseNumber,
      ownerName: houses.ownerName,
      zone: houses.zone,
    })
    .from(invoices)
    .innerJoin(houses, eq(invoices.houseId, houses.id))
    .where(inArray(invoices.transactionId, txIds));

  // Fetch all line messages for these transactions
  const allLineMsgs = await db
    .select()
    .from(lineMessages)
    .where(inArray(lineMessages.transactionId, txIds));

  // Map data per transaction
  const receipts = txList.map((tx) => {
    const relatedInvoices = allInvoices.filter((inv) => inv.transactionId === tx.id);
    const house = relatedInvoices.length > 0 ? relatedInvoices[0] : {
      houseNumber: "-",
      ownerName: "-",
      zone: "-",
    };

    const lineMsg = allLineMsgs.find((m) => m.transactionId === tx.id);
    const senderName = lineMsg ? lineMsg.senderName : (house.ownerName || "-");
    const paidVia =
      tx.verifiedBy === "line_bot" || lineMsg ? "LINE Bot (ออนไลน์)" : tx.verifiedBy === "admin_cash" ? "เงินสด (หน้าเคาน์เตอร์)" : "PromptPay QR (เว็บไซต์)";
    const totalAmount = parseFloat(tx.amount || "0");
    const paidDate = tx.paidAt || tx.createdAt || new Date();

    return {
      tx,
      house,
      invoices: relatedInvoices,
      senderName,
      paidVia,
      totalAmount,
      paidDate,
    };
  });

  return (
    <div className="min-h-screen bg-slate-200 py-4 sm:py-6 font-sans print:bg-white print:py-0 print:m-0">
      <PrintTrigger />

      {/* Receipts Container */}
      <div className="space-y-8 print:space-y-0 max-w-[210mm] mx-auto">
        {receipts.map(({ tx, house, invoices: txInvoices, senderName, paidVia, totalAmount, paidDate }, idx) => (
          <div
            key={tx.id}
            id="printable-receipt"
            className="bg-white pt-6 sm:pt-8 px-6 sm:px-10 pb-6 sm:pb-8 shadow-md print:shadow-none print:p-0 print:m-0 border border-slate-200/80 print:border-none relative break-after-page print:page-break-after-always overflow-hidden flex flex-col justify-between"
            style={{ pageBreakAfter: "always", breakAfter: "page" }}
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0 overflow-hidden select-none">
              <span className="text-[75px] sm:text-[105px] md:text-[120px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
                กองสาธารณสุข
              </span>
            </div>

            {/* Document Content */}
            <div className="relative z-10 flex flex-col justify-between flex-1 gap-4.5">
              
              {/* 1. COMPACT TOP HEADER & METADATA */}
              <div className="space-y-4">
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
                      <strong className="font-mono font-bold text-slate-900">#{tx.id}</strong>
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div>
                      <span className="text-slate-400 font-medium mr-1">วันที่ชำระ:</span>
                      <span className="text-slate-800 font-medium">{formatThaiDateTime(paidDate)}</span>
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                      <CheckCircle2 size={12} /> ชำระเงินเรียบร้อย
                    </div>
                  </div>
                </div>

                {/* 2-Column Bento Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลผู้ชำระเงิน (Billed To)</div>
                    <div className="text-sm font-bold text-slate-900">{house.ownerName || "-"}</div>
                    <div className="text-slate-600 flex items-center gap-2 text-[11px]">
                      <span>บ้านเลขที่: <strong className="text-slate-800 font-semibold">{house.houseNumber || "-"}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>ชุมชน: <span className="text-slate-700 font-medium">{house.zone || "ในเขตเทศบาล"}</span></span>
                    </div>
                  </div>

                  <div className="space-y-0.5 sm:text-right sm:border-l sm:border-slate-200/60 sm:pl-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลการชำระเงิน (Payment Info)</div>
                    <div className="text-slate-800 font-medium text-xs">
                      ผู้ทำรายการ: <span className="font-semibold text-slate-900">{senderName}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      ช่องทาง: <span className="text-slate-800 font-medium">{paidVia}</span>
                      {tx.slipRefId && <span className="font-mono text-[10px] text-slate-400 ml-1">({tx.slipRefId})</span>}
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
                      {txInvoices.length > 0 ? (
                        txInvoices.map((inv, index) => (
                          <tr key={inv.id} className="hover:bg-slate-50/40">
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{String(index + 1).padStart(2, "0")}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                                ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ประจำงวดเดือน: <span className="font-medium text-slate-700">{formatThaiMonth(inv.monthYear)}</span> (รหัสบิล: #{inv.id})
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-xs sm:text-sm text-slate-900">
                              {parseFloat(inv.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">01</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                              ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                            </div>
                            <div className="text-[11px] text-slate-500">ชำระตามรายการธุรกรรม #{tx.id}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-xs sm:text-base text-slate-900">
                            {totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
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

              {/* 3. BOTTOM SECTION */}
              <div className="space-y-3.5 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50/60 text-[10px] text-slate-400 leading-relaxed space-y-0.5 text-center sm:text-left">
                  <p className="font-medium text-slate-600">
                    • ใบเสร็จรับเงินฉบับนี้สร้างโดยระบบอิเล็กทรอนิกส์ของเทศบาลเมืองนางรอง มีผลสมบูรณ์ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535
                  </p>
                  <p>
                    • สอบถามข้อมูลเพิ่มเติม: กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง โทร. 044-631-414 ในวันและเวลาราชการ
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 sm:gap-12 pt-1">
                  <div className="text-center flex flex-col items-center">
                    <div className="h-8 flex items-end justify-center mb-1 w-40 sm:w-52 border-b border-slate-300 pb-0.5">
                      <span className="text-slate-800 font-medium text-xs truncate max-w-full px-1">
                        {house.ownerName || "-"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">ผู้ชำระเงิน</p>
                    <p className="text-[10px] text-slate-400">(เจ้าของบ้าน / ผู้แทน)</p>
                  </div>

                  <div className="text-center flex flex-col items-center">
                    <div className="h-8 flex items-end justify-center mb-1 w-40 sm:w-52 border-b border-slate-300 pb-0.5">
                      <span className="text-slate-800 font-semibold text-xs truncate max-w-full px-1">
                        {tx.verifiedBy === "line_bot" ? "ระบบรับชำระอิเล็กทรอนิกส์อัตโนมัติ" : tx.verifiedBy || "เจ้าหน้าที่การเงินและบัญชี"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">ผู้รับเงิน / ผู้ตรวจสอบ</p>
                    <p className="text-[10px] text-slate-400">กองสาธารณสุขและสิ่งแวดล้อม</p>
                  </div>
                </div>

                <div suppressHydrationWarning className="text-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                  เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ (ใบที่ {idx + 1} จาก {receipts.length}) • เทศบาลเมืองนางรอง • วันที่พิมพ์: {formatThaiDateTime(new Date())}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
