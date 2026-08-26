import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, asc, desc, and, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";
import { CheckCircle2, Receipt, ArrowLeft, Home, Building2, ShieldCheck } from "lucide-react";

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

  // Generate deterministic mini barcode lines
  const barcodeLines = Array.from({ length: 32 }).map((_, i) => {
    const seed = (houseId * 23 + i * 19) % 100;
    const width = seed > 60 ? 'w-1' : 'w-0.5';
    const opacity = seed > 80 ? 'opacity-30' : 'opacity-80';
    return <div key={i} className={`h-6 bg-slate-400 ${width} ${opacity} mx-[1px] shrink-0`}></div>;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-12 px-3 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background dot grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* Main Modern Receipt Ticket Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-300/40 border border-slate-200/80 overflow-hidden relative z-10">
        
        {/* ========================================================
            1. TOP SECTION: MODERN DEEP NAVY STUB
        ======================================================== */}
        <div className="bg-gradient-to-b from-[#0B132B] via-[#0F172A] to-[#1E293B] p-6 sm:p-7 text-white relative overflow-hidden">
          
          {/* Top Receipt Serial Bar */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-700/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-slate-400">
                #INV-{new Date().getFullYear() + 543}-{(house.houseNumber || "").replace(/[^0-9]/g, '').padStart(4, '0')}
              </span>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ระบบออนไลน์
            </div>
          </div>

          {/* Municipal Identity Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/15 p-1.5 flex items-center justify-center shrink-0">
              <img src="/nangrong-logo.png" alt="Municipal Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ใบแจ้งหนี้ค่าธรรมเนียมเก็บขนมูลฝอย</p>
              <h2 className="text-sm font-bold text-white tracking-tight">เทศบาลเมืองนางรอง</h2>
            </div>
          </div>

          {/* Resident Identity Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm space-y-3">
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">เจ้าของบ้าน / ผู้เช่า</p>
              <h1 className="text-xl font-black text-white mt-0.5 tracking-tight">{house.ownerName}</h1>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10 text-xs">
              <div>
                <p className="text-[10px] text-slate-400">บ้านเลขที่</p>
                <p className="font-mono text-base font-bold text-emerald-400 mt-0.5">{house.houseNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">ชุมชน / โซน</p>
                <p className="text-xs font-semibold text-slate-200 mt-1 truncate">
                  {house.zone || (house.moo ? `หมู่ ${house.moo}` : '-')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. RECEIPT PERFORATION TEAR EFFECT
        ======================================================== */}
        <div className="relative bg-white h-5 flex items-center justify-between px-2 overflow-hidden select-none -my-0.5 z-20">
          <div className="absolute top-0 left-0 -mt-2.5 -ml-3.5 w-7 h-7 rounded-full bg-slate-100 border-r border-slate-200" />
          <div className="w-full border-b-2 border-dashed border-slate-200 mx-5" />
          <div className="absolute top-0 right-0 -mt-2.5 -mr-3.5 w-7 h-7 rounded-full bg-slate-100 border-l border-slate-200" />
        </div>

        {/* ========================================================
            3. MAIN RECEIPT BODY (WHITE LEDGER)
        ======================================================== */}
        <div className="bg-white rounded-b-3xl p-6 sm:p-7 relative z-10">
          
          {/* Invoices Selection & Payment Engine */}
          <InvoiceSelectionForm invoices={houseInvoices} house={house} />
          
          {/* ========================================================
              4. RECENT PAYMENTS LEDGER (30 DAYS)
          ======================================================== */}
          {recentTransactions.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ประวัติการชำระเงิน (30 วันล่าสุด)
                </h3>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {recentTransactions.length} รายการ
                </span>
              </div>
              <div className="space-y-1.5">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-mono font-bold text-slate-800 text-[11px]">
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
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-emerald-600 text-xs">
                        +{parseFloat(tx.amount || "0").toFixed(2)} ฿
                      </p>
                      <Link
                        href={`/pay/${tx.id}/success`}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        ใบเสร็จ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decorative Barcode Strip at Base */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 select-none opacity-60">
            <div className="flex items-center justify-center overflow-hidden max-w-[200px]">
              {barcodeLines}
            </div>
            <span className="font-mono text-[9px] text-slate-400 tracking-widest">
              *NR-{house.id?.toString().padStart(6, '0')}*
            </span>
          </div>

          {/* Support Helpline Footer */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง<br />
              โทร: <a href="tel:044631419" className="text-slate-600 font-semibold hover:underline">044-631-419</a>
            </p>
          </div>
        </div>
      </div>
      
      {/* Return Link */}
      <Link 
        href="/" 
        className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors underline-offset-4 hover:underline relative z-10"
      >
        <ArrowLeft size={13} />
        <span>กลับไปหน้าค้นหา</span>
      </Link>
    </div>
  );
}
