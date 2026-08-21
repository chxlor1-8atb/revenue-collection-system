import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { asc } from "drizzle-orm";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const OFFICIAL_ZONES = [
  "หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", 
  "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", "ถนนหักพัฒนา", 
  "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", "หัวสะพาน", 
  "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"
];

function formatThaiShortMonth(monthYear: string) {
  const [yearStr, monthStr] = monthYear.split("-");
  const monthNum = parseInt(monthStr, 10);
  const yearNum = parseInt(yearStr, 10);
  const thaiMonths = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const shortYear = (yearNum + 543).toString().slice(-2);
  return `${thaiMonths[monthNum] || monthStr}${shortYear}`;
}

export async function GET() {
  try {
    const [allHouses, allInvoices] = await Promise.all([
      db.select().from(houses).orderBy(asc(houses.houseNumber)),
      db.select().from(invoices)
    ]);

    // Standard fiscal year 2569 (Oct 2568 - Sep 2569)
    const defaultFiscalMonths = [
      "2025-10", "2025-11", "2025-12",
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
      "2026-07", "2026-08", "2026-09"
    ];

    // Collect all unique months from DB and default fiscal year, sorted chronologically
    const allUniqueMonths = Array.from(
      new Set([...defaultFiscalMonths, ...allInvoices.map(inv => inv.monthYear)])
    ).filter(m => /^\d{4}-\d{2}$/.test(m)).sort();

    const monthCols = allUniqueMonths.map(m => ({
      key: m,
      header: formatThaiShortMonth(m)
    }));

    // Map invoices by houseId and monthYear
    const invoiceMap: Record<number, Record<string, any>> = {};
    allInvoices.forEach(inv => {
      if (!invoiceMap[inv.houseId]) invoiceMap[inv.houseId] = {};
      invoiceMap[inv.houseId][inv.monthYear] = inv;
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Revenue Collection System";
    workbook.created = new Date();

    // Border style
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin" as const, color: { argb: "FF000000" } },
      left: { style: "thin" as const, color: { argb: "FF000000" } },
      bottom: { style: "thin" as const, color: { argb: "FF000000" } },
      right: { style: "thin" as const, color: { argb: "FF000000" } }
    };

    // Group houses by zone
    const housesByZone: Record<string, typeof allHouses> = {};
    OFFICIAL_ZONES.forEach(z => { housesByZone[z] = []; });
    
    allHouses.forEach(h => {
      const z = h.zone || "หนองรี";
      if (!housesByZone[z]) housesByZone[z] = [];
      housesByZone[z].push(h);
    });

    // Generate sheet for each zone
    for (const zone of Object.keys(housesByZone)) {
      const zoneHouses = housesByZone[zone];
      const ws = workbook.addWorksheet(zone);

      // Dynamic column widths
      ws.columns = [
        { width: 6.0 },   // 1: ลำดับ
        { width: 28.0 },  // 2: ชื่อ - สกุล
        { width: 11.0 },  // 3: บ้านเลขที่
        { width: 22.0 },  // 4: ถนน/ซอย
        ...monthCols.map(() => ({ width: 6.5 })), // Month cols
        { width: 9.0 },   // รวม
      ];

      // Row 1: Header Row
      const headerRow = ws.getRow(1);
      const headers = [
        "ลำดับ", "ชื่อ - สกุล", "บ้านเลขที่", "ถนน/ซอย",
        ...monthCols.map(m => m.header),
        "รวม"
      ];

      headers.forEach((text, colIdx) => {
        const cell = headerRow.getCell(colIdx + 1);
        cell.value = text;
        cell.font = {
          name: "TH Sarabun New",
          size: colIdx >= 4 && colIdx < headers.length - 1 ? 14 : 16,
          bold: true,
          color: { argb: "FF000000" }
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" }
        };
        cell.border = thinBorder;
      });

      // Data Rows (2 rows per house: 1 main + 1 sub-row)
      let rowIdx = 2;
      zoneHouses.forEach((house, idx) => {
        const mainRow = ws.getRow(rowIdx);

        // Col 1: ลำดับ
        const cell1 = mainRow.getCell(1);
        cell1.value = idx + 1;
        cell1.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
        cell1.alignment = { horizontal: "center", vertical: "middle" };
        cell1.border = thinBorder;

        // Col 2: ชื่อ - สกุล
        const cell2 = mainRow.getCell(2);
        cell2.value = house.ownerName;
        cell2.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
        cell2.border = thinBorder;

        // Col 3: บ้านเลขที่
        const cell3 = mainRow.getCell(3);
        cell3.value = house.houseNumber;
        cell3.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
        cell3.alignment = { horizontal: "center", vertical: "middle" };
        cell3.border = thinBorder;

        // Col 4: ถนน/ซอย
        const roadSoiParts = [];
        if (house.soi) roadSoiParts.push(house.soi.startsWith("ซ.") || house.soi.startsWith("ซอย") ? house.soi : `ซ.${house.soi}`);
        if (house.road) roadSoiParts.push(house.road.startsWith("ถ.") || house.road.startsWith("ถนน") ? house.road : `ถ.${house.road}`);
        const cell4 = mainRow.getCell(4);
        cell4.value = roadSoiParts.join(" ") || "";
        cell4.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
        cell4.border = thinBorder;

        // Month columns (Col 5 to 5 + monthCols.length - 1)
        const houseInvs = invoiceMap[house.id] || {};
        let totalPaidAmount = 0;
        monthCols.forEach((m, mIdx) => {
          const cellM = mainRow.getCell(5 + mIdx);
          const inv = houseInvs[m.key];
          if (inv && inv.status === "paid") {
            const amt = parseFloat(inv.amount) || 0;
            cellM.value = amt;
            totalPaidAmount += amt;
          } else {
            cellM.value = null; // อันไหนไม่มี ให้ว่างไว้
          }
          cellM.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
          cellM.alignment = { horizontal: "center", vertical: "middle" };
          cellM.border = thinBorder;
        });

        // Col รวม
        const totalColIdx = 5 + monthCols.length;
        const cellTotal = mainRow.getCell(totalColIdx);
        cellTotal.value = totalPaidAmount > 0 ? totalPaidAmount : null;
        cellTotal.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
        cellTotal.alignment = { horizontal: "center", vertical: "middle" };
        cellTotal.border = thinBorder;

        // Sub-row (Blank row with borders for notes/signatures)
        const subRow = ws.getRow(rowIdx + 1);
        for (let c = 1; c <= totalColIdx; c++) {
          const subCell = subRow.getCell(c);
          subCell.value = null;
          subCell.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
          if (c === 1 || c === 3 || c >= 5) {
            subCell.alignment = { horizontal: "center", vertical: "middle" };
          }
          subCell.border = thinBorder;
        }

        rowIdx += 2;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const encodedFileName = encodeURIComponent("จำนวนครัวเรือนทุกชุมชน.xlsx");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="households_by_zone.xlsx"; filename*=UTF-8''${encodedFileName}`
      }
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
