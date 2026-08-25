import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PrintTrigger from "./PrintTrigger";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export default async function ReceiptPage({ params }: { params: Promise<{ txId: string }> }) {
  const txId = parseInt((await params).txId, 10);
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

  if (relatedInvoices.length === 0) return notFound();

  const house = relatedInvoices[0];

  // Fetch line messages (for sender name)
  const lineMsgs = await db.select().from(lineMessages).where(eq(lineMessages.transactionId, txId));
  const senderName = lineMsgs.length > 0 ? lineMsgs[0].senderName : "-";
  const paidVia = tx.verifiedBy === "line_bot" || lineMsgs.length > 0 ? "LINE" : "เว็บไซต์";

  const totalAmount = parseFloat(tx.amount || "0");
  const paidDate = tx.paidAt || tx.createdAt || new Date();

  return (
    <div className="min-h-screen bg-slate-200 py-8 font-sans print:bg-white print:py-0">
      <PrintTrigger />
      
      <div className="max-w-[210mm] mx-auto bg-white p-12 shadow-md print:shadow-none print:p-0 print:m-0 aspect-[1/1.414] border border-slate-300 print:border-none relative">
        
        {/* Receipt Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div className="flex gap-6 items-center">
            {/* Using a placeholder circle for logo */}
            <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center">
              <span className="font-bold text-slate-800 text-xs text-center leading-tight">เทศบาลเมือง<br/>นางรอง</span>
            </div>
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
              วันที่: {paidDate.toLocaleString('th-TH', { 
                day: 'numeric', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
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
            {relatedInvoices.map((inv, index) => (
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
          เอกสารฉบับนี้ถูกสร้างขึ้นด้วยระบบอิเล็กทรอนิกส์ • วันที่พิมพ์: {new Date().toLocaleString('th-TH')}
        </div>

      </div>
      

    </div>
  );
}
