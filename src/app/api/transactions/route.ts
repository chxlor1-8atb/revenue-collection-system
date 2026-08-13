import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { qrCodes, transactions, collectors } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendSlipNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const qrCodeIdStr = formData.get("qrCodeId") as string;

    const invoiceIdsStr = formData.get("invoiceIds") as string;
    
    if (!file || !qrCodeIdStr || !invoiceIdsStr) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const qrCodeId = parseInt(qrCodeIdStr, 10);
    const invoiceIds = invoiceIdsStr.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (isNaN(qrCodeId) || invoiceIds.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const qrResult = await db
      .select({
        qrCode: qrCodes,
        collector: {
          telegramChatId: collectors.telegramChatId
        }
      })
      .from(qrCodes)
      .innerJoin(collectors, eq(qrCodes.collectorId, collectors.id))
      .where(eq(qrCodes.id, qrCodeId))
      .limit(1);

    if (qrResult.length === 0 || !qrResult[0].qrCode.active) {
      return NextResponse.json({ error: "QR Code not found or inactive" }, { status: 404 });
    }

    const { qrCode, collector } = qrResult[0];

    // Fetch invoices and sum amount
    const { invoices } = await import("@/lib/schema");
    const { inArray } = await import("drizzle-orm");
    const selectedInvoices = await db.select().from(invoices).where(inArray(invoices.id, invoiceIds));
    const totalAmount = selectedInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    // Upload slip to Vercel Blob
    const blob = await put(`slips/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    // Insert transaction record, then link invoices atomically
    // If invoice linking fails, we rollback by deleting the transaction
    const [newTransaction] = await db.insert(transactions).values({
      qrCodeId: qrCode.id,
      collectorId: qrCode.collectorId,
      amount: totalAmount.toString(),
      slipImageUrl: blob.url,
      slipStatus: "pending",
    }).returning({ id: transactions.id });

    try {
      // Link invoices to this transaction and mark as pending
      await db.update(invoices)
        .set({ status: 'pending', transactionId: newTransaction.id })
        .where(inArray(invoices.id, invoiceIds));
    } catch (linkError) {
      // Rollback: delete the orphaned transaction to keep data consistent
      console.error("Invoice link failed, rolling back transaction:", linkError);
      await db.delete(transactions).where(eq(transactions.id, newTransaction.id));
      return NextResponse.json({ error: "Failed to link invoices. Please try again." }, { status: 500 });
    }

    // Send Telegram Notification
    if (collector.telegramChatId) {
      await sendSlipNotification(collector.telegramChatId, blob.url, totalAmount.toString());
    }

    return NextResponse.json({ success: true, url: blob.url }, { status: 200 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
