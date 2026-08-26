import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Pending slips from lineMessages (waiting for house match or admin review)
    const pendingSlips = await db.select()
      .from(lineMessages)
      .where(and(eq(lineMessages.type, 'image'), eq(lineMessages.status, 'pending')))
      .orderBy(desc(lineMessages.createdAt))
      .limit(10);

    // 2. Pending transactions from transactions table
    const pendingTxs = await db.select()
      .from(transactions)
      .where(eq(transactions.slipStatus, 'pending'))
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    // 3. Recent 5 verified transactions
    const recentVerified = await db.select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      receiptCode: transactions.receiptCode,
      slipImageUrl: transactions.slipImageUrl,
    })
    .from(transactions)
    .where(eq(transactions.slipStatus, 'verified'))
    .orderBy(desc(transactions.paidAt))
    .limit(5);

    // Find house numbers for recent verified
    let verifiedWithHouses = recentVerified as any[];
    if (recentVerified.length > 0) {
      const vIds = recentVerified.map(t => t.id);
      const linkedInvs = await db.select({
        transactionId: invoices.transactionId,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, vIds));

      verifiedWithHouses = recentVerified.map(tx => {
        const inv = linkedInvs.find(i => i.transactionId === tx.id);
        return {
          ...tx,
          houseNumber: inv?.houseNumber || "ไม่ระบุ",
          ownerName: inv?.ownerName || "-",
        };
      });
    }

    const totalPendingCount = pendingSlips.length + pendingTxs.length;

    return NextResponse.json({
      unreadCount: totalPendingCount,
      pendingSlips,
      pendingTxs,
      recentVerified: verifiedWithHouses,
    });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ unreadCount: 0, pendingSlips: [], pendingTxs: [], recentVerified: [] });
  }
}
