import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import LogsClient from "./LogsClient";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const [logs, countRes] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs),
  ]);

  const totalLogs = Number(countRes[0]?.count || 0);
  const totalPages = Math.ceil(totalLogs / limit) || 1;

  return (
    <LogsClient
      initialLogs={logs}
      totalLogs={totalLogs}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
