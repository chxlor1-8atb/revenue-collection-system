import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle2, Home, Calendar, ArrowLeft, Receipt, Check } from "lucide-react";
import Link from "next/link";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month)]} ${parseInt(year) + 543}`;
}

export default async function PaySuccessPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const transactionId = parseInt((await params).transactionId, 10);
  if (isNaN(transactionId)) notFound();

  const tx = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
  if (tx.length === 0) notFound();

  const txData = tx[0];

  // Fetch invoices & house info
  const txInvoices = await db.select({
    monthYear: invoices.monthYear,
    amount: invoices.amount,
    houseId: houses.id,
    houseNumber: houses.houseNumber,
    ownerName: houses.ownerName,
  })
    .from(invoices)
    .innerJoin(houses, eq(invoices.houseId, houses.id))
    .where(eq(invoices.transactionId, transactionId));

  const houseId = txInvoices[0]?.houseId;
  const houseNumber = txInvoices[0]?.houseNumber || "";
  const ownerName = txInvoices[0]?.ownerName || "";
  const totalAmount = parseFloat(txData.amount || "0");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

          {/* Top Banner */}
          <div className="bg-emerald-600 px-6 py-3 flex justify-center items-center">
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest uppercase">ชำระเงินสำเร็จเรียบร้อย</span>
            </div>
          </div>

          <div className="p-8 sm:p-10 flex flex-col items-center">

            {/* Success Icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={52} className="text-emerald-500" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
            </div>

            <h1 className="font-bold text-2xl text-slate-800 mb-1 text-center">ขอบคุณที่ชำระเงิน!</h1>
            <p className="text-slate-500 text-xs text-center mb-6">ระบบได้บันทึกการชำระเงินและออกใบเสร็จเรียบร้อยแล้ว</p>

            {/* Receipt Card */}
            <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-6">
              {txData.receiptCode && (
                <div className="flex items-center justify-between px-5 py-3 bg-amber-50/50 rounded-t-2xl">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <Receipt size={14} className="text-amber-600" />
                    รหัสใบเสร็จทางการ
                  </div>
                  <div className="font-mono font-bold text-amber-900 text-xs">
                    {txData.receiptCode}
                  </div>
                </div>
              )}

              {houseNumber && (
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <Home size={14} />
                    บ้านเลขที่
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-800 text-sm">{houseNumber}</div>
                    <div className="text-[11px] text-slate-400">{ownerName}</div>
                  </div>
                </div>
              )}

              {txInvoices.length > 0 && (
                <div className="flex items-start justify-between px-5 py-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <Calendar size={14} />
                    รายการรอบบิล
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {txInvoices.map((inv, i) => (
                      <span key={i} className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                        {formatThaiMonth(inv.monthYear)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between px-5 py-4 bg-emerald-50/30 rounded-b-2xl">
                <div className="text-slate-600 text-xs font-bold">ยอดเงินที่ชำระ</div>
                <div className="font-mono text-2xl font-bold text-emerald-600">
                  ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="w-full space-y-2.5">
              {houseId && (
                <Link
                  href={`/house/${houseId}`}
                  className="w-full bg-[#5B58F2] hover:bg-[#4A47D1] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Home size={14} />
                  กลับไปยังหน้ารายการบ้าน
                </Link>
              )}

              <Link
                href="/"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                กลับหน้าหลัก
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
