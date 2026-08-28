import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { houses, invoices, systemSettings } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { generateBillFlexMessage, pushMessage } from '@/lib/line';

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
const generatePayload = require("promptpay-qr");

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron

export async function GET(req: Request) {
  try {
    // 0. Verify Cron Authorization if CRON_SECRET is configured
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(req.url);
      const queryKey = url.searchParams.get('key');
      if (queryKey !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 1. Get settings
    const [settings] = await db.select().from(systemSettings).limit(1);
    if (!settings || !settings.autoBillingDay) {
      return NextResponse.json({ message: 'Auto billing is disabled or not configured' }, { status: 200 });
    }

    // 2. Check if today is the billing day
    const now = new Date();
    // Thai time
    const thTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    // For Vercel Cron, usually we trigger it every day and let the code decide if it should run
    if (thTime.getDate() !== settings.autoBillingDay) {
      return NextResponse.json({ message: `Today is not billing day (${settings.autoBillingDay})` }, { status: 200 });
    }

    const currentMonthYear = thTime.toISOString().slice(0, 7);

    // 3. Get all houses
    const allHouses = await db.select().from(houses);
    let createdCount = 0;
    let pushedCount = 0;

    const mobileNumber = process.env.PROMPTPAY_MOBILE || "0000000000";
    
    // Get host from request
    let origin = "https://nangronggarbagepayments.vercel.app";
    const host = req.headers.get('host');
    if (host && (host.includes('localhost') || host.includes('vercel'))) {
      origin = (host.includes('localhost') ? 'http://' : 'https://') + host;
    }

    for (const house of allHouses) {
      // Check if bill already exists
      const existing = await db.select().from(invoices).where(
        and(eq(invoices.houseId, house.id), eq(invoices.monthYear, currentMonthYear), eq(invoices.type, 'monthly'))
      ).limit(1);

      if (existing.length === 0) {
        // Create bill and handle wallet balance
        const amount = house.defaultBillingAmount || "20.00";
        const amountToPay = parseFloat(amount);
        let wallet = parseFloat(house.walletBalance || "0");
        let invStatus = 'unpaid';
        let invPaid = 0;
        let invRemaining = amountToPay;

        if (wallet >= amountToPay) {
          invStatus = 'paid';
          invPaid = amountToPay;
          invRemaining = 0;
          wallet -= amountToPay;
        } else if (wallet > 0) {
          invStatus = 'partial';
          invPaid = wallet;
          invRemaining = amountToPay - wallet;
          wallet = 0;
        }
        
        const tx = db; {
          await tx.insert(invoices).values({
            houseId: house.id,
            monthYear: currentMonthYear,
            amount,
            amountPaid: invPaid.toString(),
            remainingAmount: invRemaining.toString(),
            type: 'monthly',
            status: invStatus,
            isBroadcasted: house.lineUserId ? true : false,
          });

          if (parseFloat(house.walletBalance || "0") !== wallet) {
            await tx.update(houses).set({ walletBalance: wallet.toString() }).where(eq(houses.id, house.id));
          }
        }
        
        createdCount++;

        // Send LINE push
        if (house.lineUserId) {
          try {
            // Find total unpaid to combine in the flex message
            const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid'))).orderBy(invoices.monthYear);
            const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            
            const monthYears = unpaidInvoices.map(inv => formatThaiMonthYear(inv.monthYear));
            const combinedMonthYearStr = monthYears.length > 2 
              ? `${monthYears[0]} - ${monthYears[monthYears.length - 1]}` 
              : monthYears.join(", ");

            const payload = generatePayload(mobileNumber, { amount: totalDebt });
            const qrUrl = `${origin}/api/qr-image?amount=${totalDebt}&ext=.png`;
            const payUrl = `${origin}/house/${house.id}`;

            const flexMsg = generateBillFlexMessage(
              house.houseNumber,
              combinedMonthYearStr,
              totalDebt,
              payUrl,
              qrUrl
            );

            await pushMessage(house.lineUserId, [
              {
                type: "text",
                text: `สวัสดีค่ะ 💚 แจ้งบิลค่าธรรมเนียมเก็บขนมูลฝอยรอบใหม่ สำหรับบ้านเลขที่ ${house.houseNumber} มาแล้วค่ะ\n\nสามารถตรวจสอบรายละเอียดและชำระเงินได้ที่ลิงก์ด้านล่างนี้นะคะ 🙏`
              },
              flexMsg
            ]);
            pushedCount++;
            
            // Sleep 50ms to prevent LINE rate limit (max 100,000 push/min but still good to throttle slightly)
            await new Promise(r => setTimeout(r, 50));
          } catch (e) {
            console.error(`Failed to send LINE message to ${house.houseNumber}`, e);
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auto-billing completed. Created ${createdCount} bills and pushed ${pushedCount} LINE messages.` 
    });

  } catch (error: any) {
    console.error('Error in auto billing cron:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
