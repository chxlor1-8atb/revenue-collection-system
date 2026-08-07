import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";
import SlipReviewForm from "./SlipReviewForm";

export default async function SlipReviewPage() {
  // Fetch pending transactions
  const pendingTransactions = await db.select()
    .from(transactions)
    .where(eq(transactions.slipStatus, 'pending'))
    .orderBy(desc(transactions.createdAt));

  // If there are pending transactions, fetch their associated invoices and houses
  let transactionsWithInvoices = [];

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
      <h1 className="font-serif text-3xl mb-6">ตรวจสลิปโอนเงิน (รอดำเนินการ)</h1>
      
      {transactionsWithInvoices.length === 0 ? (
        <div className="receipt-card text-center py-12">
          <p className="text-status-dark">ไม่มีสลิปที่รอตรวจสอบในขณะนี้ 🎉</p>
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
