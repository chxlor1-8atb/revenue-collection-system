import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, inArray, and, or, isNull } from "drizzle-orm";
import { broadcastEvent } from "@/lib/eventHub";
import { generateIdempotencyKey, acquireInFlightLock, releaseInFlightLock } from "@/lib/idempotency";

export async function POST(request: Request) {
  let idempotencyKey: string | null = null;

  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: "No transactionId provided" }, { status: 400 });
    }

    // 1. Concurrency control on regenerate
    idempotencyKey = generateIdempotencyKey("regenerate", transactionId);
    const lockAcquired = acquireInFlightLock(idempotencyKey, 6);
    if (!lockAcquired) {
      return NextResponse.json({ error: "กำลังต่อเวลา QR Code กรุณารอสักครู่..." }, { status: 429 });
    }

    // 2. Get old transaction
    const oldTxs = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
    if (oldTxs.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    const oldTx = oldTxs[0];

    // If it's already verified, we shouldn't regenerate
    if (oldTx.slipStatus === "verified" || oldTx.slipStatus === "processed") {
      return NextResponse.json({ error: "Transaction already processed", isVerified: true }, { status: 400 });
    }

    // 3. Get the associated invoices
    const targetInvoices = await db.select().from(invoices).where(eq(invoices.transactionId, transactionId));
    if (targetInvoices.length === 0) {
      return NextResponse.json({ error: "No invoices associated with this transaction" }, { status: 404 });
    }
    const invoiceIds = targetInvoices.map(inv => inv.id);

    // Calculate base amount
    const baseAmount = targetInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const finalAmount = baseAmount;

    // Fetch house details for broadcast
    let houseNumber = "-";
    let ownerName = "-";
    if (targetInvoices[0]?.houseId) {
      const h = await db.select().from(houses).where(eq(houses.id, targetInvoices[0].houseId)).limit(1);
      if (h.length > 0) {
        houseNumber = h[0].houseNumber;
        ownerName = h[0].ownerName;
      }
    }

    let newTransactionId = 0;

    // 4. ATOMIC DATABASE TRANSACTION
    await db.transaction(async (txDb) => {
      // Create new transaction
      const [newTx] = await txDb.insert(transactions).values({
        amount: finalAmount.toString(),
        slipImageUrl: '',
        slipStatus: 'waiting_for_slip',
      }).returning();

      newTransactionId = newTx.id;

      // Update invoices to point to the new transaction
      const updatedInvoices = await txDb.update(invoices)
        .set({ transactionId: newTransactionId })
        .where(
          and(
            inArray(invoices.id, invoiceIds),
            or(eq(invoices.transactionId, oldTx.id), isNull(invoices.transactionId))
          )
        )
        .returning({ id: invoices.id });
        
      if (updatedInvoices.length !== invoiceIds.length) {
        throw new Error("Invoices were locked by another request");
      }

      // Delete old transaction
      await txDb.delete(transactions).where(eq(transactions.id, oldTx.id));
    });

    // 5. REAL-TIME BROADCAST TO SSE STREAM
    broadcastEvent("qr:created", {
      transactionId: newTransactionId,
      houseNumber,
      ownerName,
      amount: finalAmount.toString(),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      transactionId: newTransactionId, 
      amount: finalAmount 
    });

  } catch (error) {
    console.error("Regenerate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (idempotencyKey) {
      releaseInFlightLock(idempotencyKey);
    }
  }
}
