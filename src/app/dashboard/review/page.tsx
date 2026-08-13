import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, desc, inArray, or } from "drizzle-orm";
import SlipReviewForm from "./SlipReviewForm";
import { FileSignature } from "lucide-react";

export default async function SlipReviewPage() {
  // Fetch pending transactions
  const pendingTransactions = await db.select()
    .from(transactions)
    .where(or(
      eq(transactions.slipStatus, 'pending'),
      eq(transactions.slipStatus, 'waiting_for_slip')
    ))
    .orderBy(desc(transactions.createdAt));

  // If there are pending transactions, fetch their associated invoices and houses
  let transactionsWithInvoices: any[] = [];

  if (pendingTransactions.length > 0) {
    const txIds = pendingTransactions.map(t => t.id);
    
    const relatedInvoices = await db.select({
      id: invoices.id,
      transactionId: invoices.transactionId,
      monthYear: invoices.monthYear,
      amount: invoices.amount,
      houseNumber: houses.houseNumber,
      ownerName: houses.ownerName,
    })
    .from(invoices)
    .innerJoin(houses, eq(invoices.houseId, houses.id))
    .where(inArray(invoices.transactionId, txIds));

    transactionsWithInvoices = pendingTransactions.map(tx => {
      const txInvoices = relatedInvoices.filter(inv => inv.transactionId === tx.id);
      return {
        ...tx,
        invoices: txInvoices
      };
    });
  }

  return (
    <div>
      <h1 className="font-serif font-bold text-3xl mb-6 text-[#1F2E22]">ตรวจสลิปโอนเงิน (รอดำเนินการ)</h1>
      
      {transactionsWithInvoices.length === 0 ? (
        <div className="ledger-card text-center py-16 flex flex-col items-center justify-center">
          <FileSignature size={48} strokeWidth={1} color="#C9A227" className="mb-4 opacity-70" />
          <p className="font-serif text-lg text-gray-500">ยังไม่มีรายการรอตรวจสอบ</p>
        </div>
      ) : (
        <div className="space-y-6">
          {transactionsWithInvoices.map((tx) => (
            <SlipReviewForm key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
