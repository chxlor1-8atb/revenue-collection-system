import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { txId } = await params;
    const transactionId = parseInt(txId, 10);
    
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    // 1. Get the transaction
    const txList = await db.select().from(transactions).where(eq(transactions.id, transactionId));
    if (txList.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const tx = txList[0];
    
    // Only allow voiding if it's not already voided
    if (tx.slipStatus === "voided") {
      return NextResponse.json({ error: "Already voided" }, { status: 400 });
    }

    const voidReason = `ยกเลิกรายการโดยแอดมิน: ${session.user.name || session.user.email} (วันที่ ${new Date().toLocaleString('th-TH')})`;

    // 2. Void the transaction
    await db.update(transactions)
      .set({ 
        slipStatus: "voided",
        payerNote: tx.payerNote ? `${tx.payerNote} | ${voidReason}` : voidReason
      })
      .where(eq(transactions.id, transactionId));

    // 3. Revert invoices back to unpaid
    await db.update(invoices)
      .set({ status: "unpaid", transactionId: null })
      .where(eq(invoices.transactionId, transactionId));

    // 4. Record Audit Log
    await recordAuditLog({
      action: "VOID",
      entityType: "TRANSACTION",
      entityId: transactionId,
      details: {
        amount: tx.amount,
        receiptCode: tx.receiptCode,
        voidReason,
        voidedBy: session.user.name || session.user.email
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Void Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
