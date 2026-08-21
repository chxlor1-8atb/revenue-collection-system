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

const MONTH_COLS = [
  { header: "ต.ค.68", key: "2025-10" },
  { header: "พ.ย.68", key: "2025-11" },
  { header: "ธ.ค.68", key: "2025-12" },
  { header: "ม.ค.69", key: "2026-01" },
  { header: "ก.พ.69", key: "2026-02" },
  { header: "มี.ค.69", key: "2026-03" },
  { header: "เม.ย.69", key: "2026-04" },
  { header: "พ.ค.69", key: "2026-05" },
  { header: "มิ.ย.69", key: "2026-06" },
  { header: "ก.ค.69", key: "2026-07" },
  { header: "ส.ค.69", key: "2026-08" },
  { header: "ก.ย.69", key: "2026-09" },
];

export async function GET() {
  try {
    const [allHouses, allInvoices] = await Promise.all([
      db.select().from(houses).orderBy(asc(houses.houseNumber)),
      db.select().from(invoices)
    ]);

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

      // Column widths (identical to template)
      ws.columns = [
        { width: 6.0 },   // 1: ลำดับ
        { width: 28.0 },  // 2: ชื่อ - สกุล
        { width: 11.0 },  // 3: บ้านเลขที่
        { width: 22.0 },  // 4: ถนน/ซอย
        { width: 6.5 },   // 5: ต.ค.68
        { width: 6.5 },   // 6: พ.ย.68
        { width: 6.5 },   // 7: ธ.ค.68
        { width: 6.5 },   // 8: ม.ค.69
        { width: 6.5 },   // 9: ก.พ.69
        { width: 6.5 },   // 10: มี.ค.69
        { width: 6.5 },   // 11: เม.ย.69
        { width: 6.5 },   // 12: พ.ค.69
        { width: 6.5 },   // 13: มิ.ย.69
        { width: 6.5 },   // 14: ก.ค.69
        { width: 6.5 },   // 15: ส.ค.69
        { width: 6.5 },   // 16: ก.ย.69
        { width: 9.0 },   // 17: รวม
      ];

      // Row 1: Header Row
      const headerRow = ws.getRow(1);
      const headers = [
        "ลำดับ", "ชื่อ - สกุล", "บ้านเลขที่", "ถนน/ซอย",
        ...MONTH_COLS.map(m => m.header),
        "รวม"
      ];

      headers.forEach((text, colIdx) => {
        const cell = headerRow.getCell(colIdx + 1);
        cell.value = text;
        cell.font = {
          name: "TH Sarabun New",
          size: colIdx >= 4 && colIdx <= 15 ? 14 : 16,
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

        // Col 5-16: Month columns
        const houseInvs = invoiceMap[house.id] || {};
        let totalPaidAmount = 0;
        MONTH_COLS.forEach((m, mIdx) => {
          const cellM = mainRow.getCell(5 + mIdx);
          const inv = houseInvs[m.key];
          if (inv && inv.status === "paid") {
            const amt = parseFloat(inv.amount) || 0;
            cellM.value = amt;
            totalPaidAmount += amt;
          } else {
            cellM.value = null;
          }
          cellM.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
          cellM.alignment = { horizontal: "center", vertical: "middle" };
          cellM.border = thinBorder;
        });

        // Col 17: รวม
        const cell17 = mainRow.getCell(17);
        cell17.value = totalPaidAmount > 0 ? totalPaidAmount : null;
        cell17.font = { name: "TH Sarabun New", size: 16, color: { argb: "FF000000" } };
        cell17.alignment = { horizontal: "center", vertical: "middle" };
        cell17.border = thinBorder;

        // Sub-row (Blank row with borders)
        const subRow = ws.getRow(rowIdx + 1);
        for (let c = 1; c <= 17; c++) {
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
