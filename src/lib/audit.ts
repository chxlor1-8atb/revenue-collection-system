import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import { auth } from "@/lib/auth";

export interface AuditLogParams {
  action: "CREATE" | "UPDATE" | "DELETE" | "VOID" | "APPROVE" | "REJECT" | "EXPORT" | "IMPORT" | "SYNC" | "SETTINGS" | "BROADCAST" | "LOGIN";
  entityType: "HOUSE" | "INVOICE" | "TRANSACTION" | "USER" | "SETTINGS" | "BROADCAST" | "LINE" | "FEE_CATEGORY";
  entityId?: string | number | null;
  details?: Record<string, any>;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
}

export async function recordAuditLog(params: AuditLogParams) {
  try {
    let name = params.userName;
    let role = params.userRole;

    if (!name) {
      try {
        const session = await auth();
        if (session?.user?.name) {
          name = session.user.name;
          role = (session.user as any).role || "staff";
        }
      } catch {
        // Session not available in background/cron contexts
      }
    }

    await db.insert(auditLogs).values({
      userName: name || "System",
      userRole: role || "system",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ? String(params.entityId) : null,
      details: params.details || {},
      ipAddress: params.ipAddress || null,
    });
  } catch (error) {
    // Non-blocking: Audit log failure should not crash core financial operations
    console.error("[AuditLog Error]", error);
  }
}
