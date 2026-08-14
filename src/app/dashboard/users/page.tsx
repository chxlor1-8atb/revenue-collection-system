import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { desc } from "drizzle-orm";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const data = await db.select({
    id: adminUsers.id,
    username: adminUsers.username,
    role: adminUsers.role,
    createdAt: adminUsers.createdAt,
  }).from(adminUsers).orderBy(desc(adminUsers.createdAt));

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <UsersClient initialUsers={data} />
    </div>
  );
}
