import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, inArray, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { pushMessage, generateSlipApprovedFlexMessage } from "@/lib/line";
import { generateNextReceiptSeries } from "@/lib/receiptSeries";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { transactionIds, status } = await request.json();
    if (!Array.isArray(transactionIds) || transactionIds.length === 0 || status !== 'verified') {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const currentTxs = await db.select({
      id: transactions.id,
      slipStatus: transactions.slipStatus,
      amountClaimedByPayer: transactions.amountClaimedByPayer,
      amount: transactions.amount,
    }).from(transactions).where(inArray(transactions.id, transactionIds));

    const validTxs = currentTxs.filter(tx => tx.slipStatus === 'pending');
    if (validTxs.length === 0) return NextResponse.json({ success: true, count: 0 });

    const validTxIds = validTxs.map(t => t.id);

    // Fetch related info for LINE messages and wallet
    const txDetails = await db.select({
      txId: transactions.id,
      amount: transactions.amountClaimedByPayer,
      houseNumber: houses.houseNumber,
      lineUserId: houses.lineUserId,
      houseId: houses.id,
    })
    .from(transactions)
    .innerJoin(invoices, eq(invoices.transactionId, transactions.id))
    .innerJoin(houses, eq(houses.id, invoices.houseId))
    .where(inArray(transactions.id, validTxIds));

    let processedCount = 0;

    await db.transaction(async (tx) => {
      for (const t of validTxs) {
        const series = await generateNextReceiptSeries(new Date());
        await tx.update(transactions)
          .set({
            slipStatus: 'verified',
            verifiedBy: session.user?.name || "admin",
            amount: t.amountClaimedByPayer,
            receiptCode: series.receiptCode,
            bookNumber: series.bookNumber,
            receiptNumber: series.receiptNumber,
            fiscalYear: series.fiscalYear,
            paidAt: new Date()
          })
          .where(eq(transactions.id, t.id));

        await tx.delete(invoices).where(and(eq(invoices.transactionId, t.id), eq(invoices.status, 'pending_advance')));
        await tx.update(invoices).set({ status: 'paid' }).where(eq(invoices.transactionId, t.id));
        processedCount++;
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://revenue-collection-system.vercel.app";
    
    // Clear caches
    try {
      const { redis } = await import("@/lib/redis");
      if (redis) await redis.del("admin_dashboard_stats");
    } catch(e) {}

    // Send Pusher events and LINE messages
    try {
      const { pusherServer } = await import("@/lib/pusher");
      if (pusherServer) {
        pusherServer.trigger('admin-notifications', 'dashboard-update', {}).catch(console.error);
      }
      
      for (const t of validTxs) {
        const info = txDetails.find(d => d.txId === t.id);
        if (pusherServer) {
          pusherServer.trigger(`transaction-${t.id}`, 'payment-verified', { status: 'verified' }).catch(console.error);
          if (info?.houseId) pusherServer.trigger(`house-${info.houseId}`, 'payment-verified', { status: 'verified' }).catch(console.error);
          pusherServer.trigger('admin-notifications', 'slip-processed', { transactionId: t.id, status: 'verified' }).catch(console.error);
        }

        if (info && info.lineUserId) {
          const receiptUrl = `${baseUrl}/api/transactions/${t.id}/receipt`;
          const msg = generateSlipApprovedFlexMessage(info.houseNumber, parseFloat(info.amount || "0"), receiptUrl);
          await pushMessage(info.lineUserId, [msg]).catch(console.error);
        }
      }
    } catch(e) {}

    return NextResponse.json({ success: true, count: processedCount });
  } catch (error) {
    console.error("Bulk Review Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
