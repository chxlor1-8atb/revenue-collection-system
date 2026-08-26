import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, asc, desc, and, inArray, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center lg:justify-center gap-12 lg:gap-24 relative overflow-hidden">
      {/* Background abstract grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Decorative gradient blur for desktop */}
      <div className="hidden lg:block absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-0"></div>

      {/* Desktop Branding Left Column */}
      <div className="hidden lg:flex flex-col max-w-md relative z-10">
        <div className="bg-white/80 p-4 rounded-3xl shadow-sm border border-slate-100 w-fit mb-8 backdrop-blur-sm">
          <img src="/nangrong-logo.png" alt="Municipal Logo" className="w-16 h-16 object-contain" />
        </div>
        <h1 className="text-5xl font-sans font-bold text-slate-900 tracking-tight leading-[1.15] mb-6">
          ตรวจสอบและ<br/><span className="text-[#5B58F2]">ชำระค่าธรรมเนียมขยะ</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 leading-relaxed">
          เทศบาลเมืองนางรองอำนวยความสะดวกในการตรวจสอบยอดค้างชำระและชำระเงินผ่าน QR Code ได้ทันที ปลอดภัยและรวดเร็ว
        </p>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-700 bg-white/60 px-6 py-4 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-sm w-fit">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          อัปเดตข้อมูลแบบเรียลไทม์
        </div>
        
        <Link href="/" className="mt-12 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors underline-offset-4 hover:underline flex items-center gap-2 w-fit">
          ← กลับไปหน้าค้นหา
        </Link>
      </div>

      {/* Main Interactive Bill Component */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10">
        
        {/* TOP SECTION: Municipal Header (Navy Blue Gradient) */}
        <div className="bg-linear-to-br from-[#0F172A] to-[#1E293B] p-8 text-white relative">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-xs p-2 rounded-2xl border border-white/10">
                <img src="/nangrong-logo.png" alt="Municipal Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">ใบแจ้งหนี้ค่าธรรมเนียมขยะ</span>
                <p className="text-sm font-bold text-slate-200">เทศบาลเมืองนางรอง</p>
              </div>
            </div>
            
            {/* Status Pill */}
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ระบบออนไลน์
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">เจ้าของบ้าน / ผู้เช่า</p>
              <p className="text-2xl font-bold font-sans tracking-tight text-white mt-0.5">{house.ownerName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
              <div>
                <p className="text-xs text-slate-400 font-medium">บ้านเลขที่</p>
                <p className="font-mono text-lg font-bold text-slate-100 mt-0.5">{house.houseNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">ชุมชน / โซน</p>
                <p className="text-sm font-medium text-slate-200 mt-1">{house.zone || (house.moo ? `หมู่ ${house.moo}` : '-')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RECEIPT TEAR EFFECT (Visual Separation) */}
        <div className="relative bg-white h-4 flex items-center justify-between px-2 overflow-hidden">
          <div className="absolute top-0 left-0 -mt-2 -ml-3 w-6 h-6 rounded-full bg-slate-50 border-r border-slate-100"></div>
          <div className="w-full border-b-2 border-dashed border-slate-200 mx-4"></div>
          <div className="absolute top-0 right-0 -mt-2 -mr-3 w-6 h-6 rounded-full bg-slate-50 border-l border-slate-100"></div>
        </div>

        {/* BOTTOM SECTION: Transaction Ledger (White) */}
        <div className="bg-white rounded-b-3xl p-8 sm:p-10 relative shadow-inner">
          <div className="mb-6 flex items-baseline justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">รายการค่าธรรมเนียมเก็บขนมูลฝอย</h2>
              <p className="text-xs text-slate-500 mt-1">กำหนดชำระภายในวันที่ 15 ของทุกเดือน</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider">INVOICES</span>
          </div>
          <InvoiceSelectionForm invoices={houseInvoices} house={house} />
          
          {recentTransactions.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ประวัติการชำระเงิน (30 วันล่าสุด)
                </h3>
              </div>
              <div className="space-y-2.5">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800 font-mono">
                          {formatThaiDate(new Date(tx.paidAt || tx.createdAt || new Date()))}
                        </p>
                        {tx.receiptCode && (
                          <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded">
                            {tx.receiptCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ผ่าน {tx.verifiedBy === 'line_bot_auto' ? 'ระบบอัตโนมัติ' : tx.verifiedBy === 'line_bot' ? 'LINE Bot' : 'เจ้าหน้าที่'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-600 text-sm">
                          +{parseFloat(tx.amount || "0").toFixed(2)} ฿
                        </p>
                      </div>
                      <Link
                        href={`/pay/${tx.id}/success`}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        ใบเสร็จ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              กรณีมีข้อสงสัย ติดต่อ <strong>กองสาธารณสุขและสิ่งแวดล้อม</strong><br/>
              โทร: 044-631-419 (เทศบาลเมืองนางรอง)
            </p>
          </div>
        </div>
      </div>
      
      {/* Mobile return link */}
      <Link href="/" className="lg:hidden mt-8 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors underline-offset-4 hover:underline relative z-10">
        ← กลับไปหน้าค้นหา
      </Link>
    </div>
  );
}
