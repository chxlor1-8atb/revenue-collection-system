import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, inArray, isNull, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch verified transactions that haven't been reconciled yet
    const unreconciledTx = await db.select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      slipImageUrl: transactions.slipImageUrl,
      slipRefId: transactions.slipRefId,
      verifiedBy: transactions.verifiedBy,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.slipStatus, 'verified'),
        isNull(transactions.reconciledAt)
      )
    )
    .orderBy(desc(transactions.paidAt));

    if (unreconciledTx.length === 0) return NextResponse.json({ data: [] });

    const txIds = unreconciledTx.map(t => t.id);
    const relatedInvoices = await db.select({
      transactionId: invoices.transactionId,
      houseNumber: houses.houseNumber,
    })
    .from(invoices)
    .innerJoin(houses, eq(houses.id, invoices.houseId))
    .where(inArray(invoices.transactionId, txIds));

    const result = unreconciledTx.map(tx => {
      const invs = relatedInvoices.filter(i => i.transactionId === tx.id);
      // Get unique house numbers
      const houses = [...new Set(invs.map(i => i.houseNumber))].join(", ");
      return { ...tx, houses };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET Reconcile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { transactionIds } = await request.json();

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await db.update(transactions)
      .set({ reconciledAt: new Date() })
      .where(inArray(transactions.id, transactionIds));

    return NextResponse.json({ success: true, count: transactionIds.length });
  } catch (error) {
    console.error("POST Reconcile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
