import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { inArray, eq, and, or, sql, gte, lte, ilike, desc } from "drizzle-orm";
import PrintTrigger from "../[txId]/receipt/PrintTrigger";
import Link from "next/link";
import { Printer, ArrowLeft, Calendar, FileText, CheckCircle2 } from "lucide-react";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export default async function SummaryReportPage(props: {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    status?: string;
    channel?: string;
    monthYear?: string;
    search?: string;
  }>;
}) {
  const params = await props.searchParams;
  const startDate = params.startDate || "";
  const endDate = params.endDate || "";
  const status = params.status || "verified";
  const channel = params.channel || "all";
  const monthYear = params.monthYear || "";
  const search = params.search || "";

  // Build conditions
  const conditions = [];
  
  if (status === "all") {
    conditions.push(inArray(transactions.slipStatus, ["verified", "voided"]));
  } else {
    conditions.push(eq(transactions.slipStatus, status));
  }

  if (channel === "line") {
    conditions.push(or(
      eq(transactions.verifiedBy, "line_bot"),
      sql`EXISTS (SELECT 1 FROM ${lineMessages} WHERE ${lineMessages.transactionId} = ${transactions.id})`
    ));
  } else if (channel === "web") {
    conditions.push(and(
      or(sql`${transactions.verifiedBy} IS NULL`, sql`${transactions.verifiedBy} != 'line_bot'`),
      sql`NOT EXISTS (SELECT 1 FROM ${lineMessages} WHERE ${lineMessages.transactionId} = ${transactions.id})`
    ));
  }

  if (monthYear) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${invoices} 
      WHERE ${invoices.transactionId} = ${transactions.id} 
      AND ${invoices.monthYear} = ${monthYear}
    )`);
  }

  if (startDate) {
    conditions.push(gte(transactions.paidAt, new Date(`${startDate}T00:00:00.000Z`)));
  }
  if (endDate) {
    conditions.push(lte(transactions.paidAt, new Date(`${endDate}T23:59:59.999Z`)));
  }

  if (search.trim()) {
    const q = search.trim();
    conditions.push(or(
      ilike(transactions.slipRefId, `%${q}%`),
      ilike(transactions.payerNote, `%${q}%`),
      sql`EXISTS (
        SELECT 1 FROM ${invoices}
        JOIN ${houses} ON ${invoices.houseId} = ${houses.id}
        WHERE ${invoices.transactionId} = ${transactions.id}
        AND (${ilike(houses.houseNumber, `%${q}%`)} OR ${ilike(houses.ownerName, `%${q}%`)})
      )`
    ));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch all matching transactions (up to 1000 for report)
  const txList = await db.select()
    .from(transactions)
    .where(whereClause)
    .orderBy(desc(transactions.paidAt))
    .limit(1000);

  const txIds = txList.map((t) => t.id);

  let reportItems: any[] = [];
  let totalLineAmount = 0;
  let totalLineCount = 0;
  let totalWebAmount = 0;
  let totalWebCount = 0;
  let totalCashAmount = 0;
  let totalCashCount = 0;

  if (txIds.length > 0) {
    const relatedInvoices = await db.select({
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

    const lineMsgs = await db.select({
      transactionId: lineMessages.transactionId,
      senderName: lineMessages.senderName,
    })
      .from(lineMessages)
      .where(inArray(lineMessages.transactionId, txIds));

    const lineMsgMap = new Map(lineMsgs.map((m) => [m.transactionId, m]));

    reportItems = txList.map((tx) => {
      const txInvoices = relatedInvoices.filter((inv) => inv.transactionId === tx.id);
      const lineData = lineMsgMap.get(tx.id);
      const isLine = tx.verifiedBy === "line_bot" || !!lineData;
      const isCash = tx.verifiedBy === "admin_cash";
      const amt = parseFloat(tx.amount || "0");

      if (isLine) {
        totalLineAmount += amt;
        totalLineCount += 1;
      } else if (isCash) {
        totalCashAmount += amt;
        totalCashCount += 1;
      } else {
        totalWebAmount += amt;
        totalWebCount += 1;
      }

      return {
        ...tx,
        invoices: txInvoices,
        houseNumber: txInvoices[0]?.houseNumber || "ไม่ระบุ",
        ownerName: txInvoices[0]?.ownerName || "ไม่ระบุ",
        zone: txInvoices[0]?.zone || "ไม่ระบุชุมชน",
        months: txInvoices.map((inv) => inv.monthYear),
        paidVia: isLine ? "LINE Bot" : isCash ? "เงินสด (เคาน์เตอร์)" : "เว็บไซต์",
        senderName: lineData?.senderName || null,
        verifiedBy: tx.verifiedBy === "line_bot" ? "ระบบอัตโนมัติ" : tx.verifiedBy || "เจ้าหน้าที่",
      };
    });
  }

  const totalAmount = totalLineAmount + totalWebAmount + totalCashAmount;
  const totalCount = reportItems.length;

  // Community breakdown
  const zoneSummaryMap = new Map<string, { count: number; amount: number }>();
  reportItems.forEach(item => {
    const z = item.zone || "ไม่ระบุชุมชน";
    const cur = zoneSummaryMap.get(z) || { count: 0, amount: 0 };
    zoneSummaryMap.set(z, {
      count: cur.count + 1,
      amount: cur.amount + parseFloat(item.amount || "0")
    });
  });
  const zoneSummaryList = Array.from(zoneSummaryMap.entries()).sort((a, b) => b[1].amount - a[1].amount);

  return (
    <div className="min-h-screen bg-slate-200 py-8 font-sans print:bg-white print:py-0 print:m-0">
      <PrintTrigger />



      {/* Report Page (A4) */}
      <div className="max-w-[210mm] mx-auto bg-white p-10 shadow-md print:shadow-none print:p-0 print:m-0 border border-slate-300 print:border-none relative">
        
        {/* Official Header */}
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
          <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" className="w-20 h-20 object-contain mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">เทศบาลเมืองนางรอง อำเภอนางรอง จังหวัดบุรีรัมย์</h1>
          <h2 className="text-base font-semibold text-slate-800 mt-1">รายงานสรุปการรับชำระเงินค่าธรรมเนียมจัดเก็บและขนขยะมูลฝอย</h2>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600 mt-2">
            <span>
              <strong>ช่วงเวลา:</strong>{" "}
              {startDate && endDate
                ? `${startDate} ถึง ${endDate}`
                : startDate
                ? `ตั้งแต่วันที่ ${startDate}`
                : endDate
                ? `ถึงวันที่ ${endDate}`
                : monthYear
                ? `ประจำงวด ${formatThaiMonth(monthYear)}`
                : "ข้อมูลทั้งหมด"}
            </span>
            <span>•</span>
            <span><strong>วันที่พิมพ์รายงาน:</strong> {new Date().toLocaleString("th-TH")}</span>
          </div>
        </div>

        {/* Summary Metric Boxes */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-center">
            <div className="text-[11px] text-slate-500 font-medium">ยอดรับชำระรวมทั้งสิ้น</div>
            <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
              ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{totalCount} รายการ</div>
          </div>

          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-center">
            <div className="text-[11px] text-slate-500 font-medium">ผ่าน LINE Bot</div>
            <div className="text-lg font-bold font-mono text-[blue-600] mt-0.5">
              ฿{totalLineAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{totalLineCount} รายการ</div>
          </div>

          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-center">
            <div className="text-[11px] text-slate-500 font-medium">ผ่าน เว็บไซต์</div>
            <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
              ฿{totalWebAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{totalWebCount} รายการ</div>
          </div>

          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 text-center">
            <div className="text-[11px] text-slate-500 font-medium">เงินสด (เคาน์เตอร์)</div>
            <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
              ฿{totalCashAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{totalCashCount} รายการ</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700">
                <th className="py-2 px-2 border-r border-slate-300 text-center w-10">ลำดับ</th>
                <th className="py-2 px-2 border-r border-slate-300">วัน-เวลาที่ชำระ</th>
                <th className="py-2 px-2 border-r border-slate-300">บ้านเลขที่</th>
                <th className="py-2 px-2 border-r border-slate-300">ชื่อเจ้าบ้าน</th>
                <th className="py-2 px-2 border-r border-slate-300">งวดที่ชำระ</th>
                <th className="py-2 px-2 border-r border-slate-300">ช่องทาง</th>
                <th className="py-2 px-2 border-r border-slate-300 text-right">ยอดเงิน (บาท)</th>
                <th className="py-2 px-2 text-center">ผู้ตรวจสอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {reportItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลรายการรับชำระเงินในช่วงเวลาที่เลือก
                  </td>
                </tr>
              ) : (
                reportItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2 text-center text-slate-500 border-r border-slate-200">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-600 border-r border-slate-200">
                      {item.paidAt
                        ? new Date(item.paidAt).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="py-2 px-2 font-semibold text-slate-800 border-r border-slate-200">
                      {item.houseNumber}
                    </td>
                    <td className="py-2 px-2 text-slate-700 truncate max-w-[130px] border-r border-slate-200">
                      {item.ownerName}
                    </td>
                    <td className="py-2 px-2 text-[11px] text-slate-600 border-r border-slate-200">
                      {item.months.map((m: string) => formatThaiMonth(m)).join(", ") || "-"}
                    </td>
                    <td className="py-2 px-2 text-[11px] text-slate-600 border-r border-slate-200">
                      {item.paidVia}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900 border-r border-slate-200">
                      {parseFloat(item.amount || "0").toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 text-center text-[10px] text-slate-500">
                      {item.verifiedBy}
                    </td>
                  </tr>
                ))
              )}
              {reportItems.length > 0 && (
                <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-400 text-xs">
                  <td colSpan={6} className="py-2 px-3 text-right">รวมเงินทั้งสิ้น:</td>
                  <td className="py-2 px-2 text-right font-mono text-emerald-800">
                    ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-center text-[11px]">{totalCount} รายการ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Community Breakdown Section (if any records exist) */}
        {zoneSummaryList.length > 1 && (
          <div className="mb-8 border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-bold text-xs text-slate-800">
              📊 สรุปยอดการจัดเก็บแยกตามชุมชน / หมู่บ้าน
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-slate-200 text-xs">
              {zoneSummaryList.map(([zoneName, stat]) => (
                <div key={zoneName} className="p-2.5 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block">{zoneName}</span>
                    <span className="text-[10px] text-slate-400">{stat.count} รายการ</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-right">
                    ฿{stat.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-Official Signatures Section */}
        <div className="grid grid-cols-3 gap-6 mt-12 pt-6 border-t border-slate-300 text-center">
          <div>
            <div className="border-b border-slate-400 w-40 mx-auto mb-2 border-dashed h-10"></div>
            <p className="text-xs font-semibold text-slate-800">( ............................................................ )</p>
            <p className="text-[11px] text-slate-600 mt-1">ผู้จัดทำรายงาน / เจ้าหน้าที่การเงิน</p>
            <p className="text-[10px] text-slate-400 mt-0.5">วันที่ ......../......../............</p>
          </div>

          <div>
            <div className="border-b border-slate-400 w-40 mx-auto mb-2 border-dashed h-10"></div>
            <p className="text-xs font-semibold text-slate-800">( ............................................................ )</p>
            <p className="text-[11px] text-slate-600 mt-1">ผู้ตรวจสอบ / หัวหน้าฝ่ายพัฒนารายได้</p>
            <p className="text-[10px] text-slate-400 mt-0.5">วันที่ ......../......../............</p>
          </div>

          <div>
            <div className="border-b border-slate-400 w-40 mx-auto mb-2 border-dashed h-10"></div>
            <p className="text-xs font-semibold text-slate-800">( ............................................................ )</p>
            <p className="text-[11px] text-slate-600 mt-1">ผู้อนุมัติ / ผู้อำนวยการกองคลัง</p>
            <p className="text-[10px] text-slate-400 mt-0.5">วันที่ ......../......../............</p>
          </div>
        </div>

        {/* Bottom footer notice */}
        <div suppressHydrationWarning className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          เอกสารรายงานฉบับนี้พิมพ์จากระบบจัดเก็บรายได้ออนไลน์ เทศบาลเมืองนางรอง
        </div>

      </div>
    </div>
  );
}
