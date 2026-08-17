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
    .select({ 
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt
    })
    .from(transactions)
    .where(eq(transactions.slipStatus, "verified"));

  const currentYear = new Date().getFullYear();
  let currentYearRevenue = 0;

  const totalVerifiedRevenue = verifiedTxs.reduce((sum, tx) => {
    const val = parseFloat(tx.amount || "0");
    const amount = isNaN(val) ? 0 : val;
    
    const txDate = tx.paidAt || tx.createdAt;
    if (txDate && new Date(txDate).getFullYear() === currentYear) {
      currentYearRevenue += amount;
    }
    
    return sum + amount;
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
    <div className="space-y-10 pb-12 font-sans">
      
      {/* 4 Stat Cards matching LoopAI style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        
        {/* Card 1: Verified Revenue */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                <Banknote size={24} strokeWidth={2} />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-lg">ยอดรับชำระแล้ว</span>
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-100">
              ปี {currentYear + 543}: ฿{currentYearRevenue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[length:32px] font-bold text-slate-900 tracking-tight leading-none">
              <span className="text-[length:20px] font-semibold text-slate-400 mr-1">฿</span>
              {totalVerifiedRevenue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <span className="text-[length:13px] text-slate-400 font-medium">จากยอดชำระสำเร็จทั้งหมด</span>
          </div>
        </div>

        {/* Card 2: Houses with Unpaid Invoices */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100/50">
                <Home size={24} strokeWidth={2} />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-lg">บ้านที่ค้างชำระ</span>
            </div>
            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-red-100">
              ต้องติดตาม
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[length:32px] font-bold text-slate-900 tracking-tight leading-none">
              {housesWithUnpaidCount}
            </div>
            <span className="text-[length:13px] text-slate-400 font-medium">จากทั้งหมด {totalHousesCount} หลัง</span>
          </div>
        </div>

        {/* Card 3: Pending Reviews */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                <Clock size={24} strokeWidth={2} />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-lg">รอยืนยันสลิป</span>
            </div>
            <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-100">
              รอดำเนินการ
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[length:32px] font-bold text-slate-900 tracking-tight leading-none">
              {waitingForReviewCount}
            </div>
            <Link href="/dashboard/review" className="text-[length:13px] text-[#5B58F2] hover:underline font-semibold flex items-center gap-1">
              ไปที่รายการตรวจสอบ <ChevronRight size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>

        {/* Card 4: LINE Slips */}
        <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100/80 flex flex-col min-h-[160px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF0FF] text-[#5B58F2] flex items-center justify-center shrink-0 border border-[#5B58F2]/20">
                <Smartphone size={24} strokeWidth={2} />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-lg">แจ้งผ่าน LINE</span>
            </div>
            <span className="bg-[#EEF0FF] text-[#5B58F2] px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#5B58F2]/20">
              รายการใหม่
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div className="text-[length:32px] font-bold text-slate-900 tracking-tight leading-none">
              {pendingLineSlipsCount}
            </div>
            <Link href="/dashboard/line-slips" className="text-[length:13px] text-[#5B58F2] hover:underline font-semibold flex items-center gap-1">
              จัดการข้อความ <ChevronRight size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph (left) and Priority Tasks (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column (simulated graph area) */}
        <div className="xl:col-span-2 bg-white rounded-[32px] p-8 lg:p-10 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-semibold text-lg text-slate-800">สถิติผู้เข้าชมเว็บไซต์ (Website Visitors)</h2>
            <div className="flex items-center gap-4">
              <button className="text-sm font-medium text-slate-600 flex items-center gap-1 hover:text-slate-900">
                หน้าทั่วไป <ChevronDown size={14} />
              </button>
              <button className="text-sm font-medium text-slate-600 flex items-center gap-1 hover:text-slate-900">
                30 วันล่าสุด <ChevronDown size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] border border-slate-100 rounded-2xl bg-slate-50/50 relative overflow-hidden flex flex-col justify-end p-6">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pb-12 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full border-b border-slate-200/60 h-0"></div>
              ))}
            </div>
            
            {/* Mock Bars */}
            <div className="relative flex items-end justify-between gap-3 h-48 w-full z-10 px-4">
              {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
                <div key={i} className="w-full bg-[#5B58F2]/10 hover:bg-[#5B58F2]/20 transition-colors rounded-t-lg relative group flex items-end justify-center" style={{ height: `${height}%` }}>
                   <div className="w-full bg-[#5B58F2]/40 rounded-t-lg transition-all group-hover:bg-[#5B58F2]/60" style={{ height: `${height - 20}%` }}></div>
                </div>
              ))}
            </div>

            {/* Labels */}
            <div className="relative flex justify-between gap-3 w-full mt-4 px-4 text-[10px] text-slate-400 font-semibold z-10">
              {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((day, i) => (
                <div key={i} className="w-full text-center">{day}</div>
              ))}
            </div>

            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
              <div className="bg-white px-8 py-5 rounded-2xl shadow-xl border border-slate-100/50 text-center animate-in zoom-in duration-500">
                 <TrendingUp size={28} className="mx-auto text-[#5B58F2] mb-3" />
                 <p className="text-slate-800 font-bold text-base">กำลังเชื่อมต่อข้อมูลผู้เข้าชม</p>
                 <p className="text-sm text-slate-500 mt-1">ระบบกราฟจะแสดงผลในเร็วๆ นี้</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Priority Tasks -> Recent Transactions) */}
        <div className="xl:col-span-1 bg-white rounded-[32px] p-8 lg:p-10 border border-slate-100 shadow-sm flex flex-col">
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
                <div key={tx.id} className="group relative flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-slate-100">
                    {tx.paidVia === "LINE Bot" ? (
                      <Smartphone size={16} className="text-[#5B58F2]" />
                    ) : (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#5B58F2] transition-colors">
                        {tx.houseNumber} - {tx.ownerName}
                      </h3>
                      <span className="text-xs font-bold text-slate-700">
                        ฿{parseFloat(tx.amount || "0").toLocaleString("th-TH")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> 
                        {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString("th-TH", { month: "short", day: "numeric" }) : "-"}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        ยืนยันแล้ว
                      </span>
                      <span className="text-slate-300 truncate">
                        • {tx.months.length > 0 ? tx.months.map(m => formatThaiMonth(m)).join(", ") : "ไม่ระบุ"}
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm shrink-0 text-[#5B58F2]">
                    <ChevronRight size={16} />
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

