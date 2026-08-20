import fs from 'fs';
import path from 'path';

const actionsFile = path.resolve('src/app/dashboard/houses/actions.ts');
let content = fs.readFileSync(actionsFile, 'utf-8');

const newActions = `
import { generatePayload } from "promptpay-qr";
import { generateBillFlexMessage, pushMessage } from "@/lib/line";
import { formatThaiMonthYear } from "@/lib/utils";

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
      ? \`\${monthYears[0]} - \${monthYears[monthYears.length - 1]}\` 
      : monthYears.join(", ");

    const mobileNumber = process.env.PROMPTPAY_MOBILE || "0000000000";
    const payload = generatePayload(mobileNumber, { amount: totalDebt });
    const qrUrl = \`\${origin}/api/qr-image?payload=\${encodeURIComponent(payload)}\`;
    const payUrl = \`\${origin}/house/\${houseId}\`;

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
        text: \`สวัสดีค่ะ 💚 แจ้งเตือนยอดค้างชำระค่าธรรมเนียมเก็บขนมูลฝอย บ้านเลขที่ \${house.houseNumber} ค่ะ\\n\\nสามารถตรวจสอบรายละเอียดและชำระเงินได้ที่ลิงก์ด้านล่างนี้นะคะ 🙏\`
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
`;

content = content + '\n' + newActions;
fs.writeFileSync(actionsFile, content);
console.log('Done');
