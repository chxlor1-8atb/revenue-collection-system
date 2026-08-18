import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './src/lib/db';
import { lineMessages } from './src/lib/schema';
import { desc } from 'drizzle-orm';

db.select()
  .from(lineMessages)
  .orderBy(desc(lineMessages.createdAt))
  .limit(5)
  .then(res => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
