import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

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
        verifiedBy: session.user?.name || "admin"
      })
      .where(eq(transactions.id, transactionId));

    // 2. Update Related Invoices Status
    // If slip is verified -> 'paid'. If rejected -> 'unpaid' (and clear transactionId so it can be paid again)
    if (status === 'verified') {
      await db.update(invoices)
        .set({ status: 'paid' })
        .where(eq(invoices.transactionId, transactionId));
    } else {
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
