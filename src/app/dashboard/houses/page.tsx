import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { desc, asc, ilike, or, sql } from "drizzle-orm";
import HousesClient from "./HousesClient";
import GenerateInvoiceButton from "./GenerateInvoiceButton";

export default async function HousesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'createdAt';
  const dir = typeof searchParams.dir === 'string' ? searchParams.dir : 'desc';

  let whereClause = undefined;
  if (q) {
    whereClause = or(
      ilike(houses.houseNumber, `%${q}%`),
      ilike(houses.ownerName, `%${q}%`)
    );
  }

  let orderByClause;
  if (sort === 'houseNumber') {
    orderByClause = dir === 'asc' ? asc(houses.houseNumber) : desc(houses.houseNumber);
  } else if (sort === 'ownerName') {
    orderByClause = dir === 'asc' ? asc(houses.ownerName) : desc(houses.ownerName);
  } else {
    orderByClause = dir === 'asc' ? asc(houses.createdAt) : desc(houses.createdAt);
  }

  const [data, countResult] = await Promise.all([
    db.select().from(houses).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(houses).where(whereClause)
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6 flex justify-end">
        <GenerateInvoiceButton />
      </div>
      <HousesClient 
        initialHouses={data} 
        currentPage={page} 
        totalPages={totalPages} 
        totalHouses={total} 
        initialSearch={q}
        initialSort={{ key: sort, dir }}
      />
    </div>
  );
}
