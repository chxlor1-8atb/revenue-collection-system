import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { desc } from "drizzle-orm";
import HousesClient from "./HousesClient";
import GenerateInvoiceButton from "./GenerateInvoiceButton";

export default async function HousesPage() {
  const allHouses = await db.select().from(houses).orderBy(desc(houses.createdAt));

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6 flex justify-end">
        <GenerateInvoiceButton />
      </div>
      <HousesClient initialHouses={allHouses} />
    </div>
  );
}
