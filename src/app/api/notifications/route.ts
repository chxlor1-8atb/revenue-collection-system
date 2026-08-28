import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { eq, desc, and, inArray, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Pending slips from lineMessages (LINE webhook images pending review)
    const lineSlipsRaw = await db.select()
      .from(lineMessages)
      .where(and(eq(lineMessages.type, 'image'), eq(lineMessages.status, 'pending')))
      .orderBy(desc(lineMessages.createdAt))
      .limit(10);

    const pendingLineSlips = lineSlipsRaw.map(msg => ({
      id: msg.id,
      source: "line" as const,
      status: "pending_review",
      title: "สลิปใหม่จาก LINE",
      lineUserId: msg.lineUserId,
      amount: msg.amount,
      senderName: msg.senderName,
      houseNumber: msg.houseNumber,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt ? msg.createdAt.toISOString() : new Date().toISOString(),
    }));

    // 2. Pending review transactions (uploaded slip, waiting admin approval)
    const pendingTxsRaw = await db.select()
      .from(transactions)
      .where(eq(transactions.slipStatus, 'pending'))
      .orderBy(desc(transactions.createdAt))
      .limit(15);

    let pendingTxsWithHouses: any[] = [];
    if (pendingTxsRaw.length > 0) {
      const pIds = pendingTxsRaw.map(t => t.id);
      const linkedInvs = await db.select({
        transactionId: invoices.transactionId,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
        monthYear: invoices.monthYear,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, pIds));

      pendingTxsWithHouses = pendingTxsRaw.map(tx => {
        const invs = linkedInvs.filter(i => i.transactionId === tx.id);
        const houseNum = invs[0]?.houseNumber || "ไม่ระบุ";
        const owner = invs[0]?.ownerName || "ไม่ระบุชื่อ";
        const months = invs.map(i => i.monthYear);

        return {
          id: tx.id,
          source: tx.verifiedBy === "line_bot" ? "line" : "web",
          status: "pending_review",
          title: "สลิปใหม่รอตรวจสอบ",
          amount: tx.amount,
          senderName: owner,
          houseNumber: houseNum,
          imageUrl: tx.slipImageUrl,
          months,
          createdAt: tx.createdAt ? tx.createdAt.toISOString() : new Date().toISOString(),
        };
      });
    }

    // 3. Active QR scanning sessions (waiting_for_slip within last 15 minutes)
    const activeQrWindow = new Date();
    activeQrWindow.setMinutes(activeQrWindow.getMinutes() - 15);

    const waitingTxsRaw = await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          gte(transactions.createdAt, activeQrWindow)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(10);

    let waitingTxsWithHouses: any[] = [];
    if (waitingTxsRaw.length > 0) {
      const wIds = waitingTxsRaw.map(t => t.id);
      const linkedInvs = await db.select({
        transactionId: invoices.transactionId,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
        monthYear: invoices.monthYear,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, wIds));

      waitingTxsWithHouses = waitingTxsRaw.map(tx => {
        const invs = linkedInvs.filter(i => i.transactionId === tx.id);
        const houseNum = invs[0]?.houseNumber || "ไม่ระบุ";
        const owner = invs[0]?.ownerName || "ไม่ระบุชื่อ";
        const months = invs.map(i => i.monthYear);

        return {
          id: tx.id,
          source: "qr_intent",
          status: "waiting_qr",
          title: "กำลังสแกนจ่าย QR Code",
          amount: tx.amount,
          senderName: owner,
          houseNumber: houseNum,
          imageUrl: null,
          months,
          createdAt: tx.createdAt ? tx.createdAt.toISOString() : new Date().toISOString(),
        };
      });
    }

    // 4. Recent 5 verified transactions
    const recentVerifiedRaw = await db.select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      receiptCode: transactions.receiptCode,
      slipImageUrl: transactions.slipImageUrl,
    })
    .from(transactions)
    .where(eq(transactions.slipStatus, 'verified'))
    .orderBy(desc(transactions.paidAt), desc(transactions.createdAt))
    .limit(5);

    let recentVerified: any[] = [];
    if (recentVerifiedRaw.length > 0) {
      const vIds = recentVerifiedRaw.map(t => t.id);
      const linkedInvs = await db.select({
        transactionId: invoices.transactionId,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, vIds));

      recentVerified = recentVerifiedRaw.map(tx => {
        const inv = linkedInvs.find(i => i.transactionId === tx.id);
        return {
          id: tx.id,
          amount: tx.amount,
          paidAt: tx.paidAt ? tx.paidAt.toISOString() : (tx.createdAt ? tx.createdAt.toISOString() : new Date().toISOString()),
          receiptCode: tx.receiptCode,
          slipImageUrl: tx.slipImageUrl,
          houseNumber: inv?.houseNumber || "ไม่ระบุ",
          ownerName: inv?.ownerName || "-",
        };
      });
    }

    // Combine all action-required items
    const allPendingItems = [
      ...pendingTxsWithHouses,
      ...pendingLineSlips,
      ...waitingTxsWithHouses,
    ];

    const pendingReviewCount = pendingTxsWithHouses.length + pendingLineSlips.length;
    const waitingQrCount = waitingTxsWithHouses.length;
    const unreadCount = allPendingItems.length;

    return NextResponse.json({
      unreadCount,
      pendingReviewCount,
      waitingQrCount,
      pendingItems: allPendingItems,
      recentVerified,
    });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json({ unreadCount: 0, pendingItems: [], recentVerified: [] });
  }
}
