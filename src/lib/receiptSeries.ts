import { db } from "@/lib/db";
import { transactions, systemSettings } from "@/lib/schema";
import { sql, eq, desc } from "drizzle-orm";

export function getFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1; // 1-12
  const yearCE = date.getFullYear();
  // Thai Fiscal Year: Oct (10) starts the next BE fiscal year
  const fiscalYearBE = month >= 10 ? yearCE + 544 : yearCE + 543;
  return fiscalYearBE.toString();
}

export async function generateNextReceiptSeries(paidDate: Date = new Date()): Promise<{
  bookNumber: number;
  receiptNumber: number;
  fiscalYear: string;
  receiptCode: string;
}> {
  const fiscalYear = getFiscalYear(paidDate);

  // Get itemsPerBook from system settings
  const [settings] = await db.select().from(systemSettings).limit(1);
  const bookConfig = (settings?.receiptBookConfig as any) || {};
  const itemsPerBook = Number(bookConfig.itemsPerBook) || 50;

  // Count total verified transactions in this fiscal year
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.fiscalYear, fiscalYear));

  const totalInFiscalYear = Number(countRes[0]?.count || 0);
  const sequenceInFiscalYear = totalInFiscalYear + 1;

  const bookNumber = Math.floor((sequenceInFiscalYear - 1) / itemsPerBook) + 1;
  const receiptNumber = ((sequenceInFiscalYear - 1) % itemsPerBook) + 1;
  const receiptCode = `เล่มที่ ${String(bookNumber).padStart(2, "0")} เลขที่ ${String(receiptNumber).padStart(2, "0")}/${fiscalYear}`;

  return {
    bookNumber,
    receiptNumber,
    fiscalYear,
    receiptCode,
  };
}
