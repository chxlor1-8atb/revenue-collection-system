import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { inArray } from 'drizzle-orm';
import * as schema from './src/lib/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function clear() {
  console.log('Fetching transactions...');
  const txs = await db.select().from(schema.transactions).where(inArray(schema.transactions.slipStatus, ['waiting_for_slip', 'expired']));
  const ids = txs.map(t => t.id);
  if (ids.length > 0) {
    console.log('Unlinking invoices...');
    await db.update(schema.invoices).set({ transactionId: null }).where(inArray(schema.invoices.transactionId, ids));
    console.log('Deleting transactions...');
    await db.delete(schema.transactions).where(inArray(schema.transactions.id, ids));
    console.log('Deleted ' + ids.length + ' transactions.');
  } else {
    console.log('No stuck transactions found.');
  }
  process.exit(0);
}
clear();
