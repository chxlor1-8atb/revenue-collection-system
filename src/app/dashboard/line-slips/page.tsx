import { db } from "@/lib/db";
import { lineMessages } from "@/lib/schema";
import { desc, eq, sql } from "drizzle-orm";
import LineSlipsClient from "./LineSlipsClient";

export const dynamic = "force-dynamic";

export default async function LineSlipsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  
  const tab = (typeof searchParams.tab === 'string' ? searchParams.tab : 'pending') as 'pending' | 'verified';
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const offset = (page - 1) * limit;

  // Get total counts for badges
  const [pendingCountRes, verifiedCountRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(lineMessages).where(eq(lineMessages.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(lineMessages).where(eq(lineMessages.status, "verified_auto")),
  ]);

  const pendingCount = Number(pendingCountRes[0]?.count || 0);
  const verifiedCount = Number(verifiedCountRes[0]?.count || 0);

  // Fetch only the data for the active tab
  let slips = [];
  let totalForTab = 0;

  if (tab === 'pending') {
    slips = await db
      .select()
      .from(lineMessages)
      .where(eq(lineMessages.status, "pending"))
      .orderBy(desc(lineMessages.createdAt))
      .limit(limit)
      .offset(offset);
    totalForTab = pendingCount;
  } else {
    slips = await db
      .select()
      .from(lineMessages)
      .where(eq(lineMessages.status, "verified_auto"))
      .orderBy(desc(lineMessages.createdAt))
      .limit(limit)
      .offset(offset);
    totalForTab = verifiedCount;
  }

  const totalPages = Math.ceil(totalForTab / limit);

  return (
    <div className="font-sans">
      <LineSlipsClient 
        slips={slips} 
        activeTab={tab}
        currentPage={page}
        totalPages={totalPages}
        limit={limit}
        pendingCount={pendingCount}
        verifiedCount={verifiedCount}
      />
    </div>
  );
}
