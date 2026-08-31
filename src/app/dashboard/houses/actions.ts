"use server";
import { encodeSecureId } from "@/lib/secureId";

import { db } from "@/lib/db";
import { houses, invoices, transactions } from "@/lib/schema";
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
  const defaultBillingAmount = defaultBillingAmountRaw && defaultBillingAmountRaw.trim() !== "" && !isNaN(parseFloat(defaultBillingAmountRaw))
    ? parseFloat(defaultBillingAmountRaw).toFixed(2)
    : "20.00";
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

    await recordAuditLog({
      action: "CREATE",
      entityType: "HOUSE",
      entityId: insertedHouse.id,
      details: { houseNumber, ownerName, zone, road, defaultBillingAmount }
    });

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
  const defaultBillingAmount = defaultBillingAmountRaw && defaultBillingAmountRaw.trim() !== "" && !isNaN(parseFloat(defaultBillingAmountRaw))
    ? parseFloat(defaultBillingAmountRaw).toFixed(2)
    : "20.00";
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

    await recordAuditLog({
      action: "UPDATE",
      entityType: "HOUSE",
      entityId: id,
      details: { houseNumber, ownerName, zone, road, defaultBillingAmount }
    });

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

    const houseList = await db.select().from(houses).where(eq(houses.id, id)).limit(1);

    await db.delete(houses).where(eq(houses.id, id));

    await recordAuditLog({
      action: "DELETE",
      entityType: "HOUSE",
      entityId: id,
      details: { houseNumber: houseList[0]?.houseNumber, ownerName: houseList[0]?.ownerName }
    });

    revalidatePath("/dashboard/houses");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting house:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการลบข้อมูล" };
  }
}

export async function createInitialInvoice(houseId: number, monthYear: string, amount: string, type: string = 'monthly', title: string | null = null) {
  try {
    if (type === 'monthly') {
      const existing = await db.select().from(invoices).where(
        and(eq(invoices.houseId, houseId), eq(invoices.monthYear, monthYear), eq(invoices.type, 'monthly'))
      ).limit(1);
      
      if (existing.length > 0) {
        return { success: false, error: "บิลประจำเดือนนี้ถูกสร้างไปแล้ว" };
      }
    }
    
    const [newInv] = await db.insert(invoices).values({
      houseId,
      monthYear,
      amount,
      type,
      title,
      status: 'unpaid'
    }).returning({ id: invoices.id });

    await recordAuditLog({
      action: "CREATE",
      entityType: "INVOICE",
      entityId: newInv.id,
      details: { houseId, monthYear, amount, type, title }
    });

    revalidatePath(`/dashboard/houses/${houseId}`);
    revalidatePath(`/dashboard/houses`);
    return { success: true };
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้างบิล" };
  }
}


const generatePayload = require("promptpay-qr");
import { generateBillFlexMessage, pushMessage } from "@/lib/line";

function formatThaiMonthYear(monthYear: string) {
  const thaiMonths = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", 
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", 
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const parts = monthYear.split("-");
  if (parts.length !== 2) return monthYear;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return monthYear;
  return `${thaiMonths[month]} ${year + 543}`;
}


export async function sendLineReminder(houseId: number, origin: string) {
  try {
    const houseList = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
    if (houseList.length === 0) return { success: false, error: "ไม่พบข้อมูลบ้าน" };
    
    const house = houseList[0];
    if (!house.lineUserId) return { success: false, error: "บ้านนี้ยังไม่ได้ผูกบัญชี LINE" };

    const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, houseId), eq(invoices.status, 'unpaid'))).orderBy(invoices.monthYear);
    if (unpaidInvoices.length === 0) return { success: false, error: "ไม่มีบิลค้างชำระ" };

    const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    
    const monthYears = unpaidInvoices.map(inv => formatThaiMonthYear(inv.monthYear));
    const combinedMonthYearStr = monthYears.length > 2 
      ? `${monthYears[0]} - ${monthYears[monthYears.length - 1]}` 
      : monthYears.join(", ");

    const mobileNumber = process.env.PROMPTPAY_MOBILE || "0000000000";
    const payload = generatePayload(mobileNumber, { amount: totalDebt });
    const qrUrl = `${origin}/api/qr-image?amount=${totalDebt}&ext=.png`;
    const payUrl = `${origin}/house/${encodeSecureId(houseId)}`;

    const flexMsg = generateBillFlexMessage(
      house.houseNumber,
      combinedMonthYearStr,
      totalDebt,
      payUrl,
      qrUrl
    );

    const pushed = await pushMessage(house.lineUserId, [
      {
        type: "text",
        text: `สวัสดีค่ะ 💚 แจ้งเตือนยอดค้างชำระค่าธรรมเนียมเก็บขนมูลฝอย บ้านเลขที่ ${house.houseNumber} ค่ะ\n\nสามารถตรวจสอบรายละเอียดและชำระเงินได้ที่ลิงก์ด้านล่างนี้นะคะ 🙏`
      },
      flexMsg
    ]);

    if (!pushed) return { success: false, error: "ส่ง LINE ไม่สำเร็จ ตรวจสอบการตั้งค่า Messaging API" };

    return { success: true };
  } catch (error: any) {
    console.error("Error sending LINE reminder:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการส่งข้อความ" };
  }
}

