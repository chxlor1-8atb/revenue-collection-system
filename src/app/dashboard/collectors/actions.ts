"use server";

import { db } from "@/lib/db";
import { collectors, qrCodes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addCollector(formData: FormData) {
  const name = formData.get("name")?.toString();
  const promptPayId = formData.get("promptPayId")?.toString();
  const telegramChatId = formData.get("telegramChatId")?.toString() || null;

  if (!name || !promptPayId) {
    return { success: false, error: "กรุณากรอกชื่อและเบอร์พร้อมเพย์ให้ครบถ้วน" };
  }

  try {
    // 1. Insert collector
    const newCollector = await db.insert(collectors).values({
      name,
      promptPayId,
      telegramChatId,
      active: true,
    }).returning();

    // 2. We must also create a default qrCode entry for this collector so they can receive payments
    await db.insert(qrCodes).values({
      collectorId: newCollector[0].id,
      label: "QR หลัก",
      active: true,
    });

    revalidatePath("/dashboard/collectors");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding collector:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export async function updateCollector(id: number, formData: FormData) {
  const name = formData.get("name")?.toString();
  const promptPayId = formData.get("promptPayId")?.toString();
  const telegramChatId = formData.get("telegramChatId")?.toString() || null;

  if (!name || !promptPayId) {
    return { success: false, error: "กรุณากรอกชื่อและเบอร์พร้อมเพย์ให้ครบถ้วน" };
  }

  try {
    await db.update(collectors).set({
      name,
      promptPayId,
      telegramChatId,
    }).where(eq(collectors.id, id));

    revalidatePath("/dashboard/collectors");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating collector:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
  }
}

export async function toggleCollectorActive(id: number, active: boolean) {
  try {
    // Don't allow toggling if it's the last active collector? (Maybe later)
    await db.update(collectors).set({ active }).where(eq(collectors.id, id));
    
    // Also toggle their QR codes
    await db.update(qrCodes).set({ active }).where(eq(qrCodes.collectorId, id));

    revalidatePath("/dashboard/collectors");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling collector:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}
