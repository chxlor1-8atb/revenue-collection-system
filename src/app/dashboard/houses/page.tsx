import { db } from "@/lib/db";
import { houses, systemSettings } from "@/lib/schema";
import { desc, asc, ilike, or, sql } from "drizzle-orm";
import HousesClient from "./HousesClient";

export default async function HousesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
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

  const [data, countResult, settingsData] = await Promise.all([
    db.select().from(houses).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(houses).where(whereClause),
    db.select({ houseCustomFieldsSchema: systemSettings.houseCustomFieldsSchema }).from(systemSettings).limit(1)
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);
  let customFieldsSchema = (settingsData[0]?.houseCustomFieldsSchema as any[]) || [];
  
  // Fallback to default schema if empty or not set in DB
  if (customFieldsSchema.length === 0) {
    customFieldsSchema = [
      { id: "houseNumber", name: "บ้านเลขที่", placeholder: "เช่น 123/45", type: "text", required: true, isSystem: true, isHidden: false },
      { id: "ownerName", name: "ชื่อเจ้าบ้าน / ผู้รับผิดชอบ", placeholder: "เช่น สมศรี ใจดี", type: "text", required: true, isSystem: true, isHidden: false },
      { id: "zone", name: "ชุมชน / หมู่ (ตัวเลือก)", placeholder: "เช่น หมู่ 1 ซอย 5", type: "text", required: false, isSystem: true, isHidden: false },
      { id: "road", name: "ถนน (ตัวเลือก)", placeholder: "เช่น ถนนสุขุมวิท", type: "text", required: false, isSystem: true, isHidden: false },
    ];
  }

  return (
    <div className="pb-12 space-y-6">
      <HousesClient 
        initialHouses={data as any} 
        currentPage={page} 
        totalPages={totalPages} 
        totalHouses={total} 
        initialSearch={q}
        initialSort={{ key: sort, dir }}
        limit={limit}
        customFieldsSchema={customFieldsSchema}
      />
    </div>
  );
}
