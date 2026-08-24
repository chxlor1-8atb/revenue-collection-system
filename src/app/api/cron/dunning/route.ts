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
    if (!settings || !settings.autoBillingDay || !settings.dueDateDays || !settings.autoRemindDays) {
      return NextResponse.json({ message: 'Auto dunning is disabled or missing configuration' }, { status: 200 });
    }

    // 2. Check if today is the target reminder day
    const now = new Date();
    const thTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    // Auto-remind day calculation
    // Due Date = AutoBillingDay + DueDateDays
    // Remind Date = Due Date + AutoRemindDays
    const remindDay = (settings.autoBillingDay + settings.dueDateDays + settings.autoRemindDays) % 31 || 31;
    
    // Simple naive check based on date of month (works well enough for monthly schedules)
    if (thTime.getDate() !== remindDay) {
      return NextResponse.json({ message: `Today (${thTime.getDate()}) is not remind day (${remindDay})` }, { status: 200 });
    }

    // 3. Get all houses that have unpaid bills
    const allHouses = await db.select().from(houses);
    let remindedCount = 0;

    const mobileNumber = process.env.PROMPTPAY_MOBILE || "0000000000";
    
    let origin = "https://nangronggarbagepayments.vercel.app";
    const host = req.headers.get('host');
    if (host && (host.includes('localhost') || host.includes('vercel'))) {
      origin = (host.includes('localhost') ? 'http://' : 'https://') + host;
    }

    for (const house of allHouses) {
      if (!house.lineUserId) continue; // Skip if no LINE bound

      // Check for unpaid bills
      const unpaidInvoices = await db.select().from(invoices)
        .where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')))
        .orderBy(invoices.monthYear);

      if (unpaidInvoices.length > 0) {
        // We have unpaid bills, let's remind them
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

        try {
          await pushMessage(house.lineUserId, [
            {
              type: "text",
              text: `⚠️ แจ้งเตือนการชำระค่าธรรมเนียมเก็บขนมูลฝอย ⚠️\nบ้านเลขที่ ${house.houseNumber} มียอดค้างชำระนะคะ\n\nหากท่านชำระแล้ว ขออภัยในความไม่สะดวกค่ะ 🙏`
            },
            flexMsg
          ]);
          remindedCount++;
          
          await new Promise(r => setTimeout(r, 50));
        } catch (e) {
          console.error(`Failed to send reminder LINE message to ${house.houseNumber}`, e);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auto-dunning completed. Sent ${remindedCount} LINE reminders.` 
    });

  } catch (error: any) {
    console.error('Error in auto dunning cron:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
