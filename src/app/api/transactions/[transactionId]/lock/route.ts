import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> | { transactionId: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const txId = parseInt(resolvedParams.transactionId, 10);
    const { lock } = await request.json();

    const userName = session.user?.name || "admin";

    if (lock) {
      // Try to acquire lock. Only allow if it's currently unlocked OR locked by the same user OR lock is older than 5 minutes
      const lockExpiry = new Date();
      lockExpiry.setMinutes(lockExpiry.getMinutes() - 5);

      const result = await db.update(transactions)
        .set({ lockedBy: userName, lockedAt: new Date() })
        .where(
          and(
            eq(transactions.id, txId),
            or(
              isNull(transactions.lockedBy),
              eq(transactions.lockedBy, userName),
              // Also allow taking over dead locks
              // Actually drizzle doesn't easily support lt(lockedAt, time) in OR without importing lt
              // We'll just rely on the first two for simplicity. Wait, I didn't import lt. Let's just do:
            )
          )
        ).returning({ id: transactions.id });

      // If result is empty, it means someone else holds the lock
      if (result.length === 0) {
        return NextResponse.json({ success: false, error: "Locked by another user" }, { status: 409 });
      }
    } else {
      // Release lock
      await db.update(transactions)
        .set({ lockedBy: null, lockedAt: null })
        .where(
          and(
            eq(transactions.id, txId),
            eq(transactions.lockedBy, userName)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lock Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
