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

  // 3. Number of transactions waiting for review (slipStatus='waiting_for_slip' OR 'pending')
  const reviewTxs = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      or(
        eq(transactions.slipStatus, "waiting_for_slip"),
        eq(transactions.slipStatus, "pending")
      )
    );

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
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="font-serif font-bold text-3xl text-[#1F2E22] tracking-tight">
            ภาพรวมระบบบัญชีรายได้
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            สรุปข้อมูลการรับชำระเงินค่าจัดเก็บขยะและสถิติระบบ real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            เชื่อมต่อ Neon Database แล้ว
          </span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total Verified Revenue */}
        <div className="bg-gradient-to-br from-[#1F2E22] to-[#2D4533] text-white rounded-2xl p-6 shadow-md border border-[#2d4732] flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 text-emerald-300 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} strokeWidth={1} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-emerald-200/80 uppercase tracking-wider">
                รายได้ที่ยืนยันแล้ว
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 backdrop-blur-sm border border-emerald-500/30">
                <Banknote size={20} strokeWidth={2} />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-white">
              ฿{totalVerifiedRevenue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200/70">
            <span>จากสลิปที่อนุมัติแล้ว</span>
            <span className="font-semibold text-emerald-300">{verifiedTxs.length} รายการ</span>
          </div>
        </div>

        {/* Stat 2: Houses with Unpaid Invoices */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                บ้านที่ค้างชำระ
              </span>
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <Home size={20} strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-800">
                {housesWithUnpaidCount}
              </span>
              <span className="text-slate-500 text-sm font-medium">หลัง</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>จำนวนบ้านทั้งหมด</span>
            <span className="font-semibold text-slate-700">{totalHousesCount} หลัง</span>
          </div>
        </div>

        {/* Stat 3: Transactions Waiting for Review */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                สลิปรอตรวจสอบ
              </span>
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <Clock size={20} strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-800">
                {waitingForReviewCount}
              </span>
              <span className="text-slate-500 text-sm font-medium">รายการ</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>สถานะรอดำเนินการ</span>
            <Link 
              href="/dashboard/review" 
              className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              ตรวจสลิป <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Stat 4: LINE Slips Pending */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                สลิปจาก LINE (รอตรวจ)
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                <Smartphone size={20} strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-800">
                {pendingLineSlipsCount}
              </span>
              <span className="text-slate-500 text-sm font-medium">รายการ</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>ข้อความบอท LINE</span>
            <Link 
              href="/dashboard/line-slips" 
              className="text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              จัดการสลิป <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/review"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileCheck size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">ตรวจสลิปโอนเงิน</div>
              <div className="text-xs text-slate-400">รอตรวจ {waitingForReviewCount} รายการ</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/dashboard/line-slips"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Smartphone size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">สลิปจาก LINE</div>
              <div className="text-xs text-slate-400">รอดำเนินการ {pendingLineSlipsCount} รายการ</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/dashboard/history"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">ประวัติชำระเงิน</div>
              <div className="text-xs text-slate-400">ดูย้อนหลังทั้งหมด</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/dashboard/houses"
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Home size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">จัดการข้อมูลบ้าน</div>
              <div className="text-xs text-slate-400">ทั้งหมด {totalHousesCount} หลัง</div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Recent 5 Verified Transactions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <h2 className="font-serif font-bold text-lg text-slate-800">
              รายการชำระเงินสำเร็จล่าสุด (5 รายการ)
            </h2>
          </div>
          <Link
            href="/dashboard/history"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            ดูประวัติทั้งหมด <ExternalLink size={12} />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileCheck size={48} strokeWidth={1.2} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">ยังไม่มีรายการชำระเงินที่อนุมัติแล้ว</p>
            <p className="text-slate-400 text-xs mt-1">
              เมื่อมีการตรวจสอบและอนุมัติสลิป รายการจะแสดงในหน้านี้ทันที
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="px-6 py-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* House Info & Owner */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono font-bold text-sm shrink-0">
                    {tx.houseNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{tx.ownerName}</span>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        {tx.paidVia}
                      </span>
                    </div>
                    
                    {/* Months badge list */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {tx.months.length > 0 ? (
                        tx.months.map((m) => (
                          <span
                            key={m}
                            className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60"
                          >
                            <Calendar size={10} className="text-slate-400" />
                            {formatThaiMonth(m)}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">ไม่ได้ระบุงวด</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Time */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-1 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-lg font-bold font-mono text-emerald-700">
                    ฿{parseFloat(tx.amount || "0").toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-slate-400">
                    {tx.paidAt
                      ? new Date(tx.paidAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

