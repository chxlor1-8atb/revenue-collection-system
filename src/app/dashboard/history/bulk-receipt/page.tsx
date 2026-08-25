import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { inArray, eq } from "drizzle-orm";
import PrintTrigger from "../[txId]/receipt/PrintTrigger";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export default async function BulkReceiptPage(props: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const searchParams = await props.searchParams;
  const idsParam = searchParams.ids || "";
  
  const txIds = idsParam
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id) && id > 0);

  if (txIds.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">ไม่พบรายการที่เลือก</h2>
          <p className="text-sm text-slate-500 mb-6">กรุณากลับไปเลือกรายการที่ต้องการพิมพ์ในหน้าประวัติการรับชำระเงิน</p>
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-2 bg-[#5B58F2] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#4A47D1] transition-all"
          >
            <ArrowLeft size={16} /> กลับหน้าประวัติ
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all transactions
  const txList = await db.select().from(transactions).where(inArray(transactions.id, txIds));

  // Fetch related invoices and houses
  const relatedInvoices = await db.select({
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

  // Fetch line messages for sender names
  const lineMsgs = await db.select().from(lineMessages).where(inArray(lineMessages.transactionId, txIds));
  const lineMsgMap = new Map(lineMsgs.map((m) => [m.transactionId, m]));

  const receipts = txList.map((tx) => {
    const txInvoices = relatedInvoices.filter((inv) => inv.transactionId === tx.id);
    const house = txInvoices[0] || {
      houseNumber: "ไม่ระบุ",
      ownerName: "ไม่ระบุ",
      zone: "-",
    };
    const lineMsg = lineMsgMap.get(tx.id);
    const senderName = lineMsg?.senderName || "-";
    const paidVia = tx.verifiedBy === "line_bot" || lineMsg ? "LINE Bot" : tx.verifiedBy === "admin_cash" ? "เงินสด (เคาน์เตอร์)" : "เว็บไซต์";
    const totalAmount = parseFloat(tx.amount || "0");
    const paidDate = tx.paidAt || tx.createdAt || new Date();

    return {
      tx,
      house,
      invoices: txInvoices,
      senderName,
      paidVia,
      totalAmount,
      paidDate,
    };
  });

  return (
    <div className="min-h-screen bg-slate-200 py-8 font-sans print:bg-white print:py-0 print:m-0">
      <PrintTrigger />



      {/* Receipts Container */}
      <div className="space-y-8 print:space-y-0 max-w-[210mm] mx-auto">
        {receipts.map(({ tx, house, invoices: txInvoices, senderName, paidVia, totalAmount, paidDate }, idx) => (
          <div
            key={tx.id}
            className="bg-white p-12 shadow-md print:shadow-none print:p-0 print:m-0 aspect-[1/1.414] border border-slate-300 print:border-none relative break-after-page print:page-break-after-always"
            style={{ pageBreakAfter: "always", breakAfter: "page" }}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
              <div className="flex gap-6 items-center">
                <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" className="w-20 h-20 object-contain shrink-0" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ใบเสร็จรับเงิน</h1>
                  <h2 className="text-lg font-semibold text-slate-700 mt-1">เทศบาลเมืองนางรอง</h2>
                  <p className="text-sm text-slate-500 mt-1">อ.นางรอง จ.บุรีรัมย์</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-slate-300 mb-2">RECEIPT</div>
                <p className="text-sm font-semibold text-slate-700">เลขที่รายการ: #{tx.id}</p>
                <p className="text-sm text-slate-600 mt-1">
                  วันที่: {paidDate.toLocaleString("th-TH", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">ได้รับเงินจาก</h3>
                <p className="text-lg font-bold text-slate-800">{house.ownerName}</p>
                <p className="text-slate-600">บ้านเลขที่: {house.houseNumber}</p>
                <p className="text-slate-600">ชุมชน: {house.zone || "-"}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">รายละเอียดผู้โอน</h3>
                <p className="text-slate-800 font-medium">{senderName}</p>
                <p className="text-slate-600 text-sm">ช่องทาง: {paidVia}</p>
                {tx.slipRefId && (
                  <p className="text-slate-500 text-xs font-mono mt-1">Ref Code: {tx.slipRefId}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-3 px-2 text-left text-sm font-bold text-slate-700 w-16">ลำดับ</th>
                  <th className="py-3 px-2 text-left text-sm font-bold text-slate-700">รายการชำระเงิน</th>
                  <th className="py-3 px-2 text-right text-sm font-bold text-slate-700">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {txInvoices.map((inv, index) => (
                  <tr key={inv.id} className="border-b border-slate-200">
                    <td className="py-4 px-2 text-slate-600">{index + 1}</td>
                    <td className="py-4 px-2">
                      <div className="font-semibold text-slate-800">ค่าธรรมเนียมจัดเก็บขยะมูลฝอย</div>
                      <div className="text-sm text-slate-500 mt-1">ประจำเดือน: {formatThaiMonth(inv.monthYear)} (รหัสบิล: #{inv.id})</div>
                    </td>
                    <td className="py-4 px-2 text-right font-mono font-bold text-slate-800">
                      {parseFloat(inv.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Box */}
            <div className="flex justify-end mb-16">
              <div className="w-1/2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">รวมเงินทั้งสิ้น</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700">
                    ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-16 mt-20 pt-8 border-t border-slate-200">
              <div className="text-center">
                <div className="border-b border-slate-400 w-48 mx-auto mb-2 border-dashed"></div>
                <p className="text-sm text-slate-600">ผู้ชำระเงิน</p>
              </div>
              <div className="text-center">
                <div className="w-48 mx-auto mb-2 text-emerald-700 font-bold font-mono border-b border-slate-400 border-dashed pb-1">
                  {tx.verifiedBy === "line_bot" ? "ระบบอนุมัติอัตโนมัติ" : tx.verifiedBy || "เจ้าหน้าที่"}
                </div>
                <p className="text-sm text-slate-600">ผู้รับเงิน / ผู้ตรวจสอบ</p>
              </div>
            </div>

            {/* Print Only Notice */}
            <div suppressHydrationWarning className="absolute bottom-8 left-0 right-0 text-center text-xs text-slate-400 print:block hidden">
              เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ (ใบที่ {idx + 1} จาก {receipts.length}) • วันที่พิมพ์: {new Date().toLocaleString("th-TH")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
