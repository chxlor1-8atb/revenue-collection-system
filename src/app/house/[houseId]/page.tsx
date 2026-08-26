import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, asc, desc, and, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";
import { CheckCircle2, Receipt, ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HouseDashboard({ params }: { params: Promise<{ houseId: string }> }) {
  const houseId = parseInt((await params).houseId, 10);
  
  if (isNaN(houseId)) {
    notFound();
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [result, houseInvoices, recentTransactions] = await Promise.all([
    db.select().from(houses).where(eq(houses.id, houseId)).limit(1),
    db.select().from(invoices).where(eq(invoices.houseId, houseId)).orderBy(asc(invoices.monthYear)),
    db.select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      verifiedBy: transactions.verifiedBy,
      slipStatus: transactions.slipStatus,
      receiptCode: transactions.receiptCode,
    })
      .from(transactions)
      .where(
        and(
          eq(transactions.slipStatus, 'verified'),
          sql`EXISTS (SELECT 1 FROM ${invoices} WHERE ${invoices.transactionId} = ${transactions.id} AND ${invoices.houseId} = ${houseId})`,
          gte(transactions.paidAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(transactions.paidAt))
      .limit(10)
  ]);

  if (result.length === 0) {
    notFound();
  }

  const house = result[0];

  const formatThaiDate = (date: Date) => {
    if (!date) return "";
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/80 py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.035] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Main Minimalist Receipt Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative z-10">
        
        {/* ========================================================
            1. TOP SECTION: DEEP NAVY RECEIPT STUB
        ======================================================== */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-7 text-white relative overflow-hidden">
          
          {/* Subtle Watermark */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 opacity-5 pointer-events-none select-none">
            <img src="/nangrong-logo.png" alt="Watermark" className="w-full h-full object-contain filter invert" />
          </div>

          {/* Header Row: Seal + Municipal Name + Status Badge */}
          <div className="flex justify-between items-start mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-2xl border border-white/15 shrink-0">
                <img src="/nangrong-logo.png" alt="Municipal Seal" className="w-9 h-9 object-contain" />
              </div>
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">ใบแจ้งหนี้ค่าธรรมเนียมขยะ</span>
                <p className="text-xs sm:text-sm font-bold text-slate-100">เทศบาลเมืองนางรอง</p>
              </div>
            </div>
            
            {/* Live Online Badge */}
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ระบบออนไลน์
            </div>
          </div>

          {/* Resident Identification */}
          <div className="space-y-3.5 relative z-10">
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">เจ้าของบ้าน / ผู้เช่า</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">{house.ownerName}</h1>
            </div>
            
            {/* Address Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">บ้านเลขที่</p>
                <p className="font-mono text-base sm:text-lg font-bold text-slate-100 mt-0.5">{house.houseNumber}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">ชุมชน / โซน</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-1 truncate">
                  {house.zone || (house.moo ? `หมู่ ${house.moo}` : '-')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. RECEIPT PERFORATION TEAR EFFECT
        ======================================================== */}
        <div className="relative bg-white h-4 flex items-center justify-between px-2 overflow-hidden select-none">
          <div className="absolute top-0 left-0 -mt-2 -ml-3 w-6 h-6 rounded-full bg-slate-50 border-r border-slate-100" />
          <div className="w-full border-b-2 border-dashed border-slate-200 mx-4" />
          <div className="absolute top-0 right-0 -mt-2 -mr-3 w-6 h-6 rounded-full bg-slate-50 border-l border-slate-100" />
        </div>

        {/* ========================================================
            3. BOTTOM SECTION: MINIMALIST TRANSACTION LEDGER
        ======================================================== */}
        <div className="bg-white rounded-b-3xl p-6 sm:p-7 relative">
          
          {/* Section Heading */}
          <div className="mb-5 flex items-baseline justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">รายการค่าธรรมเนียมเก็บขนมูลฝอย</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">กำหนดชำระภายในวันที่ 15 ของทุกเดือน</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">INVOICES</span>
          </div>

          {/* Interactive Invoice Selection Form */}
          <InvoiceSelectionForm invoices={houseInvoices} house={house} />
          
          {/* ========================================================
              4. RECENT PAYMENTS ACCORDION (30 DAYS)
          ======================================================== */}
          {recentTransactions.length > 0 && (
            <div className="mt-7 pt-6 border-t border-slate-100">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ประวัติการชำระเงิน (30 วันล่าสุด)
                </h3>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {recentTransactions.length} รายการ
                </span>
              </div>
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-mono font-bold text-slate-800">
                          {formatThaiDate(new Date(tx.paidAt || tx.createdAt || new Date()))}
                        </p>
                        {tx.receiptCode && (
                          <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-1 py-0.2 rounded">
                            {tx.receiptCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        ผ่าน {tx.verifiedBy === 'line_bot_auto' ? 'ระบบอัตโนมัติ' : tx.verifiedBy === 'line_bot' ? 'LINE Bot' : 'เจ้าหน้าที่'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <p className="font-mono font-bold text-emerald-600">
                        +{parseFloat(tx.amount || "0").toFixed(2)} ฿
                      </p>
                      <Link
                        href={`/pay/${tx.id}/success`}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        ใบเสร็จ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Helpline Footer */}
          <div className="mt-7 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              กรณีมีข้อสงสัย ติดต่อ <strong>กองสาธารณสุขและสิ่งแวดล้อม</strong><br />
              โทร: <a href="tel:044631419" className="text-slate-600 hover:underline">044-631-419</a> (เทศบาลเมืองนางรอง)
            </p>
          </div>
        </div>
      </div>
      
      {/* Return Link */}
      <Link 
        href="/" 
        className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors underline-offset-4 hover:underline relative z-10"
      >
        <ArrowLeft size={13} />
        <span>กลับไปหน้าค้นหา</span>
      </Link>
    </div>
  );
}
