import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, qrCodes } from "@/lib/schema";
import { inArray, eq, and, gte, lt } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { invoiceIds, qrCodeId } = await request.json();

    if (!invoiceIds || invoiceIds.length === 0) {
      return NextResponse.json({ error: "No invoices provided" }, { status: 400 });
    }

    // 0. Auto-cleanup: Clear old stuck transactions
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 3);

    try {
      // Find expired waiting_for_slip transactions
      const expiredTxs = await db.select().from(transactions).where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          lt(transactions.createdAt, expiryTime)
        )
      );
      
      const expiredIds = expiredTxs.map(t => t.id);
      if (expiredIds.length > 0) {
        // Unlink invoices first
        await db.update(invoices)
          .set({ transactionId: null })
          .where(inArray(invoices.transactionId, expiredIds));
        
        // Delete the transactions
        await db.delete(transactions)
          .where(inArray(transactions.id, expiredIds));
      }
    } catch (cleanupError) {
      console.error("Cleanup Error:", cleanupError);
      // Ignore cleanup error, proceed with intent creation
    }

    // Get invoices
    const targetInvoices = await db.select().from(invoices).where(inArray(invoices.id, invoiceIds));
    if (targetInvoices.length === 0) {
      return NextResponse.json({ error: "Invoices not found" }, { status: 404 });
    }

    // Check if any invoice is currently locked (has an active waiting_for_slip transaction)
    const lockedInvoices = await db.select({ 
        id: invoices.id, 
        transactionId: transactions.id 
      })
      .from(invoices)
      .innerJoin(transactions, eq(invoices.transactionId, transactions.id))
      .where(
        and(
          inArray(invoices.id, invoiceIds),
          eq(transactions.slipStatus, 'waiting_for_slip')
        )
      );

    if (lockedInvoices.length > 0) {
      // The user wants to generate a new QR, so we clear the old one instead of blocking them.
      const txIdsToClear = [...new Set(lockedInvoices.map(i => i.transactionId))];
      
      if (txIdsToClear.length > 0) {
        await db.update(invoices)
          .set({ transactionId: null })
          .where(inArray(invoices.transactionId, txIdsToClear));
          
        await db.delete(transactions)
          .where(inArray(transactions.id, txIdsToClear));
      }
    }

    // Calculate base amount
    const baseAmount = targetInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    // Get QR Code info to find collectorId
    const qrCode = await db.select().from(qrCodes).where(eq(qrCodes.id, qrCodeId || 1)).limit(1);
    if (qrCode.length === 0) {
      return NextResponse.json({ error: "QR Code not found" }, { status: 404 });
    }
    const collectorId = qrCode[0].collectorId;

    // We use the expiryTime defined at the top of the function for checking against pending transactions
    let finalAmount = baseAmount;
    let attempts = 0;
    let isUnique = false;

    // Loop up to 10 times to find a unique decimal
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

    // Create a waiting transaction
    const newTx = await db.insert(transactions).values({
      qrCodeId: qrCode[0].id,
      collectorId: collectorId,
      amount: finalAmount.toString(),
      slipImageUrl: "pending", // Placeholder since schema is notNull
      slipStatus: "waiting_for_slip", // Special status
    }).returning();

    const transactionId = newTx[0].id;

    // Link invoices to this transaction
    await db.update(invoices)
      .set({ transactionId: transactionId })
      .where(inArray(invoices.id, invoiceIds));

    return NextResponse.json({ 
      transactionId, 
      amount: finalAmount 
    });

  } catch (error) {
    console.error("Intent Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
