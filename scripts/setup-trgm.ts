import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Setting up pg_trgm extension...");
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
    console.log("pg_trgm extension enabled successfully.");
  } catch (err: any) {
    console.error("Error setting up pg_trgm:", err.message);
  }
  process.exit(0);
}

main();
