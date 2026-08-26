import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
import { eq, asc, desc, and, gte, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import InvoiceSelectionForm from "@/components/InvoiceSelectionForm";
import Link from "next/link";
import { ArrowLeft, MapPin, User } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Top Header / App Bar */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors -ml-2 text-slate-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-slate-800">ชำระค่าธรรมเนียมขยะ</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6 flex gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User size={24} className="text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-0.5">ชื่อผู้ชำระ / เจ้าของบ้าน</p>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{house.ownerName}</h2>
            
            <div className="flex items-start gap-1.5 mt-2 text-sm text-slate-600">
              <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />
              <p>บ้านเลขที่ {house.houseNumber} <br/><span className="text-slate-500 text-xs">ชุมชน{house.zone || "-"}</span></p>
            </div>
          </div>
        </div>

        {/* Invoice Selection Section */}
        <InvoiceSelectionForm invoices={houseInvoices} house={house} />
        
        {/* Recent Transactions (Optional) */}
        {recentTransactions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-800 mb-3 px-1">ประวัติการชำระเงินล่าสุด</h3>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
              {recentTransactions.slice(0, 3).map(tx => (
                <div key={tx.id} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">ชำระสำเร็จ</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(tx.paidAt || tx.createdAt || new Date()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 text-sm">+{parseFloat(tx.amount || "0").toFixed(2)} ฿</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.receiptCode || 'PAID'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
