import { db } from "@/lib/db";
import { lineMessages, houses } from "@/lib/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import LineSlipsClient from "./LineSlipsClient";
import { getSmartSuggestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function LineSlipsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  
  const tab = (typeof searchParams.tab === 'string' ? searchParams.tab : 'pending') as 'pending' | 'verified' | 'rejected';
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 12;
  const offset = (page - 1) * limit;

  // Get total counts for badges
  const [pendingCountRes, verifiedCountRes, rejectedCountRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(lineMessages).where(eq(lineMessages.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(lineMessages).where(inArray(lineMessages.status, ["verified_auto", "processed"])),
    db.select({ count: sql<number>`count(*)` }).from(lineMessages).where(eq(lineMessages.status, "rejected")),
  ]);

  const pendingCount = Number(pendingCountRes[0]?.count || 0);
  const verifiedCount = Number(verifiedCountRes[0]?.count || 0);
  const rejectedCount = Number(rejectedCountRes[0]?.count || 0);

  // Fetch only the data for the active tab
  let slips: any[] = [];
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
  } else if (tab === 'verified') {
    slips = await db
      .select()
      .from(lineMessages)
      .where(inArray(lineMessages.status, ["verified_auto", "processed"]))
      .orderBy(desc(lineMessages.createdAt))
      .limit(limit)
      .offset(offset);
    totalForTab = verifiedCount;
  } else {
    slips = await db
      .select()
      .from(lineMessages)
      .where(eq(lineMessages.status, "rejected"))
      .orderBy(desc(lineMessages.createdAt))
      .limit(limit)
      .offset(offset);
    totalForTab = rejectedCount;
  }

  // Pre-calculate smart match suggestions for pending slips
  const enrichedSlips = await Promise.all(
    slips.map(async (slip) => {
      if (tab === 'pending') {
        const suggestion = await getSmartSuggestion({
          lineUserId: slip.lineUserId,
          senderName: slip.senderName,
          houseNumber: slip.houseNumber,
          amount: slip.amount,
        });
        return {
          ...slip,
          smartMatch: suggestion.matchedHouse ? {
            house: suggestion.matchedHouse,
            reason: suggestion.matchReason,
          } : null,
        };
      }
      return slip;
    })
  );

  const totalPages = Math.ceil(totalForTab / limit);

  return (
    <div className="font-sans">
      <LineSlipsClient 
        slips={enrichedSlips} 
        activeTab={tab}
        currentPage={page}
        totalPages={totalPages}
        limit={limit}
        pendingCount={pendingCount}
        verifiedCount={verifiedCount}
        rejectedCount={rejectedCount}
      />
    </div>
  );
}
