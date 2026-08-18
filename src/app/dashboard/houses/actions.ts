"use server";

import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addHouse(formData: FormData) {
  const houseNumber = formData.get("houseNumber")?.toString();
  const ownerName = formData.get("ownerName")?.toString();
  const zone = formData.get("zone")?.toString() || null;
  const moo = formData.get("moo")?.toString() || null;
  const soi = formData.get("soi")?.toString() || null;
  const road = formData.get("road")?.toString() || null;
  const defaultBillingAmountRaw = formData.get("defaultBillingAmount")?.toString();
  const defaultBillingAmount = defaultBillingAmountRaw ? parseFloat(defaultBillingAmountRaw).toString() : null;
  const customFieldsRaw = formData.get("customFields")?.toString();

  let customFields = {};
  if (customFieldsRaw) {
    try {
      customFields = JSON.parse(customFieldsRaw);
    } catch (e) {
      console.error("Failed to parse customFields", e);
    }
  }

  if (!houseNumber || !ownerName) {
    return { success: false, error: "กรุณากรอกบ้านเลขที่และชื่อเจ้าบ้านให้ครบถ้วน" };
  }

  try {
    const [insertedHouse] = await db.insert(houses).values({
      houseNumber,
      ownerName,
      zone,
      moo,
      soi,
      road,
      defaultBillingAmount,
      customFields,
    }).returning({ id: houses.id });

    revalidatePath("/dashboard/houses");
    return { success: true, houseId: insertedHouse.id };
  } catch (error: any) {
    console.error("Error adding house:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}

export async function updateHouse(id: number, formData: FormData) {
  const houseNumber = formData.get("houseNumber")?.toString();
  const ownerName = formData.get("ownerName")?.toString();
  const zone = formData.get("zone")?.toString() || null;
  const moo = formData.get("moo")?.toString() || null;
  const soi = formData.get("soi")?.toString() || null;
  const road = formData.get("road")?.toString() || null;
  const defaultBillingAmountRaw = formData.get("defaultBillingAmount")?.toString();
  const defaultBillingAmount = defaultBillingAmountRaw ? parseFloat(defaultBillingAmountRaw).toString() : null;
  const customFieldsRaw = formData.get("customFields")?.toString();

  let customFields = {};
  if (customFieldsRaw) {
    try {
      customFields = JSON.parse(customFieldsRaw);
    } catch (e) {
      console.error("Failed to parse customFields", e);
    }
  }

  if (!houseNumber || !ownerName) {
    return { success: false, error: "กรุณากรอกบ้านเลขที่และชื่อเจ้าบ้านให้ครบถ้วน" };
  }

  try {
    await db.update(houses).set({
      houseNumber,
      ownerName,
      zone,
      moo,
      soi,
      road,
      defaultBillingAmount,
      customFields,
    }).where(eq(houses.id, id));

    revalidatePath("/dashboard/houses");
    return { success: true, houseId: id };
  } catch (error: any) {
    console.error("Error updating house:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
  }
}

export async function deleteHouse(id: number) {
  try {
    // Check if there are any invoices linked to this house
    const existingInvoices = await db.select().from(invoices).where(eq(invoices.houseId, id)).limit(1);
    
    if (existingInvoices.length > 0) {
      return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีบิลแจ้งหนี้ค้างอยู่ในระบบ กรุณาลบบิลที่เกี่ยวข้องก่อน" };
    }

    await db.delete(houses).where(eq(houses.id, id));

    revalidatePath("/dashboard/houses");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting house:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการลบข้อมูล" };
  }
}

export async function createInitialInvoice(houseId: number, monthYear: string, amount: string) {
  try {
    const existing = await db.select().from(invoices).where(
      and(eq(invoices.houseId, houseId), eq(invoices.monthYear, monthYear))
    ).limit(1);
    
    if (existing.length > 0) {
      return { success: false, error: "บิลสำหรับเดือนนี้ถูกสร้างไปแล้ว" };
    }
    
    await db.insert(invoices).values({
      houseId,
      monthYear,
      amount,
      status: 'unpaid'
    });

    revalidatePath(`/dashboard/houses/${houseId}`);
    revalidatePath(`/dashboard/houses`);
    return { success: true };
  } catch (error: any) {
    console.error("Error creating initial invoice:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้างบิล" };
  }
}
