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
    <div className="min-h-screen bg-slate-200 py-4 sm:py-8 font-sans print:bg-white print:py-0 print:m-0">
      <PrintTrigger />

      {/* Receipts Container */}
      <div className="space-y-8 print:space-y-0 max-w-[210mm] mx-auto">
        {receipts.map(({ tx, house, invoices: txInvoices, senderName, paidVia, totalAmount, paidDate }, idx) => (
          <div
            key={tx.id}
            id="printable-receipt"
            className="bg-white p-6 sm:p-12 shadow-md print:shadow-none print:p-0 print:m-0 min-h-[250mm] sm:min-h-[265mm] border border-slate-200/80 print:border-none relative break-after-page print:page-break-after-always overflow-hidden flex flex-col justify-between"
            style={{ pageBreakAfter: "always", breakAfter: "page" }}
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.075] z-0 overflow-hidden select-none">
              <span className="text-[90px] sm:text-[130px] md:text-[150px] font-black text-slate-900 -rotate-45 whitespace-nowrap">
                กองสาธารณสุข
              </span>
            </div>

            {/* Document Content */}
            <div className="relative z-10 flex flex-col h-full justify-between flex-1 gap-8">
              
              {/* 1. TOP HEADER & METADATA BENTO */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/nangrong-logo.png" 
                      alt="เทศบาลเมืองนางรอง" 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-xs" 
                    />
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tracking-wide">
                        เทศบาลเมืองนางรอง
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        ใบเสร็จรับเงินอิเล็กทรอนิกส์
                      </h1>
                      <p className="text-xs text-slate-500 font-medium">
                        กองสาธารณสุขและสิ่งแวดล้อม • อ.นางรอง จ.บุรีรัมย์ 31110
                      </p>
                    </div>
                  </div>

                  {/* Right Meta Column */}
                  <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-baseline sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      ชำระค่าธรรมเนียมขยะ
                    </div>
                    <div className="text-lg sm:text-xl font-mono font-bold text-slate-900">
                      #{tx.id}
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                      <CheckCircle2 size={11} /> ชำระเงินเรียบร้อย
                    </div>
                  </div>
                </div>

                {/* Modern 2-Column Bento Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100/90 text-xs sm:text-sm">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลผู้ชำระเงิน (Billed To)</div>
                    <div className="text-base font-bold text-slate-900">{house.ownerName || "-"}</div>
                    <div className="text-slate-600 flex items-center gap-2">
                      <span>บ้านเลขที่: <strong className="text-slate-800 font-semibold">{house.houseNumber || "-"}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>ชุมชน: <span className="text-slate-700 font-medium">{house.zone || "ในเขตเทศบาล"}</span></span>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:text-right sm:border-l sm:border-slate-200/60 sm:pl-5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ข้อมูลการชำระเงิน (Payment Info)</div>
                    <div className="text-slate-800 font-medium">
                      วันที่ชำระ: <span className="font-semibold text-slate-900">{paidDate.toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-slate-600">
                      ช่องทาง: <span className="text-slate-800 font-medium">{paidVia}</span>
                      {tx.slipRefId && <span className="font-mono text-[11px] text-slate-400 ml-1.5">({tx.slipRefId})</span>}
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
                      {txInvoices.length > 0 ? (
                        txInvoices.map((inv, index) => (
                          <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4 px-4 text-slate-400 font-mono text-xs">{String(index + 1).padStart(2, "0")}</td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                                ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                ประจำงวดเดือน: <span className="font-medium text-slate-700">{formatThaiMonth(inv.monthYear)}</span> (รหัสบิล: #{inv.id})
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-semibold text-sm sm:text-base text-slate-900">
                              {parseFloat(inv.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-4 px-4 text-slate-400 font-mono text-xs">01</td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-900 text-sm sm:text-base">
                              ค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">ชำระตามรายการธุรกรรม #{tx.id}</div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-sm sm:text-base text-slate-900">
                            {totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900/80 bg-slate-50/60">
                        <td colSpan={2} className="py-4 px-4 text-slate-700">
                          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                            ยอดชำระสุทธิ (Total Amount)
                          </div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {thaiBahtText(totalAmount)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
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

              {/* 3. BOTTOM SECTION */}
              <div className="mt-auto pt-6 space-y-6">
                <div className="p-3.5 rounded-xl bg-slate-50/60 text-[11px] text-slate-400 leading-relaxed space-y-0.5">
                  <p className="font-medium text-slate-600">
                    • ใบเสร็จรับเงินฉบับนี้สร้างโดยระบบอิเล็กทรอนิกส์ของเทศบาลเมืองนางรอง มีผลสมบูรณ์ตามพระราชบัญญัติการสาธารณสุข พ.ศ. 2535
                  </p>
                  <p>
                    • สอบถามข้อมูลเพิ่มเติม: กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง โทร. 044-631-414
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 sm:gap-16 pt-2">
                  <div className="text-center flex flex-col items-center">
                    <div className="h-10 flex items-end justify-center mb-1.5 w-48 sm:w-60 border-b border-slate-300 pb-1">
                      <span className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-full px-2">
                        {house.ownerName || "-"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">ผู้ชำระเงิน</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">(เจ้าของบ้าน / ผู้แทน)</p>
                  </div>

                  <div className="text-center flex flex-col items-center">
                    <div className="h-10 flex items-end justify-center mb-1.5 w-48 sm:w-60 border-b border-slate-300 pb-1">
                      <span className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-full px-2">
                        {tx.verifiedBy === "line_bot" ? "ระบบรับชำระอิเล็กทรอนิกส์อัตโนมัติ" : tx.verifiedBy || "เจ้าหน้าที่การเงินและบัญชี"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">ผู้รับเงิน / ผู้ตรวจสอบ</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">กองสาธารณสุขและสิ่งแวดล้อม</p>
                  </div>
                </div>

                <div suppressHydrationWarning className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                  เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ (ใบที่ {idx + 1} จาก {receipts.length}) • เทศบาลเมืองนางรอง • วันที่พิมพ์: {new Date().toLocaleString("th-TH")}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
