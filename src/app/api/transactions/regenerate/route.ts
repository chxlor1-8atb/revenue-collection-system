import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices } from "@/lib/schema";
import { eq, inArray, and, gte, or, isNull } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: "No transactionId provided" }, { status: 400 });
    }

    // 1. Get old transaction
    const oldTxs = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
    if (oldTxs.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    const oldTx = oldTxs[0];

    // If it's already verified, we shouldn't regenerate
    if (oldTx.slipStatus === "verified" || oldTx.slipStatus === "processed") {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    // 2. Get the associated invoices
    const targetInvoices = await db.select().from(invoices).where(eq(invoices.transactionId, transactionId));
    if (targetInvoices.length === 0) {
      return NextResponse.json({ error: "No invoices associated with this transaction" }, { status: 404 });
    }
    const invoiceIds = targetInvoices.map(inv => inv.id);

    // Calculate base amount
    const baseAmount = targetInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    // 3. Generate new decimal using sequential + lockKey (same logic as intent route)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 3);

    const activeTransactions = await db.select({ amount: transactions.amount })
      .from(transactions)
      .where(and(
        eq(transactions.slipStatus, 'waiting_for_slip'),
        gte(transactions.createdAt, expiryTime)
      ));

    const usedCents = new Set(
      activeTransactions
        .map(tx => parseFloat(tx.amount || "0"))
        .filter(amt => Math.floor(amt) === baseAmount)
        .map(amt => Math.round((amt - baseAmount) * 100))
    );

    let selectedCents = 1;
    let newTx: any[] | null = null;
    let finalAmount = baseAmount;

    while (selectedCents <= 99 && !newTx) {
      if (!usedCents.has(selectedCents)) {
        finalAmount = baseAmount + (selectedCents / 100);
        try {
          newTx = await db.insert(transactions).values({
            amount: finalAmount.toString(),
            slipImageUrl: "pending",
            slipStatus: "waiting_for_slip",
            lockKey: `waiting_${finalAmount}`,
          }).returning();
        } catch (insertError: any) {
          if (insertError.code === '23505' || insertError.message?.includes('unique constraint')) {
            console.log(`Regenerate: Amount ${finalAmount} taken, retrying...`);
            newTx = null;
          } else {
            throw insertError;
          }
        }
      }
      if (!newTx) selectedCents++;
    }

    if (!newTx) {
      return NextResponse.json({ error: "System busy. Please try again in 3 minutes." }, { status: 429 });
    }

    const newTransactionId = newTx[0].id;

    // 5. Update invoices to point to the new transaction
    const updatedInvoices = await db.update(invoices)
      .set({ transactionId: newTransactionId })
      .where(
        and(
          inArray(invoices.id, invoiceIds),
          or(eq(invoices.transactionId, oldTx.id), isNull(invoices.transactionId))
        )
      )
      .returning({ id: invoices.id });
      
    if (updatedInvoices.length !== invoiceIds.length) {
      // Race condition!
      await db.delete(transactions).where(eq(transactions.id, newTransactionId));
      return NextResponse.json({ error: "Invoices were locked by another request" }, { status: 409 });
    }

    // 6. Delete old transaction instead of just marking as expired to save database space
    await db.delete(transactions)
      .where(eq(transactions.id, oldTx.id));

    return NextResponse.json({ 
      transactionId: newTransactionId, 
      amount: finalAmount 
    });

  } catch (error) {
    console.error("Regenerate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
