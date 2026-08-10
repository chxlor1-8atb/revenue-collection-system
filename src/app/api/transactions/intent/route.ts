import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, qrCodes } from "@/lib/schema";
import { inArray, eq, and, gte } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { invoiceIds, qrCodeId } = await request.json();

    if (!invoiceIds || invoiceIds.length === 0) {
      return NextResponse.json({ error: "No invoices provided" }, { status: 400 });
    }

    // Get invoices
    const targetInvoices = await db.select().from(invoices).where(inArray(invoices.id, invoiceIds));
    if (targetInvoices.length === 0) {
      return NextResponse.json({ error: "Invoices not found" }, { status: 404 });
    }

    // Calculate base amount
    const baseAmount = targetInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    // Get QR Code info to find collectorId
    const qrCode = await db.select().from(qrCodes).where(eq(qrCodes.id, qrCodeId || 1)).limit(1);
    if (qrCode.length === 0) {
      return NextResponse.json({ error: "QR Code not found" }, { status: 404 });
    }
    const collectorId = qrCode[0].collectorId;

    // We only check against pending transactions created in the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

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
         gte(transactions.createdAt, yesterday)
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
