import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses, systemSettings } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const [allHouses, settingsData] = await Promise.all([
      db.select().from(houses).orderBy(asc(houses.houseNumber)),
      db.select({ houseCustomFieldsSchema: systemSettings.houseCustomFieldsSchema }).from(systemSettings).limit(1)
    ]);
    
    let customFieldsSchema = (settingsData[0]?.houseCustomFieldsSchema as any[]) || [];
    if (customFieldsSchema.length === 0) {
      customFieldsSchema = [
        { id: "houseNumber", name: "บ้านเลขที่", placeholder: "เช่น 123/45", type: "text", required: true, isSystem: true, isHidden: false },
        { id: "ownerName", name: "ชื่อเจ้าบ้าน / ผู้รับผิดชอบ", placeholder: "เช่น สมศรี ใจดี", type: "text", required: true, isSystem: true, isHidden: false },
        { id: "zone", name: "ชุมชน / หมู่ (ตัวเลือก)", placeholder: "เช่น หมู่ 1 ซอย 5", type: "text", required: false, isSystem: true, isHidden: false },
        { id: "road", name: "ถนน (ตัวเลือก)", placeholder: "เช่น ถนนสุขุมวิท", type: "text", required: false, isSystem: true, isHidden: false },
      ];
    }
    const visibleFields = customFieldsSchema.filter(f => !f.isHidden);
    
    // Create CSV content
    // BOM for Excel to recognize UTF-8 Thai characters
    const BOM = "\uFEFF";
    
    // Header
    let customHeaders = visibleFields.map(f => f.name).join(',');
    let csvContent = `${customHeaders ? customHeaders : ''},วันที่สร้างระบบ\n`;
    
    // Rows
    allHouses.forEach(h => {
      let rowValues = visibleFields.map(f => {
        let val = "";
        if (f.isSystem) {
          val = (h as any)[f.id] || "";
        } else {
          val = (h.customFields as Record<string, any>)?.[f.id] || "";
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');

      const date = `"${h.createdAt ? h.createdAt.toLocaleString('th-TH') : ""}"`;
      
      csvContent += `${rowValues ? rowValues : ''},${date}\n`;
    });

    const response = new NextResponse(BOM + csvContent);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', 'attachment; filename="houses_export.csv"');
    
    return response;
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
