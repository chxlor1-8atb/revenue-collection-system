export const dynamic = 'force-dynamic';

import Link from "next/link";
import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { eq, desc, inArray, or } from "drizzle-orm";
import RevenueChart from "./RevenueChart";
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
      <div className="flex flex-wrap lg:flex-nowrap gap-3 xl:gap-5">
        
        {/* Card 1: Verified Revenue */}
        <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 bg-white rounded-[24px] xl:rounded-[32px] p-5 xl:p-7 border border-slate-100/80 flex flex-col min-h-[140px] xl:min-h-[160px] w-full sm:w-fit lg:flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between gap-3 xl:gap-6 mb-4 xl:mb-6">
            <div className="flex items-center gap-2.5 xl:gap-3 shrink-0">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                <Banknote size={20} strokeWidth={2} className="xl:w-6 xl:h-6" />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-base xl:text-lg whitespace-nowrap">ยอดรับชำระแล้ว</span>
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 xl:px-2.5 xl:py-1 rounded-full text-[10px] xl:text-[11px] font-bold border border-emerald-100 whitespace-nowrap">
              ปี {currentYear + 543}: ฿{currentYearRevenue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 xl:gap-6">
            <div className="text-[26px] xl:text-[32px] font-bold text-slate-900 tracking-tight leading-none shrink-0 whitespace-nowrap">
              <span className="text-base xl:text-[20px] font-semibold text-slate-400 mr-1">฿</span>
              {totalVerifiedRevenue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <span className="text-[11px] xl:text-[13px] text-slate-400 font-medium whitespace-nowrap">จากยอดชำระสำเร็จทั้งหมด</span>
          </div>
        </div>

        {/* Card 2: Houses with Unpaid Invoices */}
        <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 bg-white rounded-[24px] xl:rounded-[32px] p-5 xl:p-7 border border-slate-100/80 flex flex-col min-h-[140px] xl:min-h-[160px] w-full sm:w-fit lg:flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between gap-3 xl:gap-6 mb-4 xl:mb-6">
            <div className="flex items-center gap-2.5 xl:gap-3 shrink-0">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100/50">
                <Home size={20} strokeWidth={2} className="xl:w-6 xl:h-6" />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-base xl:text-lg whitespace-nowrap">บ้านที่ค้างชำระ</span>
            </div>
            <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-red-100 whitespace-nowrap">
              ต้องติดตาม
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 xl:gap-6">
            <div className="text-[26px] xl:text-[32px] font-bold text-slate-900 tracking-tight leading-none shrink-0 whitespace-nowrap">
              {housesWithUnpaidCount}
            </div>
            <span className="text-[11px] xl:text-[13px] text-slate-400 font-medium whitespace-nowrap">จากทั้งหมด {totalHousesCount} หลัง</span>
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 bg-white rounded-[24px] xl:rounded-[32px] p-5 xl:p-7 border border-slate-100/80 flex flex-col min-h-[140px] xl:min-h-[160px] w-full sm:w-fit lg:flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between gap-3 xl:gap-6 mb-4 xl:mb-6">
            <div className="flex items-center gap-2.5 xl:gap-3 shrink-0">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                <Clock size={20} strokeWidth={2} className="xl:w-6 xl:h-6" />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-base xl:text-lg whitespace-nowrap">รอยืนยันสลิป</span>
            </div>
            <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-100 whitespace-nowrap">
              รอดำเนินการ
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 xl:gap-6">
            <div className="text-[26px] xl:text-[32px] font-bold text-slate-900 tracking-tight leading-none shrink-0 whitespace-nowrap">
              {waitingForReviewCount}
            </div>
            <Link href="/dashboard/review" className="text-[11px] xl:text-[13px] text-[#5B58F2] font-semibold hover:underline whitespace-nowrap">
              ไปที่รายการตรวจสอบ <ChevronRight size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 bg-white rounded-[24px] xl:rounded-[32px] p-5 xl:p-7 border border-slate-100/80 flex flex-col min-h-[140px] xl:min-h-[160px] w-full sm:w-fit lg:flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
          <div className="flex items-start justify-between gap-3 xl:gap-6 mb-4 xl:mb-6">
            <div className="flex items-center gap-2.5 xl:gap-3 shrink-0">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-[#EEF0FF] text-[#5B58F2] flex items-center justify-center shrink-0 border border-[#5B58F2]/20">
                <Smartphone size={20} strokeWidth={2} className="xl:w-6 xl:h-6" />
              </div>
              <span className="text-slate-800 font-bold tracking-tight text-base xl:text-lg whitespace-nowrap">แจ้งผ่าน LINE</span>
            </div>
            <span className="bg-[#EEF0FF] text-[#5B58F2] px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#5B58F2]/20 whitespace-nowrap">
              รายการใหม่
            </span>
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 xl:gap-6">
            <div className="text-[26px] xl:text-[32px] font-bold text-slate-900 tracking-tight leading-none shrink-0 whitespace-nowrap">
              {pendingLineSlipsCount}
            </div>
            <Link href="/dashboard/line-slips" className="text-[11px] xl:text-[13px] text-[#5B58F2] font-semibold hover:underline whitespace-nowrap">
              จัดการข้อความ <ChevronRight size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Graph (left) and Priority Tasks (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column (Real Graph Area) */}
        <div className="xl:col-span-2 animate-in slide-in-from-bottom-8 fade-in duration-700" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <RevenueChart 
            transactions={verifiedTxs.map(tx => ({
              amount: tx.amount,
              date: (tx.paidAt || tx.createdAt)?.toISOString() || null
            }))} 
          />
        </div>
          


        {/* Right Column (Priority Tasks -> Recent Transactions) */}
        <div className="xl:col-span-1 bg-white rounded-[32px] p-8 lg:p-10 border border-slate-100 shadow-sm flex flex-col animate-in slide-in-from-bottom-8 fade-in duration-700" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
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

