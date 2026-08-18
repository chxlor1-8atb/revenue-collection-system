import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, desc, inArray, or, and, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";

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
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, status } = await request.json();

    if (!transactionId || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // 1. Update Transaction Status
    await db.update(transactions)
      .set({ 
        slipStatus: status,
        verifiedBy: session.user?.name || "admin",
        lockKey: null
      })
      .where(eq(transactions.id, transactionId));

    // 2. Update Related Invoices Status
    // If slip is verified -> 'paid'. If rejected -> 'unpaid' (and clear transactionId so it can be paid again)
    if (status === 'verified') {
      await db.update(invoices)
        .set({ status: 'paid' })
        .where(eq(invoices.transactionId, transactionId));
    } else {
      // Delete any pending_advance invoices
      await db.delete(invoices)
        .where(
          and(
            eq(invoices.transactionId, transactionId),
            eq(invoices.status, 'pending_advance')
          )
        );

      // Unlink regular invoices
      await db.update(invoices)
        .set({ status: 'unpaid', transactionId: null })
        .where(eq(invoices.transactionId, transactionId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
