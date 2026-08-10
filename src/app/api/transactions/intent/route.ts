import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, qrCodes } from "@/lib/schema";
import { inArray, eq } from "drizzle-orm";

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

    // Generate random decimal between .01 and .99
    // In a real production system, you'd want to loop and check for collisions
    // against pending transactions in the last 24h. For now, we assume low collision rate.
    const randomCents = Math.floor(Math.random() * 99) + 1;
    const finalAmount = baseAmount + (randomCents / 100);

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
