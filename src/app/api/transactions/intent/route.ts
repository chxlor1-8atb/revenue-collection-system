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
      const activeTxIds = [...new Set(lockedInvoices.map(i => i.transactionId))];
      
      // If there is exactly ONE active transaction involved, let's check if it's an exact match
      if (activeTxIds.length === 1) {
        const txId = activeTxIds[0];
        const invoicesForThisTx = await db.select({ id: invoices.id })
          .from(invoices)
          .where(eq(invoices.transactionId, txId));
          
        const txInvoiceIds = invoicesForThisTx.map(i => i.id).sort();
        const requestedInvoiceIds = [...invoiceIds].sort();
        
        const isExactMatch = txInvoiceIds.length === requestedInvoiceIds.length && 
          txInvoiceIds.every((id, index) => id === requestedInvoiceIds[index]);
          
        if (isExactMatch) {
          // Exact same request! Check if it's still active (not expired)
          const txData = await db.select({ amount: transactions.amount, createdAt: transactions.createdAt })
            .from(transactions)
            .where(eq(transactions.id, txId))
            .limit(1);
            
          if (txData.length > 0) {
             const txCreatedAt = new Date(txData[0].createdAt || new Date());
             if (txCreatedAt >= expiryTime) {
               // Still active, just return this one!
               return NextResponse.json({ 
                 transactionId: txId, 
                 amount: parseFloat(txData[0].amount || "0") 
               });
             }
          }
        }
      }

      // If it's NOT an exact match (or it's expired), we clear the old one(s) instead of blocking.
      if (activeTxIds.length > 0) {
        await db.update(invoices)
          .set({ transactionId: null })
          .where(inArray(invoices.transactionId, activeTxIds));
          
        await db.delete(transactions)
          .where(inArray(transactions.id, activeTxIds));
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

    // To assign sequential decimals (e.g. .01, .02) starting from the lowest available
    // First, find all currently active waiting transactions to see which decimals are taken
    const activeTransactions = await db.select({ amount: transactions.amount }).from(transactions).where(
      and(
        eq(transactions.slipStatus, 'waiting_for_slip'),
        gte(transactions.createdAt, expiryTime)
      )
    );

    // Extract the decimals (cents) that are currently in use for this exact baseAmount
    const usedCents = new Set(
      activeTransactions
        .map(tx => parseFloat(tx.amount || "0"))
        .filter(amt => Math.floor(amt) === baseAmount)
        .map(amt => Math.round((amt - baseAmount) * 100))
    );

    // Find the lowest available decimal from 1 to 99
    let selectedCents = 1;
    let foundUnique = false;
    
    while (selectedCents <= 99) {
      if (!usedCents.has(selectedCents)) {
        finalAmount = baseAmount + (selectedCents / 100);
        foundUnique = true;
        break;
      }
      selectedCents++;
    }

    if (!foundUnique) {
      return NextResponse.json({ error: "System busy. Too many transactions with this amount. Please try again in 3 minutes." }, { status: 429 });
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
