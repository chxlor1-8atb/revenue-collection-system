"use server";
import { encodeSecureId } from "@/lib/secureId";

import { db } from "@/lib/db";
import { lineMessages, houses, invoices, transactions } from "@/lib/schema";
import { eq, and, inArray, ilike, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { pushMessage, generateReceiptFlexMessage } from "@/lib/line";

export async function searchHouseByNumber(houseNumber: string) {
  const result = await db.select().from(houses).where(eq(houses.houseNumber, houseNumber.trim()));
  if (result.length === 0) return null;
  return result[0];
}

export async function getUnpaidInvoicesForHouse(houseId: number) {
  return await db.select().from(invoices).where(and(eq(invoices.houseId, houseId), eq(invoices.status, "unpaid")));
}

// Find smart auto-match suggestions for a slip
export async function getSmartSuggestion(slip: {
  lineUserId?: string;
  senderName?: string;
  houseNumber?: string;
  amount?: string;
}) {
  try {
    let matchedHouse: any = null;
    let matchReason: string = "";

    // 1. Direct houseNumber match if provided in slip
    if (slip.houseNumber && slip.houseNumber.trim() !== "") {
      const houseByNum = await searchHouseByNumber(slip.houseNumber);
      if (houseByNum) {
        matchedHouse = houseByNum;
        matchReason = "ตรงกับบ้านเลขที่ที่ระบุในแชท";
      }
    }

    // 2. Direct LINE User ID link on house
    if (!matchedHouse && slip.lineUserId) {
      const houseByUser = await db
        .select()
        .from(houses)
        .where(eq(houses.lineUserId, slip.lineUserId))
        .limit(1);
      if (houseByUser.length > 0) {
        matchedHouse = houseByUser[0];
        matchReason = "บัญชี LINE เคยผูกไว้กับบ้านหลังนี้";
      }
    }

    // 3. Historical LINE User ID match from previous processed slips
    if (!matchedHouse && slip.lineUserId) {
      const prevSlip = await db
        .select()
        .from(lineMessages)
        .where(
          and(
            eq(lineMessages.lineUserId, slip.lineUserId),
            eq(lineMessages.status, "processed")
          )
        )
        .orderBy(desc(lineMessages.createdAt))
        .limit(1);

      if (prevSlip.length > 0 && prevSlip[0].houseNumber) {
        const houseByHistory = await searchHouseByNumber(prevSlip[0].houseNumber);
        if (houseByHistory) {
          matchedHouse = houseByHistory;
          matchReason = "เคยชำระเงินให้บ้านหลังนี้ในอดีต";
        }
      }
    }

    // 4. Sender name fuzzy match
    if (!matchedHouse && slip.senderName && slip.senderName.trim().length > 3) {
      const cleanName = slip.senderName.replace(/(นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.|คุณ|น\.ส\.)/g, "").trim();
      if (cleanName.length >= 2) {
        const housesByName = await db
          .select()
          .from(houses)
          .where(ilike(houses.ownerName, `%${cleanName}%`))
          .limit(1);
        if (housesByName.length > 0) {
          matchedHouse = housesByName[0];
          matchReason = `ชื่อตรงกับเจ้าบ้าน: ${matchedHouse.ownerName}`;
        }
      }
    }

    return { matchedHouse, matchReason };
  } catch (error) {
    console.error("Smart suggestion error:", error);
    return { matchedHouse: null, matchReason: "" };
  }
}

import { generateNextReceiptSeries } from "@/lib/receiptSeries";
import { recordAuditLog } from "@/lib/audit";

// Approve slip with support for multiple advance months and LINE notification
export async function approveLineSlip(
  lineMessageId: number, 
  houseId: number, 
  invoiceIds: number[], 
  amount: number,
  imageUrl: string,
  advanceMonthsCount: number = 0,
  lineUserId?: string
) {
  try {
    const series = await generateNextReceiptSeries(new Date());

    // 1. Create transaction record
    const newTx = await db.insert(transactions).values({
      amount: amount.toString(),
      amountClaimedByPayer: amount.toString(),
      slipImageUrl: imageUrl,
      slipStatus: "verified",
      paidAt: new Date(),
      verifiedBy: "admin_manual", 
      bookNumber: series.bookNumber,
      receiptNumber: series.receiptNumber,
      fiscalYear: series.fiscalYear,
      receiptCode: series.receiptCode
    }).returning();

    const transactionId = newTx[0].id;

    // 2. Mark existing unpaid invoices as paid
    if (invoiceIds.length > 0) {
      await db.update(invoices)
        .set({ status: "paid", transactionId })
        .where(inArray(invoices.id, invoiceIds));
    }

    // 3. If advance months are requested, generate upcoming invoices and mark as paid
    const targetHouse = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
    const house = targetHouse[0];
    const defaultAmount = parseFloat(house?.defaultBillingAmount || "20");

    if (advanceMonthsCount > 0 && house) {
      const now = new Date();
      for (let i = 1; i <= advanceMonthsCount; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthYearStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
        
        await db.insert(invoices).values({
          houseId: house.id,
          monthYear: monthYearStr,
          amount: defaultAmount.toFixed(2),
          type: "monthly",
          title: `ค่าธรรมเนียมเก็บขยะประจำเดือน ${monthYearStr} (ชำระล่วงหน้า)`,
          status: "paid",
          transactionId: transactionId,
        });
      }
    }

    // 4. Update lineMessage status
    await db.update(lineMessages)
      .set({ 
        status: "processed", 
        transactionId,
        houseNumber: house?.houseNumber || undefined
      })
      .where(eq(lineMessages.id, lineMessageId));

    // 5. Send LINE push notification to citizen if lineUserId is available
    if (lineUserId && lineUserId.startsWith("U")) {
      try {
        const appUrl = process.env.NEXTAUTH_URL || "https://revenue.local";
        const receiptUrl = `${appUrl}/house/${encodeSecureId(houseId)}`;
        const flexMsg = generateReceiptFlexMessage(
          house?.houseNumber || "-",
          new Date().toLocaleDateString("th-TH", { month: "short", year: "numeric" }),
          amount,
          receiptUrl,
          new Date(),
          imageUrl
        );
        await pushMessage(lineUserId, [
          {
            type: "text",
            text: `✅ ตรวจสอบสลิปเรียบร้อยแล้ว!\nบ้านเลขที่ ${house?.houseNumber || "-"}\nยอดเงิน ฿${amount.toFixed(2)} บาท ได้รับการบันทึกชำระเงินเข้าสู่ระบบแล้วค่ะ`
          },
          flexMsg
        ]);
      } catch (pushErr) {
        console.error("Failed to push LINE confirmation:", pushErr);
      }
    }

    await recordAuditLog({
      action: "APPROVE",
      entityType: "TRANSACTION",
      entityId: transactionId,
      details: { houseNumber: house?.houseNumber, amount, receiptCode: series.receiptCode, lineMessageId }
    });

    revalidatePath("/dashboard/line-slips");
    revalidatePath("/dashboard/history");
    revalidatePath("/dashboard/houses");
    return { success: true, transactionId };
  } catch (error: any) {
    console.error("Approve Line Slip Error:", error);
    return { success: false, error: error.message };
  }
}

// Batch approve multiple slips in one click
export async function batchApproveSlips(
  approvals: Array<{
    lineMessageId: number;
    houseId: number;
    invoiceIds: number[];
    amount: number;
    imageUrl: string;
    lineUserId?: string;
  }>
) {
  let successCount = 0;
  const errors: string[] = [];

  for (const item of approvals) {
    const res = await approveLineSlip(
      item.lineMessageId,
      item.houseId,
      item.invoiceIds,
      item.amount,
      item.imageUrl,
      0,
      item.lineUserId
    );
    if (res.success) {
      successCount++;
    } else {
      errors.push(`สลิป #${item.lineMessageId}: ${res.error}`);
    }
  }

  revalidatePath("/dashboard/line-slips");
  return { success: true, successCount, errors };
}

// Reject slip with reason and send helpful explanation to LINE user
export async function rejectLineSlip(
  lineMessageId: number, 
  reason: string = "สลิปไม่ถูกต้องหรือไม่ชัดเจน",
  lineUserId?: string
) {
  try {
    await db.update(lineMessages)
      .set({ status: "rejected" })
      .where(eq(lineMessages.id, lineMessageId));
      
    await recordAuditLog({
      action: "REJECT",
      entityType: "TRANSACTION",
      entityId: lineMessageId,
      details: { lineMessageId, reason, lineUserId }
    });

    // Send polite LINE notification to citizen
    if (lineUserId && lineUserId.startsWith("U")) {
      try {
        await pushMessage(lineUserId, [
          {
            type: "text",
            text: `⚠️ แจ้งเตือนสลิปการโอนเงิน:\nเจ้าหน้าที่ได้ตรวจสอบสลิปของท่านแล้วไม่สามารถอนุมัติได้เนื่องจาก:\n"${reason}"\n\nรบกวนท่านตรวจสอบและส่งรูปสลิปใหม่อีกครั้ง หรือพิมพ์ติดต่อเจ้าหน้าที่ได้เลยค่ะ ขอบคุณค่ะ`
          }
        ]);
      } catch (pushErr) {
        console.error("Failed to push LINE rejection:", pushErr);
      }
    }

    revalidatePath("/dashboard/line-slips");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Restore a rejected slip back to pending
export async function restoreRejectedSlip(lineMessageId: number) {
  try {
    await db.update(lineMessages)
      .set({ status: "pending" })
      .where(eq(lineMessages.id, lineMessageId));
      
    revalidatePath("/dashboard/line-slips");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
