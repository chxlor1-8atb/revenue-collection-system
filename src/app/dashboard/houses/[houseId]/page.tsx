import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, User, MapPin, ExternalLink, Receipt, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  if (!monthYear) return "";
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month)]} ${parseInt(year) + 543}`;
}

export default async function AdminHouseDetailPage({ params }: { params: Promise<{ houseId: string }> }) {
  const houseId = parseInt((await params).houseId, 10);
  if (isNaN(houseId)) notFound();

  // Fetch house details
  const houseResult = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
  if (houseResult.length === 0) notFound();
  const house = houseResult[0];

  // Fetch all invoices for this house
  const houseInvoices = await db.select({
    id: invoices.id,
    monthYear: invoices.monthYear,
    amount: invoices.amount,
    status: invoices.status,
    transactionId: invoices.transactionId,
    tx: transactions,
  })
  .from(invoices)
  .leftJoin(transactions, eq(invoices.transactionId, transactions.id))
  .where(eq(invoices.houseId, houseId))
  .orderBy(desc(invoices.monthYear));

  // Calculate stats
  const totalUnpaid = houseInvoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalPaid = houseInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link href="/dashboard/houses" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> กลับไปหน้ารวมบ้าน
      </Link>

      {/* House Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-emerald-800 px-6 py-4 flex justify-between items-center">
          <h1 className="font-serif font-bold text-2xl text-white flex items-center gap-2">
            <Home size={24} /> ข้อมูลบ้านเลขที่ {house.houseNumber}
          </h1>
          <a href={`/house/${house.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            ดูหน้าเว็บของชาวบ้าน <ExternalLink size={14} />
          </a>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><User size={20} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-0.5">ชื่อเจ้าบ้าน</p>
              <p className="font-semibold text-slate-800 text-lg">{house.ownerName}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MapPin size={20} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-0.5">ชุมชน / หมู่</p>
              <p className="font-semibold text-slate-800 text-lg">{house.zone || "-"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex justify-between items-center">
              <span className="text-sm font-medium">ยอดค้างชำระรวม</span>
              <span className="font-bold">฿{totalUnpaid.toFixed(2)}</span>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100 flex justify-between items-center">
              <span className="text-sm font-medium">ยอดที่ชำระแล้วรวม</span>
              <span className="font-bold">฿{totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <h2 className="font-serif font-bold text-xl text-[#1F2E22] mb-4 flex items-center gap-2">
        <Receipt size={20} /> ประวัติรายการบิลทั้งหมด
      </h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {houseInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">ยังไม่มีรายการบิลสำหรับบ้านหลังนี้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">ประจำเดือน</th>
                  <th className="px-6 py-4">ยอดเงิน</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4">วันที่อัปเดตล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {houseInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{formatThaiMonth(inv.monthYear)}</td>
                    <td className="px-6 py-4 font-mono font-semibold">฿{parseFloat(inv.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> ชำระแล้ว
                        </span>
                      ) : inv.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          <Clock size={12} /> รอตรวจสอบสลิป
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                          <AlertCircle size={12} /> ค้างชำระ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {inv.tx?.paidAt ? new Date(inv.tx.paidAt).toLocaleDateString("th-TH") : (inv.tx?.createdAt ? new Date(inv.tx.createdAt).toLocaleDateString("th-TH") : "-")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
