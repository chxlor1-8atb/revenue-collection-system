import { NextResponse } from "next/server";
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

    const ws = workbook.addWorksheet("ข้อมูลทะเบียนบ้าน", {
      views: [{ showGridLines: true }]
    });

    // Columns config
    ws.columns = [
      { width: 8.0 },   // 1: ลำดับ
      { width: 16.0 },  // 2: บ้านเลขที่ (จำเป็น)
      { width: 28.0 },  // 3: ชื่อ - สกุล (จำเป็น)
      { width: 20.0 },  // 4: ชุมชน
      { width: 10.0 },  // 5: หมู่ที่
      { width: 22.0 },  // 6: ซอย
      { width: 24.0 },  // 7: ถนน
      { width: 22.0 },  // 8: ยอดจัดเก็บต่อเดือน (บาท)
    ];

    // Border styles
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } }
    };

    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: "medium", color: { argb: "FF1E293B" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF1E293B" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } }
    };

    // Header Row
    const headerRow = ws.getRow(1);
    headerRow.height = 32;

    const headers = [
      "ลำดับ",
      "บ้านเลขที่ *",
      "ชื่อ - สกุล *",
      "ชุมชน",
      "หมู่ที่",
      "ซอย",
      "ถนน",
      "ยอดจัดเก็บต่อเดือน (บาท)"
    ];

    headers.forEach((text, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = text;
      cell.font = {
        name: "TH Sarabun New",
        size: 16,
        bold: true,
        color: { argb: "FFFFFFFF" }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E293B" } // Slate-800
      };
      cell.border = headerBorder;
    });

    // Sample Data Rows
    const sampleRows = [
      [1, "101/1", "นายสมชาย ใจดี", "หนองรี", "1", "ซอยร่วมใจ", "ประชาร่วมมิตร", 20],
      [2, "101/2", "นางสมศรี มีสุข", "วัดกลาง", "2", "ซอยสุขใจ", "เทศบาล 1", 20],
      [3, "101/3", "นายประสิทธิ์ มั่นคง", "ป่าเรไร", "3", "ซอย 3", "นางรอง-ลำปลายมาศ", 20],
      [4, "102/5", "นางสาววิภา พรประเสริฐ", "บ้านเก่า", "4", "-", "สุขาภิบาล 2", 20],
      [5, "105", "นายบุญมี เจริญสุข", "ดอนแสลงพันธ์", "5", "ซอยพัฒนา", "ประจันตคาม", 20],
    ];

    sampleRows.forEach((rowValues, rowIdx) => {
      const row = ws.getRow(rowIdx + 2);
      row.height = 24;

      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = {
          name: "TH Sarabun New",
          size: 15,
          color: { argb: "FF334155" }
        };
        cell.alignment = {
          horizontal: colIdx === 0 || colIdx === 1 || colIdx === 4 ? "center" : colIdx === 7 ? "right" : "left",
          vertical: "middle"
        };
        if (colIdx === 7) {
          cell.numFmt = "#,##0.00";
        }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowIdx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC" }
        };
        cell.border = thinBorder;
      });
    });

    // Sheet 2: รายชื่อชุมชนในเทศบาลเมืองนางรอง (Zone Reference)
    const refWs = workbook.addWorksheet("รายชื่อชุมชนอ้างอิง");
    refWs.columns = [
      { width: 8.0 },
      { width: 28.0 }
    ];

    const refHeader = refWs.getRow(1);
    refHeader.height = 28;
    ["ลำดับ", "ชื่อชุมชนในเขตเทศบาลเมืองนางรอง"].forEach((text, idx) => {
      const cell = refHeader.getCell(idx + 1);
      cell.value = text;
      cell.font = { name: "TH Sarabun New", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B58F2" } };
    });

    OFFICIAL_ZONES.forEach((zoneName, idx) => {
      const row = refWs.getRow(idx + 2);
      row.height = 22;
      const cell1 = row.getCell(1);
      cell1.value = idx + 1;
      cell1.font = { name: "TH Sarabun New", size: 15 };
      cell1.alignment = { horizontal: "center", vertical: "middle" };

      const cell2 = row.getCell(2);
      cell2.value = zoneName;
      cell2.font = { name: "TH Sarabun New", size: 15 };
      cell2.alignment = { horizontal: "left", vertical: "middle" };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="house_import_template_nangrong.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Error generating Excel template:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
