import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const transactionId = parseInt((await params).transactionId, 10);
  if (isNaN(transactionId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const result = await db.select({
    id: transactions.id,
    slipStatus: transactions.slipStatus,
    amount: transactions.amount,
    paidAt: transactions.paidAt,
  })
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ status: "not_found" });
  }

  return NextResponse.json(result[0]);
}
