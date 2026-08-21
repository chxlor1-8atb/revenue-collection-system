import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("pg_trgm extension enabled successfully!");
  } catch (error) {
    console.error("Error enabling pg_trgm:", error);
  }
  process.exit(0);
}

main();