import { generateNextReceiptSeries } from "@/lib/receiptSeries";
import { recordAuditLog } from "@/lib/audit";

export async function markInvoiceAsPaidCash(invoiceId: number) {
  try {
    const invData = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (invData.length === 0) return { success: false, error: "ไม่พบบิลนี้" };
    
    const inv = invData[0];
    if (inv.status === 'paid') return { success: false, error: "บิลนี้ชำระแล้ว" };

    const houseData = await db.select().from(houses).where(eq(houses.id, inv.houseId)).limit(1);
    if (houseData.length === 0) return { success: false, error: "ไม่พบบ้าน" };

    const series = await generateNextReceiptSeries(new Date());

    // Create a transaction for cash
    const tx = await db.insert(transactions).values({
      amount: inv.amount,
      slipStatus: 'verified',
      slipImageUrl: 'cash',
      paidAt: new Date(),
      verifiedBy: 'admin_cash',
      payerNote: 'รับชำระเงินสด',
      bookNumber: series.bookNumber,
      receiptNumber: series.receiptNumber,
      fiscalYear: series.fiscalYear,
      receiptCode: series.receiptCode
    }).returning({ id: transactions.id });

    // Update invoice
    await db.update(invoices).set({
      status: 'paid',
      transactionId: tx[0].id,
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId));

    await recordAuditLog({
      action: "APPROVE",
      entityType: "TRANSACTION",
      entityId: tx[0].id,
      details: { houseNumber: houseData[0].houseNumber, amount: inv.amount, method: "cash", receiptCode: series.receiptCode }
    });

    revalidatePath(`/dashboard/houses/${inv.houseId}`);
    revalidatePath(`/dashboard/houses`);
    revalidatePath(`/house/${encodeSecureId(inv.houseId)}`);

    return { success: true, transactionId: tx[0].id };
  } catch (error: any) {
    console.error("Failed to mark invoice as paid (cash):", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}

export async function markAllInvoicesAsPaidCash(houseId: number) {
  try {
    const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, houseId), eq(invoices.status, 'unpaid')));
    if (unpaidInvoices.length === 0) return { success: false, error: "ไม่มีบิลค้างชำระ" };
    
    const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    const houseData = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
    if (houseData.length === 0) return { success: false, error: "ไม่พบบ้าน" };

    const series = await generateNextReceiptSeries(new Date());

    // Create a transaction for cash
    const tx = await db.insert(transactions).values({
      amount: totalDebt.toString(),
      slipStatus: 'verified',
      slipImageUrl: 'cash',
      paidAt: new Date(),
      verifiedBy: 'admin_cash',
      payerNote: 'รับชำระเงินสด (ทั้งหมด)',
      bookNumber: series.bookNumber,
      receiptNumber: series.receiptNumber,
      fiscalYear: series.fiscalYear,
      receiptCode: series.receiptCode
    }).returning({ id: transactions.id });

    // Update invoices
    await db.update(invoices).set({
      status: 'paid',
      transactionId: tx[0].id,
      updatedAt: new Date(),
    }).where(and(eq(invoices.houseId, houseId), eq(invoices.status, 'unpaid')));

    await recordAuditLog({
      action: "APPROVE",
      entityType: "TRANSACTION",
      entityId: tx[0].id,
      details: { houseNumber: houseData[0].houseNumber, amount: totalDebt, method: "cash_all", receiptCode: series.receiptCode }
    });

    revalidatePath(`/dashboard/houses/${houseId}`);
    revalidatePath(`/dashboard/houses`);
    revalidatePath(`/house/${encodeSecureId(houseId)}`);

    return { success: true, transactionId: tx[0].id };
  } catch (error: any) {
    console.error("Failed to mark all invoices as paid (cash):", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาด" };
  }
}
