import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, asc, desc, and, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";
import { ArrowLeft, User, MapPin } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 flex flex-col items-center justify-center font-sans relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* MAIN CARD */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative z-10 flex flex-col">
        
        {/* HEADER SECTION (Navy Tone) */}
        <div className="bg-slate-900 p-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h1 className="text-xl font-bold tracking-tight">สรุปยอดชำระค่าขยะ</h1>
            <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
              REF: {(house.houseNumber || "").replace(/[^0-9]/g, '').padStart(4, '0')}
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 relative z-10">
            <p className="text-[11px] text-slate-400 mb-1">ชื่อผู้ชำระ / เจ้าของบ้าน</p>
            <h2 className="text-lg font-bold text-white mb-2">{house.ownerName}</h2>
            <div className="flex items-start gap-1.5 text-sm text-slate-300">
              <MapPin size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <p>บ้านเลขที่ {house.houseNumber} <br/><span className="text-slate-400 text-xs">ชุมชน{house.zone || "-"}</span></p>
            </div>
          </div>
        </div>

        {/* BODY SECTION */}
        <div className="p-6 bg-white">
          <InvoiceSelectionForm invoices={houseInvoices} house={house} />
          
          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-3">ประวัติการชำระเงินล่าสุด</h3>
              <div className="space-y-3">
                {recentTransactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">ชำระสำเร็จ</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(tx.paidAt || tx.createdAt || new Date()).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-sm">+{parseFloat(tx.amount || "0").toFixed(2)} ฿</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Link 
        href="/" 
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors underline-offset-4 hover:underline relative z-10"
      >
        <ArrowLeft size={16} />
        <span>กลับไปหน้าค้นหา</span>
      </Link>
    </div>
  );
}
