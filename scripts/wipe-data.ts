import 'dotenv/config';
import { db } from "../src/lib/db";
import { transactions, invoices, lineMessages, systemSettings } from "../src/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { redis } from "../src/lib/redis";

async function main() {
  console.log("🧹 Starting database cleanup for clean testing...");

  try {
    // 1. Delete all LINE messages (conversation history & slip uploads)
    console.log("Deleting LINE messages...");
    await db.delete(lineMessages);

    // 2. Delete "pending_advance" invoices (created during advance payment tests)
    console.log("Deleting advance payment invoices...");
    await db.delete(invoices).where(eq(invoices.status, 'pending_advance'));

    // 3. Reset all other invoices back to unpaid
    console.log("Resetting invoices to unpaid...");
    await db.update(invoices).set({
      status: 'unpaid',
      transactionId: null,
      amountPaid: '0'
    });

    // 4. Delete all transactions
    console.log("Deleting all transactions...");
    await db.delete(transactions);

    // 5. Reset receipt series in systemSettings
    console.log("Resetting receipt series...");
    await db.update(systemSettings).set({
      receiptBookConfig: { itemsPerBook: 50, currentBook: 1, fiscalYear: "2569" }
    });

    // 6. Clear Redis Caches
    console.log("Clearing Redis caches...");
    if (redis) {
      await redis.flushdb(); // Safely flush the current database
      console.log("Redis flushed.");
    }

    console.log("✅ Database wiped successfully. Ready for clean testing!");
  } catch (error) {
    console.error("❌ Error wiping database:", error);
  }
  
  process.exit(0);
}

main();
