import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { pushMessage, generateBillFlexMessage } from "@/lib/line";
import generatePayload from "promptpay-qr";
import { recordAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatThaiMonthYear(monthYear: string) {
  const thaiMonths = [
    "", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const parts = monthYear.split("-");
  if (parts.length !== 2) return monthYear;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return monthYear;
  return `${thaiMonths[month]} ${year + 543}`;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { zone, minMonths = 1, customNote } = body;

    // 1. Fetch all houses with unpaid invoices
    const allUnpaidInvoices = await db
      .select({
        invoiceId: invoices.id,
        houseId: invoices.houseId,
        monthYear: invoices.monthYear,
        amount: invoices.amount,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
        zone: houses.zone,
        lineUserId: houses.lineUserId,
      })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(eq(invoices.status, "unpaid"));

    // Group by house
    const houseMap = new Map<number, {
      houseId: number;
      houseNumber: string;
      ownerName: string;
      zone: string | null;
      lineUserId: string | null;
      invoices: Array<{ id: number; monthYear: string; amount: string }>;
      totalDebt: number;
    }>();

    for (const inv of allUnpaidInvoices) {
      if (zone && zone !== "ALL" && inv.zone !== zone) continue;

      if (!houseMap.has(inv.houseId)) {
        houseMap.set(inv.houseId, {
          houseId: inv.houseId,
          houseNumber: inv.houseNumber,
          ownerName: inv.ownerName,
          zone: inv.zone,
          lineUserId: inv.lineUserId,
          invoices: [],
          totalDebt: 0,
        });
      }

      const h = houseMap.get(inv.houseId)!;
      h.invoices.push({ id: inv.invoiceId, monthYear: inv.monthYear, amount: inv.amount });
      h.totalDebt += parseFloat(inv.amount);
    }

    // Filter by minMonths
    const candidateHouses = Array.from(houseMap.values()).filter(h => h.invoices.length >= minMonths);

    const targetWithLine = candidateHouses.filter(h => h.lineUserId && h.lineUserId.startsWith("U"));
    const skippedNoLineCount = candidateHouses.length - targetWithLine.length;

    let successCount = 0;
    let failedCount = 0;
    const origin = process.env.NEXTAUTH_URL || "https://revenue.local";
    const mobileNumber = process.env.PROMPTPAY_MOBILE || "0000000000";

    // Batch send with 80ms delay between messages to respect LINE rate limits
    for (const house of targetWithLine) {
      try {
        const monthLabels = house.invoices.map(i => formatThaiMonthYear(i.monthYear));
        const combinedPeriod = monthLabels.length > 2 
          ? `${monthLabels[0]} - ${monthLabels[monthLabels.length - 1]} (${monthLabels.length} เดือน)`
          : monthLabels.join(", ");

        const qrUrl = `${origin}/api/qr-image?amount=${house.totalDebt}&ext=.png`;
        const payUrl = `${origin}/house/${house.houseId}`;

        const flexMsg = generateBillFlexMessage(
          house.houseNumber,
          combinedPeriod,
          house.totalDebt,
          payUrl,
          qrUrl
        );

        const customMessageHeader = customNote?.trim() 
          ? `📢 ประกาศแจ้งเตือนจากเทศบาลเมืองนางรอง:\n"${customNote.trim()}"\n\n` 
          : `สวัสดีค่ะ 💚 แจ้งเตือนยอดค้างชำระค่าธรรมเนียมเก็บขนมูลฝอย บ้านเลขที่ ${house.houseNumber} ค่ะ\n\n`;

        const sent = await pushMessage(house.lineUserId!, [
          {
            type: "text",
            text: `${customMessageHeader}ยอดค้างชำระรวม ฿${house.totalDebt.toFixed(2)} บาท (${combinedPeriod})\nสามารถตรวจสอบรายการและสแกนจ่ายได้ด้านล่างนี้นะคะ 🙏`
          },
          flexMsg
        ]);

        if (sent) {
          successCount++;
          // Mark invoices as broadcasted
          const invIds = house.invoices.map(i => i.id);
          await db.update(invoices).set({ isBroadcasted: true }).where(inArray(invoices.id, invIds));
        } else {
          failedCount++;
        }

        // Brief delay between pushes
        await new Promise(r => setTimeout(r, 60));
      } catch (err) {
        console.error(`Broadcast failed for house ${house.houseNumber}:`, err);
        failedCount++;
      }
    }

    await recordAuditLog({
      action: "BROADCAST",
      entityType: "BROADCAST",
      details: {
        zone: zone || "ALL",
        minMonths,
        totalCandidates: candidateHouses.length,
        targetWithLine: targetWithLine.length,
        successCount,
        failedCount,
        skippedNoLineCount,
      }
    });

    return NextResponse.json({
      success: true,
      totalCandidates: candidateHouses.length,
      targetWithLine: targetWithLine.length,
      successCount,
      failedCount,
      skippedNoLineCount,
    });
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
