import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allHouses = await db.select().from(houses).orderBy(asc(houses.houseNumber));
    
    // Create CSV content
    // BOM for Excel to recognize UTF-8 Thai characters
    const BOM = "\uFEFF";
    
    // Header
    let csvContent = "บ้านเลขที่,ชื่อเจ้าบ้าน,ชุมชน/หมู่,ถนน,วันที่สร้างระบบ\n";
    
    // Rows
    allHouses.forEach(h => {
      const houseNumber = `"${(h.houseNumber || "").replace(/"/g, '""')}"`;
      const ownerName = `"${(h.ownerName || "").replace(/"/g, '""')}"`;
      const zone = `"${(h.zone || "").replace(/"/g, '""')}"`;
      const road = `"${(h.road || "").replace(/"/g, '""')}"`;
      const date = `"${h.createdAt ? h.createdAt.toLocaleString('th-TH') : ""}"`;
      
      csvContent += `${houseNumber},${ownerName},${zone},${road},${date}\n`;
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
