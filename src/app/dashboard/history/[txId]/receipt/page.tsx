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
      
      <div className="max-w-[210mm] mx-auto bg-white p-12 shadow-md print:shadow-none print:p-0 print:m-0 aspect-[1/1.414] border border-slate-300 print:border-none relative overflow-hidden">
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
          <span className="text-[120px] font-black text-slate-900 -rotate-45 select-none whitespace-nowrap">
            กองสาธารณสุข
          </span>
        </div>

        <div className="relative z-10 h-full">
          {/* Receipt Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
            <div className="flex gap-6 items-center">
              <img src="/nangrong-logo.png" alt="เทศบาลเมืองนางรอง" className="w-20 h-20 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ใบเสร็จรับเงิน</h1>
                <h2 className="text-lg font-semibold text-slate-700 mt-1">เทศบาลเมืองนางรอง</h2>
                <p className="text-sm text-slate-500 mt-1">อ.นางรอง จ.บุรีรัมย์</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black tracking-widest text-slate-200 mb-2">ชำระค่าขยะ</div>
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
          <tfoot>
            <tr className="bg-slate-50 border-b-2 border-slate-800">
              <td colSpan={2} className="py-4 px-4 text-right font-bold text-slate-700">รวมเงินทั้งสิ้น</td>
              <td className="py-4 px-2 text-right font-mono font-bold text-lg text-slate-900">
                ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-16">
          <div className="text-center flex flex-col items-center">
            <div className="h-10 flex items-end justify-center mb-2 w-56 border-b border-slate-400 border-dashed pb-1">
              <span className="text-slate-800 font-medium text-sm">{house.ownerName}</span>
            </div>
            <p className="text-sm text-slate-600">ผู้ชำระเงิน</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="h-10 flex items-end justify-center mb-2 w-56 border-b border-slate-400 border-dashed pb-1">
              <span className="text-slate-800 font-bold text-sm">
                {tx.verifiedBy === "line_bot" ? "ระบบอนุมัติอัตโนมัติ" : tx.verifiedBy || "เจ้าหน้าที่"}
              </span>
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
      

    </div>
  );
}
