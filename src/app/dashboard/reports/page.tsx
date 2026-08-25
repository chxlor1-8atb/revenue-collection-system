import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

const OFFICIAL_ZONES = [
  "หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", 
  "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", "ถนนหักพัฒนา", 
  "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", "หัวสะพาน", 
  "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"
];

export default async function ReportsPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Total revenue collected today
  const todayRes = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}::numeric), 0)` })
    .from(transactions)
    .where(and(eq(transactions.slipStatus, "verified"), gte(transactions.paidAt, todayStart)));

  const todayRevenue = parseFloat(todayRes[0]?.total || "0");

  // 2. All-time collected vs Unpaid
  const [paidRes, unpaidRes, housesCountRes] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${invoices.amount}::numeric), 0)` })
      .from(invoices)
      .where(eq(invoices.status, "paid")),
    db.select({ 
      total: sql<string>`COALESCE(SUM(${invoices.amount}::numeric), 0)`,
      count: sql<number>`count(*)`
    })
      .from(invoices)
      .where(eq(invoices.status, "unpaid")),
    db.select({ count: sql<number>`count(*)` }).from(houses),
  ]);

  const totalPaidRevenue = parseFloat(paidRes[0]?.total || "0");
  const totalUnpaidDebt = parseFloat(unpaidRes[0]?.total || "0");
  const totalHouses = Number(housesCountRes[0]?.count || 0);

  // 3. Community Performance breakdown
  const housesList = await db.select({ id: houses.id, zone: houses.zone }).from(houses);
  const paidInvoices = await db.select({ houseId: invoices.houseId, amount: invoices.amount }).from(invoices).where(eq(invoices.status, "paid"));
  const unpaidInvoices = await db.select({ houseId: invoices.houseId, amount: invoices.amount }).from(invoices).where(eq(invoices.status, "unpaid"));

  const houseZoneMap = new Map(housesList.map(h => [h.id, h.zone || "ไม่ระบุ"]));

  const communityStats = OFFICIAL_ZONES.map((zoneName) => {
    const countHouses = housesList.filter(h => h.zone === zoneName).length;
    const paidAmount = paidInvoices.filter(i => houseZoneMap.get(i.houseId) === zoneName).reduce((s, i) => s + parseFloat(i.amount), 0);
    const unpaidAmount = unpaidInvoices.filter(i => houseZoneMap.get(i.houseId) === zoneName).reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalDemand = paidAmount + unpaidAmount;
    const collectionRate = totalDemand > 0 ? (paidAmount / totalDemand) * 100 : 0;

    return {
      zone: zoneName,
      totalHouses: countHouses,
      paidAmount,
      unpaidAmount,
      collectionRate: Math.round(collectionRate * 10) / 10,
    };
  }).sort((a, b) => b.collectionRate - a.collectionRate);

  return (
    <ReportsClient
      todayRevenue={todayRevenue}
      totalPaidRevenue={totalPaidRevenue}
      totalUnpaidDebt={totalUnpaidDebt}
      totalHouses={totalHouses}
      communityStats={communityStats}
    />
  );
}
