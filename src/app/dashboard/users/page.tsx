import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import UsersClient from "./UsersClient";

export default async function UsersPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db.select({
      id: adminUsers.id,
      username: adminUsers.username,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt))
    .limit(limit)
    .offset(offset),
    
    db.select({ count: sql<number>`count(*)` }).from(adminUsers)
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="pb-12">
      <UsersClient 
        initialUsers={data} 
        currentPage={page}
        totalPages={totalPages}
        totalUsers={total}

        limit={limit}
      />
    </div>
  );
}
