import { db } from "@/lib/db";
import { lineMessages } from "@/lib/schema";
import { desc, or, eq } from "drizzle-orm";
import LineSlipsClient from "./LineSlipsClient";

export const dynamic = "force-dynamic";

export default async function LineSlipsPage() {
  // Pending: needs manual review
  const pendingSlips = await db
    .select()
    .from(lineMessages)
    .where(eq(lineMessages.status, "pending"))
    .orderBy(desc(lineMessages.createdAt));

  // Verified auto: already processed automatically  
  const verifiedSlips = await db
    .select()
    .from(lineMessages)
    .where(eq(lineMessages.status, "verified_auto"))
    .orderBy(desc(lineMessages.createdAt))
    .limit(50);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold font-serif mb-6 text-slate-800">
        สลิปจาก LINE
      </h1>
      <LineSlipsClient pendingSlips={pendingSlips} verifiedSlips={verifiedSlips} />
    </div>
  );
}
