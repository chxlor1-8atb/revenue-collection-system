import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function apply() {
  try {
    console.log('Deleting duplicate invoices...');
    await sql`
      DELETE FROM invoices 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER(PARTITION BY house_id, month_year ORDER BY id DESC) as row_num 
          FROM invoices
        ) t 
        WHERE t.row_num > 1
      )
    `;
    console.log('Deleted duplicates.');
  } catch (e: any) {
    console.log('Error deleting duplicates:', e.message);
  }
  
  try {
    console.log('Creating unique index on invoices...');
    await sql`CREATE UNIQUE INDEX "unique_house_month" ON "invoices" USING btree ("house_id","month_year");`;
    console.log('Index created.');
  } catch (e: any) {
    console.log('unique index might already exist:', e.message);
  }
  
  console.log('Done!');
  process.exit(0);
}

apply();
