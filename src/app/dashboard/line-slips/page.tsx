import { db } from "@/lib/db";
import { lineMessages } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import LineSlipsClient from "./LineSlipsClient";

export const dynamic = "force-dynamic";

export default async function LineSlipsPage() {
  const pendingSlips = await db
    .select()
    .from(lineMessages)
    .where(eq(lineMessages.status, "pending"))
    .orderBy(desc(lineMessages.createdAt));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold font-serif mb-6 text-slate-800">
        สลิปจาก LINE (รอดำเนินการ)
      </h1>

      <LineSlipsClient pendingSlips={pendingSlips} />
    </div>
  );
}
