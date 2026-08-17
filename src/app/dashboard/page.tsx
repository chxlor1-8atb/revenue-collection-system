export const dynamic = 'force-dynamic';

import Link from "next/link";
import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { eq, desc, inArray, or } from "drizzle-orm";
import { 
  Banknote, 
  Home, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  Calendar,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  User,
  ExternalLink
} from "lucide-react";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", 
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", 
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const parts = monthYear.split("-");
  if (parts.length !== 2) return monthYear;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return monthYear;
  return `${thaiMonths[month]} ${year + 543}`;
}

export default async function DashboardPage() {
  // 1. Total verified revenue (sum of amount from transactions where slipStatus='verified')
  const verifiedTxs = await db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(eq(transactions.slipStatus, "verified"));

  const totalVerifiedRevenue = verifiedTxs.reduce((sum, tx) => {
    const val = parseFloat(tx.amount || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // 2. Number of houses with unpaid invoices
  const unpaidInvoicesList = await db
    .select({ houseId: invoices.houseId })
    .from(invoices)
    .where(eq(invoices.status, "unpaid"));

  const housesWithUnpaidCount = new Set(unpaidInvoicesList.map((inv) => inv.houseId)).size;

  const totalHousesResult = await db.select({ id: houses.id }).from(houses);
  const totalHousesCount = totalHousesResult.length;

  // 3. Number of transactions waiting for review (slipStatus='pending')
  const reviewTxs = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.slipStatus, "pending"));

  const waitingForReviewCount = reviewTxs.length;

  // 4. Number of LINE slips pending (from lineMessages where status='pending')
  const pendingLineSlipsList = await db
    .select({ id: lineMessages.id })
    .from(lineMessages)
    .where(eq(lineMessages.status, "pending"));

  const pendingLineSlipsCount = pendingLineSlipsList.length;

  // 5. Recent 5 verified transactions (with house number if available via invoices join)
  const recentVerifiedTxs = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      verifiedBy: transactions.verifiedBy,
    })
    .from(transactions)
    .where(eq(transactions.slipStatus, "verified"))
    .orderBy(desc(transactions.paidAt), desc(transactions.createdAt))
    .limit(5);

  let recentTransactions: Array<{
    id: number;
    amount: string | null;
    paidAt: Date;
    verifiedBy: string | null;
    houseNumber: string;
    ownerName: string;
    months: string[];
    paidVia: string;
  }> = [];

  if (recentVerifiedTxs.length > 0) {
    const txIds = recentVerifiedTxs.map((t) => t.id);

    const relatedInvoices = await db
      .select({
        transactionId: invoices.transactionId,
        monthYear: invoices.monthYear,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, txIds));

    const relatedLineMsgs = await db
      .select({
        transactionId: lineMessages.transactionId,
        houseNumber: lineMessages.houseNumber,
        senderName: lineMessages.senderName,
      })
      .from(lineMessages)
      .where(inArray(lineMessages.transactionId, txIds));

    const lineMsgMap = new Map(relatedLineMsgs.map((m) => [m.transactionId, m]));

    recentTransactions = recentVerifiedTxs.map((tx) => {
      const txInvoices = relatedInvoices.filter((inv) => inv.transactionId === tx.id);
      const lineData = lineMsgMap.get(tx.id);

      const houseNumber = txInvoices[0]?.houseNumber || lineData?.houseNumber || "ไม่ระบุ";
      const ownerName = txInvoices[0]?.ownerName || lineData?.senderName || "ไม่ระบุ";
      const months = txInvoices.map((inv) => inv.monthYear);
      const paidVia = tx.verifiedBy === "line_bot" || lineData ? "LINE Bot" : "เว็บไซต์";

      return {
        id: tx.id,
        amount: tx.amount,
        paidAt: tx.paidAt || tx.createdAt || new Date(),
        verifiedBy: tx.verifiedBy,
        houseNumber,
        ownerName,
        months,
        paidVia,
      };
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 font-sans">
      
      {/* 4 Stat Cards matching LoopAI style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Verified Revenue */}
        <div className="bg-white rounded-[32px] p-7 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-slate-800 font-bold tracking-tight text-lg">ยอดรับชำระแล้ว</span>
            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-bold border border-emerald-100">
              +{verifiedTxs.length}
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">
              <span className="text-[20px] font-semibold text-slate-400 mr-1">฿</span>
              {totalVerifiedRevenue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <span className="text-[13px] text-slate-400 font-medium">จากยอดชำระสำเร็จทั้งหมด</span>
          </div>
        </div>

        {/* Card 2: Houses with Unpaid Invoices */}
        <div className="bg-white rounded-[32px] p-7 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-slate-800 font-bold tracking-tight text-lg">บ้านที่ค้างชำระ</span>
            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold border border-red-100">
              รอจัดการ
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">
              {housesWithUnpaidCount}
            </div>
            <span className="text-[13px] text-slate-400 font-medium">จากทั้งหมด {totalHousesCount} หลัง</span>
          </div>
        </div>

        {/* Card 3: Pending Reviews */}
        <div className="bg-white rounded-[32px] p-7 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-slate-800 font-bold tracking-tight text-lg">รอยืนยันสลิป</span>
            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-100">
              รอดำเนินการ
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">
              {waitingForReviewCount}
            </div>
            <Link href="/dashboard/review" className="text-[13px] text-[#5B58F2] hover:underline font-semibold flex items-center gap-1">
              ไปที่รายการตรวจสอบ <ChevronRight size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>

        {/* Card 4: LINE Slips */}
        <div className="bg-white rounded-[32px] p-7 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-slate-800 font-bold tracking-tight text-lg">แจ้งผ่าน LINE</span>
            <span className="bg-[#EEF0FF] text-[#5B58F2] px-2 py-0.5 rounded-full text-xs font-bold border border-[#5B58F2]/20">
              บอท
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">
              {pendingLineSlipsCount}
            </div>
            <Link href="/dashboard/line-slips" className="text-[13px] text-[#5B58F2] hover:underline font-semibold flex items-center gap-1">
              จัดการข้อความ <ChevronRight size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph (left) and Priority Tasks (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        
        {/* Left Column (simulated graph area) */}
        <div className="xl:col-span-2 bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-semibold text-lg text-slate-800">กราฟรายได้ (Revenue Analytics)</h2>
            <div className="flex items-center gap-4">
              <button className="text-sm font-medium text-slate-600 flex items-center gap-1 hover:text-slate-900">
                รายได้ <ChevronDown size={14} />
              </button>
              <button className="text-sm font-medium text-slate-600 flex items-center gap-1 hover:text-slate-900">
                30 วันล่าสุด <ChevronDown size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center min-h-[300px] border border-dashed border-slate-200 rounded-2xl bg-slate-50 relative">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">พื้นที่แสดงกราฟรายได้</p>
              <p className="text-xs text-slate-400 mt-1">อยู่ระหว่างการพัฒนาระบบรายงาน</p>
            </div>
          </div>
        </div>

        {/* Right Column (Priority Tasks -> Recent Transactions) */}
        <div className="xl:col-span-1 bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg text-slate-800">รายการรับชำระล่าสุด</h2>
            <Link href="/dashboard/history" className="text-sm font-semibold text-[#5B58F2] hover:underline">
              ดูทั้งหมด
            </Link>
          </div>

          <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">ยังไม่มีรายการรับชำระ</p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="group relative flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center shrink-0 group-hover:border-[#5B58F2] transition-colors">
                    {tx.paidVia === "LINE Bot" ? (
                      <Smartphone size={12} className="text-[#5B58F2]" />
                    ) : (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {tx.houseNumber} - {tx.ownerName}
                      </h3>
                      <span className="text-xs font-semibold text-slate-400">
                        ฿{parseFloat(tx.amount || "0").toLocaleString("th-TH")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> 
                        {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString("th-TH", { month: "short", day: "numeric" }) : "-"}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        ยืนยันแล้ว
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      ชำระบิล: {tx.months.length > 0 ? tx.months.map(m => formatThaiMonth(m)).join(", ") : "ไม่ระบุ"}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-50 cursor-pointer shrink-0 mt-1 text-slate-400">
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

