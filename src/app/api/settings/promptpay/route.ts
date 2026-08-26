import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
    }

    // 1. Role-Based Access Control (RBAC): Admin only
    const userRole = (session.user as any)?.role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลระบบระดับ Admin เท่านั้นที่มีสิทธิ์แก้ไขข้อมูลการเงินและตั้งค่าระบบ" }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, promptPayId, autoBillingDay, dueDateDays, autoRemindDays, lineConfig, receiptBookConfig } = body;

    // 2. Strict PromptPay ID Validation & Sanitization
    const cleanPp = String(promptPayId || "").replace(/[^0-9]/g, "");
    if (cleanPp.length !== 10 && cleanPp.length !== 13) {
      return NextResponse.json(
        { error: "เบอร์พร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก หรือเลขประจำตัวผู้เสียภาษี 13 หลักเท่านั้น" }, 
        { status: 400 }
      );
    }

    // 3. Name Sanitization
    const safeName = String(name || "").trim().slice(0, 100);
    if (!safeName) {
      return NextResponse.json({ error: "กรุณาระบุชื่อหน่วยงานหรือชื่อบัญชี" }, { status: 400 });
    }

    // 4. Auto Billing Schedule Range Validation
    let parsedAutoBillingDay: number | null = null;
    if (autoBillingDay !== null && autoBillingDay !== undefined && autoBillingDay !== "") {
      const dayNum = parseInt(String(autoBillingDay), 10);
      if (isNaN(dayNum) || dayNum < 1 || dayNum > 28) {
        return NextResponse.json({ error: "วันที่ออกบิลอัตโนมัติต้องอยู่ระหว่างวันที่ 1 ถึง 28 ของเดือน" }, { status: 400 });
      }
      parsedAutoBillingDay = dayNum;
    }

    let parsedDueDateDays: number | null = null;
    if (dueDateDays !== null && dueDateDays !== undefined && dueDateDays !== "") {
      const dueNum = parseInt(String(dueDateDays), 10);
      if (isNaN(dueNum) || dueNum < 1 || dueNum > 365) {
        return NextResponse.json({ error: "จำนวนวันครบกำหนดต้องอยู่ระหว่าง 1 ถึง 365 วัน" }, { status: 400 });
      }
      parsedDueDateDays = dueNum;
    }

    let parsedAutoRemindDays: number | null = null;
    if (autoRemindDays !== null && autoRemindDays !== undefined && autoRemindDays !== "") {
      const remindNum = parseInt(String(autoRemindDays), 10);
      if (isNaN(remindNum) || remindNum < 1 || remindNum > 365) {
        return NextResponse.json({ error: "จำนวนวันทวงหนี้ต้องอยู่ระหว่าง 1 ถึง 365 วัน" }, { status: 400 });
      }
      parsedAutoRemindDays = remindNum;
    }

    // 5. Fetch existing settings to log changes
    const existing = await db.select().from(systemSettings).limit(1);
    const prevSettings = existing[0] || null;

    const updateData: any = { 
      accountName: safeName, 
      promptPayId: cleanPp, 
      autoBillingDay: parsedAutoBillingDay, 
      dueDateDays: parsedDueDateDays, 
      autoRemindDays: parsedAutoRemindDays,
      updatedAt: new Date()
    };

    if (lineConfig !== undefined) updateData.lineConfig = lineConfig;
    if (receiptBookConfig !== undefined) updateData.receiptBookConfig = receiptBookConfig;

    // 6. Atomic Database Update
    if (existing.length > 0) {
      await db.update(systemSettings).set(updateData);
    } else {
      await db.insert(systemSettings).values({ ...updateData, id: 1 });
    }

    // 7. Tamper-Proof Audit Trail Logging
    await recordAuditLog({
      action: "SETTINGS",
      entityType: "SETTINGS",
      details: {
        updatedBy: session.user?.name,
        userRole: userRole,
        accountName: safeName,
        promptPayId: cleanPp,
        autoBillingDay: parsedAutoBillingDay,
        dueDateDays: parsedDueDateDays,
        autoRemindDays: parsedAutoRemindDays,
        previousPromptPayId: prevSettings?.promptPayId,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "บันทึกการตั้งค่าระบบและบัญชีพร้อมเพย์ลงฐานข้อมูลเรียบร้อยแล้ว" 
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
