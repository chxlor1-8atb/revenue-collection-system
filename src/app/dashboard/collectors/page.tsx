import { db } from "@/lib/db";
import { collectors } from "@/lib/schema";
import { desc } from "drizzle-orm";
import CollectorsClient from "./CollectorsClient";

export default async function CollectorsPage() {
  const data = await db.select().from(collectors).orderBy(desc(collectors.createdAt));

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <CollectorsClient initialCollectors={data} />
    </div>
  );
}
