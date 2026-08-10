import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, qrCodes } from "@/lib/schema";
import { eq, inArray, and, gte } from "drizzle-orm";

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

    // 3. Generate new decimal amount
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 3);

    let finalAmount = baseAmount;
    let attempts = 0;
    let isUnique = false;

    while (!isUnique && attempts < 10) {
      const randomCents = Math.floor(Math.random() * 99) + 1;
      const amountCandidate = baseAmount + (randomCents / 100);
      
      const existing = await db.select().from(transactions).where(and(
         eq(transactions.amount, amountCandidate.toString()),
         eq(transactions.slipStatus, 'waiting_for_slip'),
         gte(transactions.createdAt, expiryTime)
      )).limit(1);

      if (existing.length === 0) {
        finalAmount = amountCandidate;
        isUnique = true;
      }
      attempts++;
    }

    // 4. Create new transaction
    const newTx = await db.insert(transactions).values({
      qrCodeId: oldTx.qrCodeId,
      collectorId: oldTx.collectorId,
      amount: finalAmount.toString(),
      slipImageUrl: "pending", 
      slipStatus: "waiting_for_slip", 
    }).returning();

    const newTransactionId = newTx[0].id;

    // 5. Update invoices to point to the new transaction
    await db.update(invoices)
      .set({ transactionId: newTransactionId })
      .where(inArray(invoices.id, invoiceIds));

    // 6. Mark old transaction as expired
    await db.update(transactions)
      .set({ slipStatus: "expired" })
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
