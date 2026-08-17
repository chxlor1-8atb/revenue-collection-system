import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";

export async function GET() {
  try {
    const settings = await db.select({ houseCustomFieldsSchema: systemSettings.houseCustomFieldsSchema }).from(systemSettings).limit(1);
    
    // If settings not found, return empty array
    if (settings.length === 0 || !settings[0].houseCustomFieldsSchema) {
      return NextResponse.json([]);
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
        .where({ id: settings[0].id });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update custom fields schema:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
