import 'dotenv/config';
import { db } from '../src/lib/db';
import { invoices } from '../src/lib/schema';
async function main() {
  const invs = await db.select().from(invoices);
  console.log(invs.map(i => ({id: i.id, status: i.status})));
  process.exit(0);
}
main();
