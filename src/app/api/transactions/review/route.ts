import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushMessage, generateSlipApprovedFlexMessage, generateSlipRejectedFlexMessage } from "@/lib/line";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, desc, inArray, or, and, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generateNextReceiptSeries } from "@/lib/receiptSeries";
import { generateIdempotencyKey, acquireInFlightLock, releaseInFlightLock } from "@/lib/idempotency";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Fetch pending transactions (uploaded slip, waiting admin review)
    const pendingTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.slipStatus, 'pending'))
      .orderBy(desc(transactions.createdAt));

    let transactionsWithInvoices: any[] = [];
    if (pendingTransactions.length > 0) {
      const txIds = pendingTransactions.map(t => t.id);
      const relatedInvoices = await db.select({
        id: invoices.id,
        transactionId: invoices.transactionId,
        monthYear: invoices.monthYear,
        amount: invoices.amount,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, txIds));

      transactionsWithInvoices = pendingTransactions.map(tx => {
        const txInvoices = relatedInvoices.filter(inv => inv.transactionId === tx.id);
        return { ...tx, invoices: txInvoices };
      });
    }

    // 2. Fetch active waiting_for_slip transactions (QR generated within last 3 minutes)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 3);

    const waitingTransactions = await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          gte(transactions.createdAt, expiryTime)
        )
      )
      .orderBy(desc(transactions.createdAt));

    let waitingWithInvoices: any[] = [];
    if (waitingTransactions.length > 0) {
      const wtxIds = waitingTransactions.map(t => t.id);
      const relatedInvoices = await db.select({
        id: invoices.id,
        transactionId: invoices.transactionId,
        monthYear: invoices.monthYear,
        amount: invoices.amount,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, wtxIds));

      waitingWithInvoices = waitingTransactions.map(tx => {
        const txInvoices = relatedInvoices.filter(inv => inv.transactionId === tx.id);
        return { ...tx, invoices: txInvoices };
      });
    }

    return NextResponse.json({
      pending: transactionsWithInvoices,
      waiting: waitingWithInvoices
    });

  } catch (error) {
    console.error("GET Review Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let idempotencyKey: string | null = null;

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, status, rejectReason, verifiedAmount } = await request.json();

    if (!transactionId || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // 1. Concurrency control: prevent duplicate simultaneous reviews
    idempotencyKey = generateIdempotencyKey("review_tx", transactionId);
    const lockAcquired = await acquireInFlightLock(idempotencyKey, 8);
    if (!lockAcquired) {
      return NextResponse.json({ error: "รายการนี้กำลังถูกดำเนินการ กรุณารอสักครู่" }, { status: 429 });
    }

    // 2. Fetch current transaction state
    const currentTxList = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
    if (currentTxList.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const currentTx = currentTxList[0];
    if (currentTx.slipStatus === 'verified' && status === 'verified') {
      // Already verified idempotently
      return NextResponse.json({ success: true, message: "Already verified" });
    }

    // Fetch transaction and user details to send LINE message
    const txDetails = await db.select({
      amount: transactions.amountClaimedByPayer,
      houseNumber: houses.houseNumber,
      lineUserId: houses.lineUserId,
      houseId: houses.id,
    })
    .from(transactions)
    .innerJoin(invoices, eq(invoices.transactionId, transactions.id))
    .innerJoin(houses, eq(houses.id, invoices.houseId))
    .where(eq(transactions.id, transactionId))
    .limit(1);

    const txInfo = txDetails.length > 0 ? txDetails[0] : null;

    let seriesData: any = {};
    if (status === 'verified') {
      const series = await generateNextReceiptSeries(new Date());
      seriesData = {
        receiptCode: series.receiptCode,
        bookNumber: series.bookNumber,
        receiptNumber: series.receiptNumber,
        fiscalYear: series.fiscalYear,
        paidAt: new Date()
      };
    }

    // 3. Update Transaction and Invoices Status
    await db.transaction(async (tx) => {
      await tx.update(transactions)
        .set({ 
          slipStatus: status,
          verifiedBy: session.user?.name || "admin",
          rejectReason: status === 'rejected' ? rejectReason : null,
          amount: status === 'verified' && verifiedAmount ? verifiedAmount : undefined,
          amountClaimedByPayer: status === 'verified' && verifiedAmount ? verifiedAmount : undefined,
          lockKey: null,
          lockedBy: null,
          lockedAt: null,
          ...seriesData
        })
        .where(eq(transactions.id, transactionId));

      // Update Related Invoices Status and Wallet
      if (status === 'verified') {
        // 3.1 Unlink and delete advance invoices (if any)
        // Since admin might have changed the verified amount, we rely on the wallet instead of advance invoices for excess
        await tx.delete(invoices)
          .where(
            and(
              eq(invoices.transactionId, transactionId),
              eq(invoices.status, 'pending_advance')
            )
          );

        // 3.2 Mark regular invoices as paid
        await tx.update(invoices)
          .set({ status: 'paid' })
          .where(eq(invoices.transactionId, transactionId));

        // 3.3 Calculate overpayment and add to wallet
        if (txInfo && verifiedAmount) {
          const actualPaid = parseFloat(verifiedAmount);
          // Find total debt of the invoices just paid
          const paidInvoices = await tx.select({ amount: invoices.amount })
            .from(invoices)
            .where(
              and(
                eq(invoices.transactionId, transactionId),
                eq(invoices.status, 'paid')
              )
            );
          const totalDebt = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
          
          if (actualPaid > totalDebt) {
            const excess = actualPaid - totalDebt;
            const houseRecord = await tx.select({ walletBalance: houses.walletBalance })
              .from(houses)
              .where(eq(houses.id, txInfo.houseId))
              .limit(1);
            
            if (houseRecord.length > 0) {
              const currentWallet = parseFloat(houseRecord[0].walletBalance || "0");
              const newWallet = currentWallet + excess;
              
              await tx.update(houses)
                .set({ walletBalance: newWallet.toFixed(2) })
                .where(eq(houses.id, txInfo.houseId));
            }
          }
        }
          
        // Invalidate Redis Cache
        if (txInfo) {
          try {
            const { redis } = await import("@/lib/redis");
            if (redis) {
               await redis.del(`house_dashboard_data:${txInfo.houseId}`);
               await redis.del("admin_dashboard_stats");
            }
          } catch(e) { console.error("Cache clear error", e); }
        }
      } else {
        // Delete any pending_advance invoices
        await tx.delete(invoices)
          .where(
            and(
              eq(invoices.transactionId, transactionId),
              eq(invoices.status, 'pending_advance')
            )
          );

        // Unlink regular invoices
        await tx.update(invoices)
          .set({ status: 'unpaid', transactionId: null })
          .where(eq(invoices.transactionId, transactionId));
      }
    });

    // 4. Send LINE Push Notification if lineUserId exists
    if (txInfo && txInfo.lineUserId) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://revenue-collection-system.vercel.app";
      if (status === 'verified') {
        const receiptUrl = `${baseUrl}/api/transactions/${transactionId}/receipt`;
        const msg = generateSlipApprovedFlexMessage(txInfo.houseNumber, parseFloat(txInfo.amount || "0"), receiptUrl);
        await pushMessage(txInfo.lineUserId, [msg]);
      } else if (status === 'rejected') {
        const uploadUrl = `${baseUrl}/pay/${transactionId}`;
        const msg = generateSlipRejectedFlexMessage(txInfo.houseNumber, parseFloat(txInfo.amount || "0"), rejectReason || "ข้อมูลไม่ถูกต้อง", uploadUrl);
        await pushMessage(txInfo.lineUserId, [msg]);
      }
    }

    // 5. Send Pusher Events for Real-Time UI
    try {
      const { pusherServer } = await import("@/lib/pusher");
      if (pusherServer) {
        // Update Citizen Portal (CountdownTimer & PayPage) instantly
        pusherServer.trigger(`transaction-${transactionId}`, 'payment-verified', { status }).catch(console.error);
        
        // Notify all admins to remove this slip from their review queue (prevent double-work)
        pusherServer.trigger('admin-notifications', 'slip-processed', { transactionId, status }).catch(console.error);

        // Notify dashboard to refresh live stats (Revenue, counts, etc.)
        pusherServer.trigger('admin-notifications', 'dashboard-update', {}).catch(console.error);
      }
    } catch (e) {
      console.error("Pusher error in review route", e);
    }

    return NextResponse.json({ success: true, receiptCode: seriesData.receiptCode });
  } catch (error) {
    console.error("Review Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (idempotencyKey) {
      await releaseInFlightLock(idempotencyKey);
    }
  }
}
