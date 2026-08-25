import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const OFFICIAL_ZONES = [
  "หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", 
  "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", "ถนนหักพัฒนา", 
  "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", "หัวสะพาน", 
  "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"
];

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "เทศบาลเมืองนางรอง - กองสาธารณสุขและสิ่งแวดล้อม";
    workbook.created = new Date();

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } }
    };

    // ==========================================
    // SHEET 1: รายงานการรับเงิน (Cash Collection Ledger)
    // ==========================================
    const ws1 = workbook.addWorksheet("รายงานบัญชีรับเงิน", { views: [{ showGridLines: true }] });
    ws1.columns = [
      { width: 8 },   // ลำดับ
      { width: 22 },  // รหัสกำกับใบเสร็จ
      { width: 18 },  // วันที่ชำระ
      { width: 14 },  // บ้านเลขที่
      { width: 28 },  // ชื่อเจ้าบ้าน / ผู้ชำระ
      { width: 20 },  // ชุมชน
      { width: 16 },  // ช่องทางชำระ
      { width: 18 },  // จำนวนเงิน (บาท)
    ];

    const h1 = ws1.getRow(1);
    h1.height = 30;
    ["ลำดับ", "รหัสกำกับใบเสร็จ", "วันที่ชำระ", "บ้านเลขที่", "ชื่อเจ้าบ้าน / ผู้ชำระ", "ชุมชน", "ช่องทางชำระ", "จำนวนเงิน (บาท)"].forEach((text, i) => {
      const cell = h1.getCell(i + 1);
      cell.value = text;
      cell.font = { name: "TH Sarabun New", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    });

    // Query paid transactions with house info
    const paidTxs = await db
      .select({
        id: transactions.id,
        receiptCode: transactions.receiptCode,
        paidAt: transactions.paidAt,
        amount: transactions.amount,
        verifiedBy: transactions.verifiedBy,
        payerNote: transactions.payerNote,
        houseNumber: sql<string>`COALESCE((
          SELECT h.house_number FROM invoices inv JOIN houses h ON inv.house_id = h.id WHERE inv.transaction_id = ${transactions.id} LIMIT 1
        ), '-')`,
        ownerName: sql<string>`COALESCE((
          SELECT h.owner_name FROM invoices inv JOIN houses h ON inv.house_id = h.id WHERE inv.transaction_id = ${transactions.id} LIMIT 1
        ), '-')`,
        zone: sql<string>`COALESCE((
          SELECT h.zone FROM invoices inv JOIN houses h ON inv.house_id = h.id WHERE inv.transaction_id = ${transactions.id} LIMIT 1
        ), '-')`,
      })
      .from(transactions)
      .where(eq(transactions.slipStatus, "verified"))
      .orderBy(desc(transactions.paidAt))
      .limit(1000);

    let totalCollected = 0;
    paidTxs.forEach((tx, idx) => {
      const row = ws1.getRow(idx + 2);
      row.height = 22;
      const amt = parseFloat(tx.amount || "0");
      totalCollected += amt;

      const method = tx.verifiedBy === "admin_cash" ? "เงินสด" : tx.verifiedBy === "line_bot_auto" ? "LINE Bot Auto" : "PromptPay / โอน";

      const vals = [
        idx + 1,
        tx.receiptCode || `RC-${String(tx.id).padStart(6, "0")}`,
        tx.paidAt ? new Date(tx.paidAt).toLocaleDateString("th-TH") : "-",
        tx.houseNumber,
        tx.ownerName,
        tx.zone,
        method,
        amt
      ];

      vals.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.font = { name: "TH Sarabun New", size: 15 };
        cell.alignment = { horizontal: cIdx === 0 || cIdx === 2 || cIdx === 3 ? "center" : cIdx === 7 ? "right" : "left", vertical: "middle" };
        if (cIdx === 7) cell.numFmt = "#,##0.00";
        cell.border = thinBorder;
      });
    });

    // Summary Row for Sheet 1
    const summaryRow1 = ws1.getRow(paidTxs.length + 2);
    summaryRow1.height = 26;
    const sumCellLabel = summaryRow1.getCell(1);
    sumCellLabel.value = "รวมยอดจัดเก็บทั้งหมด (บาท)";
    sumCellLabel.font = { name: "TH Sarabun New", size: 16, bold: true };
    ws1.mergeCells(paidTxs.length + 2, 1, paidTxs.length + 2, 7);
    const sumCellVal = summaryRow1.getCell(8);
    sumCellVal.value = totalCollected;
    sumCellVal.font = { name: "TH Sarabun New", size: 16, bold: true, color: { argb: "FF047857" } };
    sumCellVal.numFmt = "#,##0.00";
    sumCellVal.border = thinBorder;

    // ==========================================
    // SHEET 2: สถิติการจัดเก็บ 20 ชุมชน (Community Statistics)
    // ==========================================
    const ws2 = workbook.addWorksheet("สถิติจัดเก็บรายชุมชน", { views: [{ showGridLines: true }] });
    ws2.columns = [
      { width: 8 },   // ลำดับ
      { width: 26 },  // ชื่อชุมชน
      { width: 16 },  // ทะเบียนบ้าน (หลัง)
      { width: 18 },  // จัดเก็บแล้ว (บาท)
      { width: 18 },  // ค้างชำระ (บาท)
      { width: 16 },  // อัตราจัดเก็บสำเร็จ
    ];

    const h2 = ws2.getRow(1);
    h2.height = 30;
    ["ลำดับ", "ชื่อชุมชน", "ทะเบียนบ้าน (หลัง)", "จัดเก็บแล้ว (บาท)", "ค้างชำระ (บาท)", "อัตราจัดเก็บ (%)"].forEach((text, i) => {
      const cell = h2.getCell(i + 1);
      cell.value = text;
      cell.font = { name: "TH Sarabun New", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B58F2" } };
    });

    // Query community breakdown
    const housesList = await db.select().from(houses);
    const unpaidInvoicesList = await db.select().from(invoices).where(eq(invoices.status, "unpaid"));
    const paidInvoicesList = await db.select().from(invoices).where(eq(invoices.status, "paid"));

    const houseZoneMap = new Map(housesList.map(h => [h.id, h.zone || "ไม่ระบุ"]));

    OFFICIAL_ZONES.forEach((zoneName, idx) => {
      const zoneHouses = housesList.filter(h => h.zone === zoneName);
      const zonePaidDebt = paidInvoicesList.filter(inv => houseZoneMap.get(inv.houseId) === zoneName).reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const zoneUnpaidDebt = unpaidInvoicesList.filter(inv => houseZoneMap.get(inv.houseId) === zoneName).reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      const totalDemand = zonePaidDebt + zoneUnpaidDebt;
      const rate = totalDemand > 0 ? (zonePaidDebt / totalDemand) * 100 : 0;

      const row = ws2.getRow(idx + 2);
      row.height = 22;
      const vals = [idx + 1, zoneName, zoneHouses.length, zonePaidDebt, zoneUnpaidDebt, `${rate.toFixed(1)}%`];
      vals.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.font = { name: "TH Sarabun New", size: 15 };
        cell.alignment = { horizontal: cIdx === 0 || cIdx === 2 || cIdx === 5 ? "center" : cIdx === 3 || cIdx === 4 ? "right" : "left", vertical: "middle" };
        if (cIdx === 3 || cIdx === 4) cell.numFmt = "#,##0.00";
        cell.border = thinBorder;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="municipal_financial_report_nangrong.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Error generating reports export:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
