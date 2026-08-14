"use server";

import { db } from "@/lib/db";
import { lineMessages, houses, invoices, transactions } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function searchHouseByNumber(houseNumber: string) {
  const result = await db.select().from(houses).where(eq(houses.houseNumber, houseNumber));
  if (result.length === 0) return null;
  return result[0];
}

export async function getUnpaidInvoicesForHouse(houseId: number) {
  return await db.select().from(invoices).where(and(eq(invoices.houseId, houseId), eq(invoices.status, "unpaid")));
}

export async function approveLineSlip(
  lineMessageId: number, 
  houseId: number, 
  invoiceIds: number[], 
  amount: number,
  imageUrl: string
) {
  try {
    const newTx = await db.insert(transactions).values({
      amount: amount.toString(),
      amountClaimedByPayer: amount.toString(),
      slipImageUrl: imageUrl,
      slipStatus: "verified",
      paidAt: new Date(),
      verifiedBy: "admin", 
    }).returning();

    const transactionId = newTx[0].id;

    if (invoiceIds.length > 0) {
      await db.update(invoices)
        .set({ status: "paid", transactionId })
        .where(inArray(invoices.id, invoiceIds));
    }

    await db.update(lineMessages)
      .set({ status: "processed", transactionId })
      .where(eq(lineMessages.id, lineMessageId));

    revalidatePath("/dashboard/line-slips");
    revalidatePath("/dashboard/history");
    return { success: true };
  } catch (error: any) {
    console.error("Approve Line Slip Error:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectLineSlip(lineMessageId: number) {
  try {
    await db.update(lineMessages)
      .set({ status: "rejected" })
      .where(eq(lineMessages.id, lineMessageId));
      
    revalidatePath("/dashboard/line-slips");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
