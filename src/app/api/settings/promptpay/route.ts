import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, promptPayId, autoBillingDay, dueDateDays, autoRemindDays, lineConfig, receiptBookConfig } = await request.json();

    if (!id || !name || !promptPayId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updateData: any = { 
      accountName: name, 
      promptPayId, 
      autoBillingDay, 
      dueDateDays, 
      autoRemindDays,
      updatedAt: new Date()
    };

    if (lineConfig !== undefined) updateData.lineConfig = lineConfig;
    if (receiptBookConfig !== undefined) updateData.receiptBookConfig = receiptBookConfig;

    const existing = await db.select().from(systemSettings).limit(1);
    if (existing.length > 0) {
      await db.update(systemSettings).set(updateData);
    } else {
      await db.insert(systemSettings).values({ ...updateData, id: 1 });
    }

    await recordAuditLog({
      action: "SETTINGS",
      entityType: "SETTINGS",
      details: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
