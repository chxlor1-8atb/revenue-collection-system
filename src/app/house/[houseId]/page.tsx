import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, asc, desc, and, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

  // Deterministic mini barcode for the footer
  const barcodeLines = Array.from({ length: 45 }).map((_, i) => {
    const seed = (houseId * 37 + i * 19) % 100;
    const width = seed > 70 ? 'w-1.5' : seed > 40 ? 'w-1' : 'w-0.5';
    const opacity = seed > 85 ? 'opacity-0' : 'opacity-100'; // Some gaps
    return <div key={i} className={`h-10 bg-slate-800 ${width} ${opacity} mx-[1px] shrink-0`}></div>;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 py-8 sm:py-16 px-4 sm:px-6 flex flex-col items-center justify-center relative font-sans">
      
      {/* 
        ========================================================
        THE HYPER-REALISTIC THERMAL RECEIPT
        ========================================================
      */}
      <div className="w-full max-w-[400px] relative z-10 drop-shadow-2xl flex flex-col group">
        
        {/* TOP SAWTOOTH EDGE */}
        <div className="w-full h-3 overflow-hidden text-[#FDFBF7] flex drop-shadow-md">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="w-3 h-3 bg-current transform rotate-45 -translate-y-1.5 origin-bottom-left shrink-0"></div>
          ))}
        </div>

        {/* RECEIPT PAPER BODY */}
        <div className="bg-[#FDFBF7] w-full px-7 pt-8 pb-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.02)] relative z-10">
          
          {/* Subtle paper noise texture */}
          <div className="absolute inset-0 opacity-[0.4] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

          <div className="relative z-10">
            {/* LOGO & HEADER */}
            <div className="flex flex-col items-center justify-center text-center mb-6">
              <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-3">
                <img src="/nangrong-logo.png" alt="Seal" className="w-9 h-9 object-contain filter invert brightness-200" />
              </div>
              <h1 className="font-bold text-slate-900 text-lg tracking-wide">เทศบาลเมืองนางรอง</h1>
              <p className="font-mono text-xs text-slate-600 tracking-widest mt-1">TAX INVOICE / RECEIPT</p>
            </div>

            <div className="border-b-2 border-dotted border-slate-400/60 mb-4"></div>

            {/* METADATA */}
            <div className="font-mono text-xs text-slate-800 space-y-1 mb-4">
              <div className="flex justify-between">
                <span>DATE: {new Date().toLocaleDateString('en-GB')}</span>
                <span>TIME: {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>TERM: WEB-01</span>
                <span>REF: #{houseId.toString().padStart(5, '0')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>MODE: ONLINE</span>
                <span>STATUS: DRAFT</span>
              </div>
            </div>

            <div className="border-b-2 border-dotted border-slate-400/60 mb-4"></div>

            {/* CUSTOMER INFO */}
            <div className="font-mono text-xs text-slate-800 mb-6">
              <p>BILL TO:</p>
              <p className="font-bold text-sm font-sans text-slate-950 mt-1">{house.ownerName}</p>
              <p className="mt-1">ADDR: {house.houseNumber}</p>
              <p>ZONE: {house.zone || "-"}</p>
            </div>

            <div className="border-b-[3px] border-double border-slate-900/40 mb-6"></div>

            {/* INTERACTIVE INVOICE SELECTION FORM */}
            <InvoiceSelectionForm invoices={houseInvoices} house={house} />
            
            {/* RECENT TRANSACTIONS (If any) */}
            {recentTransactions.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-dotted border-slate-400/60 font-mono text-[10px] text-slate-500 space-y-2">
                <p className="text-center font-bold text-slate-700 mb-3 tracking-widest">--- RECENT PAYMENTS ---</p>
                {recentTransactions.slice(0,3).map(tx => (
                  <div key={tx.id} className="flex justify-between items-center">
                    <span>{new Date(tx.paidAt || tx.createdAt || new Date()).toLocaleDateString('en-GB')}</span>
                    <span>{tx.receiptCode || 'PAID'}</span>
                    <span className="font-bold text-slate-800">+{parseFloat(tx.amount || "0").toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* BARCODE FOOTER */}
            <div className="mt-8 pt-6 border-t-2 border-dotted border-slate-400/60 flex flex-col items-center">
              <div className="flex items-center justify-center overflow-hidden w-full max-w-[280px]">
                {barcodeLines}
              </div>
              <p className="font-mono text-[10px] text-slate-500 mt-2 tracking-[0.3em]">
                {house.id.toString().padStart(4, '0')}-{new Date().getFullYear()}-{house.houseNumber?.replace(/[^0-9]/g, '').padStart(4, '0')}
              </p>
              <p className="font-mono text-[9px] text-slate-400 mt-4 text-center">
                THANK YOU FOR YOUR PAYMENT<br/>
                TEL: 044-631-419
              </p>
            </div>

          </div>
        </div>

        {/* BOTTOM SAWTOOTH EDGE */}
        <div className="w-full h-3 overflow-hidden text-[#FDFBF7] flex drop-shadow-md rotate-180">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="w-3 h-3 bg-current transform rotate-45 -translate-y-1.5 origin-bottom-left shrink-0"></div>
          ))}
        </div>
      </div>
      
      {/* Return Link */}
      <Link 
        href="/" 
        className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors underline-offset-4 hover:underline relative z-10"
      >
        <ArrowLeft size={16} />
        <span>กลับไปหน้าค้นหา</span>
      </Link>
    </div>
  );
}
