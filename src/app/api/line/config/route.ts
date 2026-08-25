import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings] = await db.select().from(systemSettings).limit(1);
    const lineConfig = (settings?.lineConfig as any) || {
      emergencyPhone: "044-631405",
      healthDeptPhone: "044-631405",
      announcementText: "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา",
      isAnnouncementActive: true,
    };

    return NextResponse.json({ success: true, lineConfig });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { emergencyPhone, healthDeptPhone, announcementText, isAnnouncementActive } = body;

    const [settings] = await db.select().from(systemSettings).limit(1);
    const currentConfig = (settings?.lineConfig as any) || {};

    const updatedConfig = {
      ...currentConfig,
      emergencyPhone: emergencyPhone || currentConfig.emergencyPhone || "044-631405",
      healthDeptPhone: healthDeptPhone || currentConfig.healthDeptPhone || "044-631405",
      announcementText: announcementText !== undefined ? announcementText : currentConfig.announcementText,
      isAnnouncementActive: isAnnouncementActive !== undefined ? isAnnouncementActive : currentConfig.isAnnouncementActive,
      updatedAt: new Date().toISOString(),
    };

    if (settings) {
      await db.update(systemSettings).set({ lineConfig: updatedConfig }).where(eq(systemSettings.id, settings.id));
    }

    await recordAuditLog({
      action: "SETTINGS",
      entityType: "LINE",
      details: updatedConfig
    });

    return NextResponse.json({ success: true, lineConfig: updatedConfig });
  } catch (error: any) {
    console.error("Error updating LINE config:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
