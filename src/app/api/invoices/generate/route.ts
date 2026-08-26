import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses, invoices, systemSettings } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, inArray, and } from "drizzle-orm";
import { pushMessage, generateBillFlexMessage } from "@/lib/line";
import generatePayload from "promptpay-qr";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const generateSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Invalid format, expected YYYY-MM"),
  amount: z.union([z.string(), z.number()]).transform(v => v.toString()).refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Invalid amount").default("20.00"),
  zone: z.string().optional().default("ALL"),
  sendLineNotification: z.boolean().optional().default(false),
});

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

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = generateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    
    const { monthYear, amount, zone, sendLineNotification } = parseResult.data;

    // 1. Query target houses (All or specific zone)
    const targetHousesQuery = zone && zone !== "ALL"
      ? db.select().from(houses).where(eq(houses.zone, zone))
      : db.select().from(houses);

    const targetHouses = await targetHousesQuery;
    
    if (targetHouses.length === 0) {
      return NextResponse.json({ error: "ไม่พบบ้านในชุมชนที่เลือก" }, { status: 400 });
    }

    const houseIds = targetHouses.map(h => h.id);

    // 2. Check existing invoices for this month to calculate exact new vs skipped
    const existingInvoices = await db.select({
      houseId: invoices.houseId
    })
    .from(invoices)
    .where(and(
      inArray(invoices.houseId, houseIds),
      eq(invoices.monthYear, monthYear)
    ));

    const existingHouseIdSet = new Set(existingInvoices.map(inv => inv.houseId));
    const housesToGenerate = targetHouses.filter(h => !existingHouseIdSet.has(h.id));

    if (housesToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        monthYear,
        totalHouses: targetHouses.length,
        createdCount: 0,
        skippedCount: targetHouses.length,
        paidViaWalletCount: 0,
        totalBilledAmount: 0,
        lineNotifiedCount: 0,
        message: `บ้านทั้งหมด ${targetHouses.length} หลังมีบิลรอบเดือน ${formatThaiMonthYear(monthYear)} อยู่แล้ว`
      });
    }

    // 3. Prepare new invoices with custom rates and Wallet Auto-Deduction
    let totalBilledSum = 0;
    let paidViaWalletCount = 0;
    const newInvoicesToInsert: any[] = [];
    const walletDeductions: Array<{ houseId: number; newBalance: string }> = [];

    for (const house of housesToGenerate) {
      const billAmtStr = house.defaultBillingAmount ? house.defaultBillingAmount : amount;
      const billAmtNum = parseFloat(billAmtStr) || 20;
      totalBilledSum += billAmtNum;

      const walletBalNum = parseFloat(house.walletBalance || "0");
      
      // If house has sufficient prepaid wallet balance, auto-mark invoice as paid!
      if (walletBalNum >= billAmtNum) {
        newInvoicesToInsert.push({
          houseId: house.id,
          monthYear: monthYear,
          amount: billAmtStr,
          status: "paid"
        });
        const remaining = (walletBalNum - billAmtNum).toFixed(2);
        walletDeductions.push({ houseId: house.id, newBalance: remaining });
        paidViaWalletCount++;
      } else {
        newInvoicesToInsert.push({
          houseId: house.id,
          monthYear: monthYear,
          amount: billAmtStr,
          status: "unpaid"
        });
      }
    }

    // 4. Batch Insert invoices in chunks of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < newInvoicesToInsert.length; i += CHUNK_SIZE) {
      const chunk = newInvoicesToInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(invoices).values(chunk).onConflictDoNothing({
        target: [invoices.houseId, invoices.monthYear]
      });
    }

    // 5. Update wallet balances for prepaid houses
    for (const deduction of walletDeductions) {
      await db.update(houses)
        .set({ walletBalance: deduction.newBalance })
        .where(eq(houses.id, deduction.houseId));
    }

    // 6. Optional: Instant LINE Notification push
    let lineNotifiedCount = 0;
    if (sendLineNotification) {
      const [settings] = await db.select().from(systemSettings).limit(1);
      const promptPayId = settings?.promptPayId || "0986485736";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://revenue-collection-system.vercel.app";

      for (const house of housesToGenerate) {
        if (house.lineUserId) {
          try {
            const billAmt = parseFloat(house.defaultBillingAmount || amount);
            const qrPayload = generatePayload(promptPayId, { amount: billAmt });
            const qrUrl = `${baseUrl}/api/qr-image?amount=${billAmt}`;
            const uploadUrl = `${baseUrl}/pay/instant-${house.id}`;

            const flex = generateBillFlexMessage(
              house.houseNumber,
              formatThaiMonthYear(monthYear),
              billAmt,
              uploadUrl,
              qrUrl
            );

            await pushMessage(house.lineUserId, [flex]);
            lineNotifiedCount++;
          } catch (lineErr) {
            console.error(`Failed to push LINE bill to house ${house.houseNumber}:`, lineErr);
          }
        }
      }
    }

    // 7. Audit log
    await recordAuditLog({
      action: "CREATE",
      entityType: "INVOICE",
      details: {
        monthYear,
        zone,
        totalHouses: targetHouses.length,
        createdCount: housesToGenerate.length,
        skippedCount: existingInvoices.length,
        paidViaWalletCount,
        totalBilledAmount: totalBilledSum,
        lineNotifiedCount,
        performedBy: session.user?.name
      }
    });

    return NextResponse.json({
      success: true,
      monthYear,
      formattedMonth: formatThaiMonthYear(monthYear),
      totalHouses: targetHouses.length,
      createdCount: housesToGenerate.length,
      skippedCount: existingInvoices.length,
      paidViaWalletCount,
      totalBilledAmount: totalBilledSum,
      lineNotifiedCount,
    });

  } catch (error: any) {
    console.error("Generate Invoice Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
