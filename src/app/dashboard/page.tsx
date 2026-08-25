export const dynamic = 'force-dynamic';

import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages, systemSettings } from "@/lib/schema";
import { CalendarClock, BellRing } from "lucide-react";
import { eq, desc, inArray, or, and, sql } from "drizzle-orm";
import RevenueChart from "./RevenueChart";
import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger";
import LottieIcon from "@/components/LottieIcon";
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
  const currentYear = new Date().getFullYear();

  // High-performance concurrent queries: Execute all metrics in parallel with SQL aggregation
  const [
    totalRevenueResult,
    yearRevenueResult,
    settingsResult,
    unpaidHousesResult,
    totalHousesResult,
    reviewTxsResult,
    pendingLineSlipsResult,
    recentVerifiedTxs,
    chartTxs
  ] = await Promise.all([
    // 1. Total verified revenue
    db.select({
      total: sql<string>`COALESCE(SUM(${transactions.amount}::numeric), 0)`
    }).from(transactions).where(eq(transactions.slipStatus, "verified")),

    // 2. Current year verified revenue
    db.select({
      total: sql<string>`COALESCE(SUM(${transactions.amount}::numeric), 0)`
    }).from(transactions).where(
      and(
        eq(transactions.slipStatus, "verified"),
        sql`EXTRACT(YEAR FROM COALESCE(${transactions.paidAt}, ${transactions.createdAt})) = ${currentYear}`
      )
    ),

    // 3. System settings
    db.select().from(systemSettings).limit(1),

    // 4. Number of houses with unpaid invoices
    db.select({
      count: sql<number>`COUNT(DISTINCT ${invoices.houseId})`
    }).from(invoices).where(eq(invoices.status, "unpaid")),

    // 5. Total registered houses count
    db.select({
      count: sql<number>`COUNT(*)`
    }).from(houses),

    // 6. Number of transactions waiting for review
    db.select({
      count: sql<number>`COUNT(*)`
    }).from(transactions).where(eq(transactions.slipStatus, "pending")),

    // 7. Number of LINE slips pending
    db.select({
      count: sql<number>`COUNT(*)`
    }).from(lineMessages).where(eq(lineMessages.status, "pending")),

    // 8. Recent 5 verified transactions
    db.select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      verifiedBy: transactions.verifiedBy,
    })
      .from(transactions)
      .where(eq(transactions.slipStatus, "verified"))
      .orderBy(desc(transactions.paidAt), desc(transactions.createdAt))
      .limit(5),

    // 9. Chart transactions (up to 2000 recent)
    db.select({
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
    })
      .from(transactions)
      .where(eq(transactions.slipStatus, "verified"))
      .orderBy(desc(transactions.paidAt), desc(transactions.createdAt))
      .limit(2000)
  ]);

  const totalVerifiedRevenue = parseFloat(totalRevenueResult[0]?.total || "0");
  const currentYearRevenue = parseFloat(yearRevenueResult[0]?.total || "0");
  const settings = settingsResult[0];
  const housesWithUnpaidCount = Number(unpaidHousesResult[0]?.count || 0);
  const totalHousesCount = Number(totalHousesResult[0]?.count || 0);
  const waitingForReviewCount = Number(reviewTxsResult[0]?.count || 0);
  const pendingLineSlipsCount = Number(pendingLineSlipsResult[0]?.count || 0);

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
      
      {/* 4 Stat KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 xl:gap-5">
        
        {/* Card 1: Verified Revenue */}
        <StaggerItem className="bg-white rounded-[20px] sm:rounded-3xl p-4 sm:p-5 xl:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between min-h-[115px] sm:min-h-[155px]">
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0">
                <Image src="/money/icons8-money.png" alt="Revenue" width={44} height={44} className="object-contain drop-shadow-sm" unoptimized />
              </div>
              <div>
                <span className="text-slate-800 font-bold text-sm xl:text-base tracking-tight block">ยอดรับชำระแล้ว</span>
                <span className="text-[11px] text-slate-400 font-medium">รวมทุกช่องทาง</span>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200/80 whitespace-nowrap">
              ปี {currentYear + 543}: ฿{currentYearRevenue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="mt-auto pt-2 sm:pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
            <div>
              <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                <span className="text-lg xl:text-xl font-bold text-slate-400 mr-1">฿</span>
                {totalVerifiedRevenue.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              สำเร็จทั้งหมด
            </span>
          </div>
        </StaggerItem>

        {/* Card 2: Houses with Unpaid Invoices */}
        <StaggerItem className="bg-white rounded-[20px] sm:rounded-3xl p-4 sm:p-5 xl:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between min-h-[115px] sm:min-h-[155px]">
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0 w-11 h-11">
                <LottieIcon src="/icons/icons8-home.json" size={40} loop autoplay />
              </div>
              <div>
                <span className="text-slate-800 font-bold text-sm xl:text-base tracking-tight block">บ้านที่ค้างชำระ</span>
                <span className="text-[11px] text-slate-400 font-medium">รอติดตามการจ่าย</span>
              </div>
            </div>
            <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-bold border border-rose-200/80 whitespace-nowrap">
              ต้องติดตาม
            </span>
          </div>

          <div className="mt-auto pt-2 sm:pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
            <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {housesWithUnpaidCount} <span className="text-sm font-semibold text-slate-400">หลัง</span>
            </div>
            <Link 
              href="/dashboard/houses?status=unpaid"
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 hover:underline"
            >
              <span>จากทั้งหมด {totalHousesCount} หลัง</span>
              <ChevronRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
        </StaggerItem>

        {/* Card 3: Waiting For Review */}
        <StaggerItem className="bg-white rounded-[20px] sm:rounded-3xl p-4 sm:p-5 xl:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between min-h-[115px] sm:min-h-[155px]">
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0">
                <Image src="/glass/icons8-waiting.png" alt="Waiting" width={44} height={44} className="object-contain drop-shadow-sm" unoptimized />
              </div>
              <div>
                <span className="text-slate-800 font-bold text-sm xl:text-base tracking-tight block">รอยืนยันสลิป</span>
                <span className="text-[11px] text-slate-400 font-medium">สลิปจากเว็บไซต์</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
              waitingForReviewCount > 0 
                ? 'bg-amber-50 text-amber-700 border border-amber-200/80' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {waitingForReviewCount > 0 ? 'รอดำเนินการ' : 'เรียบร้อย'}
            </span>
          </div>

          <div className="mt-auto pt-2 sm:pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
            <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {waitingForReviewCount} <span className="text-sm font-semibold text-slate-400">รายการ</span>
            </div>
            <Link 
              href="/dashboard/review" 
              className="text-[11px] text-[#5B58F2] hover:text-[#4A47D1] font-bold flex items-center gap-0.5 hover:underline"
            >
              <span>ไปตรวจสลิป</span>
              <ChevronRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
        </StaggerItem>

        {/* Card 4: LINE Slips */}
        <StaggerItem className="bg-white rounded-[20px] sm:rounded-3xl p-4 sm:p-5 xl:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between min-h-[115px] sm:min-h-[155px]">
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0">
                <Image src="/glass/icons8-phonelink-ring.png" alt="LINE" width={44} height={44} className="object-contain drop-shadow-sm" unoptimized />
              </div>
              <div>
                <span className="text-slate-800 font-bold text-sm xl:text-base tracking-tight block">แจ้งผ่าน LINE</span>
                <span className="text-[11px] text-slate-400 font-medium">สลิปจาก LINE Bot</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
              pendingLineSlipsCount > 0 
                ? 'bg-[#EEF0FF] text-[#5B58F2] border border-[#D5D9FF]' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {pendingLineSlipsCount > 0 ? `${pendingLineSlipsCount} สลิปใหม่` : 'เรียบร้อย'}
            </span>
          </div>

          <div className="mt-auto pt-2 sm:pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
            <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {pendingLineSlipsCount} <span className="text-sm font-semibold text-slate-400">รายการ</span>
            </div>
            <Link 
              href="/dashboard/line-slips" 
              className="text-[11px] text-[#5B58F2] hover:text-[#4A47D1] font-bold flex items-center gap-0.5 hover:underline"
            >
              <span>จัดการสลิป</span>
              <ChevronRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Grid: Graph (left) and Priority Tasks (right) */}
      <StaggerContainer delayChildren={0.3} staggerChildren={0.15} className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column (Real Graph Area) */}
        <StaggerItem className="xl:col-span-2">
          <RevenueChart 
            transactions={chartTxs.map(tx => ({
              amount: tx.amount,
              date: (tx.paidAt || tx.createdAt)?.toISOString() || null
            }))} 
          />

          {settings?.autoBillingDay && (
            <div className="bg-slate-900 rounded-[32px] p-6 lg:p-8 text-white shadow-lg relative overflow-hidden mt-6 xl:mt-8 border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B58F2] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/10">
                    <CalendarClock size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">ระบบออกบิลอัตโนมัติ (Auto-Billing)</h3>
                    <p className="text-emerald-200/80 text-sm">
                      ตั้งเวลาออกบิลวันที่ {settings.autoBillingDay} ของทุกเดือน และให้เวลาชำระ {settings.dueDateDays || 0} วัน
                    </p>
                  </div>
                </div>

                {settings.autoRemindDays && (
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                    <BellRing size={20} className="text-amber-400" />
                    <div>
                      <div className="text-xs text-slate-300">แจ้งเตือนทวงหนี้อัตโนมัติ</div>
                      <div className="text-sm font-semibold text-amber-400">หลังเลยกำหนด {settings.autoRemindDays} วัน</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </StaggerItem>
          


        {/* Right Column (Priority Tasks -> Recent Transactions) */}
        <StaggerItem className="xl:col-span-1 bg-white rounded-[32px] p-8 lg:p-10 border border-slate-100 shadow-sm flex flex-col">
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
        </StaggerItem>
      </StaggerContainer>

    </div>
  );
}
