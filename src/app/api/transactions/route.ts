import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { transactions, invoices, systemSettings } from "@/lib/schema";
import { eq, inArray, and, isNull } from "drizzle-orm";
import { sendSlipNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const invoiceIdsStr = formData.get("invoiceIds") as string;
    
    if (!file || !invoiceIdsStr) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const settings = await db.select().from(systemSettings).limit(1);
    const invoiceIds = invoiceIdsStr.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id));

    if (invoiceIds.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    if (settings.length === 0) {
      return NextResponse.json({ error: "System settings not found" }, { status: 404 });
    }
    const collector = { telegramChatId: settings[0].telegramChatId };

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
      amount: totalAmount.toString(),
      slipImageUrl: blob.url,
      slipStatus: "pending",
    }).returning({ id: transactions.id });

    try {
      // Link invoices to this transaction and mark as pending
      const updatedInvoices = await db.update(invoices)
        .set({ status: 'pending', transactionId: newTransaction.id })
        .where(
          and(
            inArray(invoices.id, invoiceIds),
            isNull(invoices.transactionId) // Ensure they aren't already locked
          )
        )
        .returning({ id: invoices.id });
        
      if (updatedInvoices.length !== invoiceIds.length) {
        throw new Error("Concurrency collision: invoices were already processed");
      }
    } catch (linkError) {
      // Rollback: delete the orphaned transaction to keep data consistent
      console.error("Invoice link failed, rolling back transaction:", linkError);
      await db.delete(transactions).where(eq(transactions.id, newTransaction.id));
      return NextResponse.json({ error: "Failed to link invoices. Invoices might have been processed by another request. Please try again." }, { status: 409 });
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
