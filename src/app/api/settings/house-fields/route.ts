import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

const defaultSchema = [
  { id: "houseNumber", name: "บ้านเลขที่", placeholder: "เช่น 123/45", type: "text", required: true, isSystem: true, isHidden: false },
  { id: "ownerName", name: "ชื่อเจ้าบ้าน / ผู้รับผิดชอบ", placeholder: "เช่น สมศรี ใจดี", type: "text", required: true, isSystem: true, isHidden: false },
  { id: "zone", name: "ชุมชน / หมู่ (ตัวเลือก)", placeholder: "เช่น หมู่ 1 ซอย 5", type: "select", options: ["หนองรี", "หนองกราด", "หนองเสม็ด", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", "ป่าเรไร", "วัดร่องมันเทศ", "บ้านถนนหัก", "วัดถนนหัก", "ถนนหักพัฒนา", "ทุ่งแหลม", "หนองโพรง", "วัดใหม่เรไรทอง", "จะบวก", "หัวสะพาน", "ป่าตาเส็ง", "ป่ารักน้ำ", "ดอนแสลงพันธ์", "โคกหลวงพ่อ"], required: false, isSystem: true, isHidden: false },
  { id: "road", name: "ถนน (ตัวเลือก)", placeholder: "เช่น ถนนสุขุมวิท", type: "text", required: false, isSystem: true, isHidden: false },
];

export async function GET() {
  try {
    const settings = await db.select({ houseCustomFieldsSchema: systemSettings.houseCustomFieldsSchema }).from(systemSettings).limit(1);
    
    // If settings not found, return default schema
    if (settings.length === 0 || !settings[0].houseCustomFieldsSchema || (settings[0].houseCustomFieldsSchema as any[]).length === 0) {
      return NextResponse.json(defaultSchema);
    }

    return NextResponse.json(settings[0].houseCustomFieldsSchema);
  } catch (error: any) {
    console.error("Failed to fetch custom fields schema:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const schema = await req.json();
    
    if (!Array.isArray(schema)) {
      return NextResponse.json({ error: "Invalid schema format" }, { status: 400 });
    }

    const settings = await db.select({ id: systemSettings.id }).from(systemSettings).limit(1);

    if (settings.length === 0) {
      // Create settings if not exist (unlikely but safe)
      await db.insert(systemSettings).values({
        accountName: "Default Account",
        promptPayId: "0000000000",
        houseCustomFieldsSchema: schema
      });
    } else {
      // Update existing
      await db.update(systemSettings)
        .set({ houseCustomFieldsSchema: schema, updatedAt: new Date() })
        .where(eq(systemSettings.id, settings[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update custom fields schema:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
