import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices } from "@/lib/schema";
import { eq, and, lt, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  // Check authorization (e.g. from Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Find all 'waiting_for_slip' transactions older than 15 minutes
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 15);

    const expiredTxs = await db.select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          lt(transactions.createdAt, expiryTime)
        )
      );

    if (expiredTxs.length === 0) {
      return NextResponse.json({ success: true, message: "No expired transactions found." });
    }

    const txIds = expiredTxs.map(tx => tx.id);

    // Atomically cancel them and free up the invoices
    const tx = db; {
      // Unlink invoices
      await tx.update(invoices)
        .set({ status: 'unpaid', transactionId: null })
        .where(
          and(
            inArray(invoices.transactionId, txIds),
            eq(invoices.status, 'pending')
          )
        );

      // Delete any advance invoices tied to these expired transactions
      await tx.delete(invoices)
        .where(
          and(
            inArray(invoices.transactionId, txIds),
            eq(invoices.status, 'pending_advance')
          )
        );

      // Mark transactions as expired
      await tx.update(transactions)
        .set({ slipStatus: 'expired' })
        .where(inArray(transactions.id, txIds));
      }

    return NextResponse.json({ success: true, count: txIds.length, message: `Expired ${txIds.length} transactions.` });

  } catch (error) {
    console.error("Cleanup Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
