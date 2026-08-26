import { db } from "@/lib/db";
import { houses, invoices, systemSettings } from "@/lib/schema";
import { eq, sql, isNotNull } from "drizzle-orm";
import BroadcastClient from "./BroadcastClient";

export const dynamic = "force-dynamic";

const ZONES = [
  "หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", 
  "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", "ถนนหักพัฒนา", 
  "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", "หัวสะพาน", 
  "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"
];

export default async function BroadcastPage() {
  // Aggregate stats for broadcast overview and fetch LINE config
  const [totalHousesRes, linkedLineRes, unpaidInvoicesRes, settingsRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(houses),
    db.select({ count: sql<number>`count(*)` }).from(houses).where(isNotNull(houses.lineUserId)),
    db.select({
      totalDebt: sql<string>`COALESCE(SUM(${invoices.amount}::numeric), 0)`,
      overdueInvoicesCount: sql<number>`count(*)`,
      uniqueHousesCount: sql<number>`count(distinct ${invoices.houseId})`
    }).from(invoices).where(eq(invoices.status, "unpaid")),
    db.select().from(systemSettings).limit(1),
  ]);

  const totalHouses = Number(totalHousesRes[0]?.count || 0);
  const totalLinkedLine = Number(linkedLineRes[0]?.count || 0);
  const totalOverdueDebt = parseFloat(unpaidInvoicesRes[0]?.totalDebt || "0");
  const overdueHousesCount = Number(unpaidInvoicesRes[0]?.uniqueHousesCount || 0);
  const initialLineConfig = (settingsRes[0]?.lineConfig as any) || {
    healthDeptPhone: "044-631405",
    announcementText: "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา",
    isAnnouncementActive: true,
  };

  return (
    <BroadcastClient
      zones={ZONES}
      totalHouses={totalHouses}
      totalLinkedLine={totalLinkedLine}
      totalOverdueDebt={totalOverdueDebt}
      overdueHousesCount={overdueHousesCount}
      initialLineConfig={initialLineConfig}
    />
  );
}
