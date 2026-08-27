import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, inArray, and, or, isNull } from "drizzle-orm";
import { generateIdempotencyKey, acquireInFlightLock, releaseInFlightLock } from "@/lib/idempotency";
import { checkRateLimit } from "@/lib/redis";

export async function POST(request: Request) {
  let idempotencyKey: string | null = null;

  try {
    // 0. IP Rate Limiting (Prevent DoS)
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = await checkRateLimit(`regen_${ip}`);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "คำขอเยอะเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: "No transactionId provided" }, { status: 400 });
    }

    // 1. Concurrency control on regenerate
    idempotencyKey = generateIdempotencyKey("regenerate", transactionId);
    const lockAcquired = await acquireInFlightLock(idempotencyKey, 6);
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

    // 4. Create new transaction
    const [newTx] = await db.insert(transactions).values({
      amount: finalAmount.toString(),
      slipImageUrl: '',
      slipStatus: 'waiting_for_slip',
    }).returning();

    newTransactionId = newTx.id;

    // Update invoices to point to the new transaction
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
      await db.delete(transactions).where(eq(transactions.id, newTransactionId));
      return NextResponse.json({ error: "Invoices were locked by another request" }, { status: 409 });
    }

    // Delete old transaction
    await db.delete(transactions).where(eq(transactions.id, oldTx.id));

    return NextResponse.json({ 
      transactionId: newTransactionId, 
      amount: finalAmount 
    });

  } catch (error) {
    console.error("Regenerate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (idempotencyKey) {
      await releaseInFlightLock(idempotencyKey);
    }
  }
}
