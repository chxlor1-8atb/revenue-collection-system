import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './src/lib/schema';
import { not } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function resetDb() {
  console.log('Clearing database...');
  
  // 1. Line Messages
  await db.delete(schema.lineMessages);
  console.log('Cleared line messages');

  // 2. Unlink invoices from transactions
  await db.update(schema.invoices).set({ transactionId: null });
  
  // 3. Transactions
  await db.delete(schema.transactions);
  console.log('Cleared transactions');

  // 4. Invoices
  await db.delete(schema.invoices);
  console.log('Cleared invoices');

  // 5. Houses
  await db.delete(schema.houses);
  console.log('Cleared houses');

  // 6. QR Codes
  await db.delete(schema.qrCodes);
  console.log('Cleared QR codes');

  console.log('Database successfully reset for production use. Kept admin users and main settings intact.');
  process.exit(0);
}
resetDb();
