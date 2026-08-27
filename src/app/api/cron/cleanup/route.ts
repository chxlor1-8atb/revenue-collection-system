import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices } from "@/lib/schema";
import { eq, and, lt, inArray } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Check authorization (e.g. from Vercel Cron or secret key)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const url = new URL(request.url);
    const queryKey = url.searchParams.get('key');
    if (queryKey !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Find all 'waiting_for_slip' transactions older than 15 minutes
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 15);

    const expiredTxs = await db.select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          lt(transactions.createdAt, expiryTime)
        )
      );

    if (expiredTxs.length === 0) {
      return NextResponse.json({ success: true, message: "No expired transactions found." });
    }

    const txIds = expiredTxs.map(tx => tx.id);

    // Unlink invoices
    await db.update(invoices)
      .set({ status: 'unpaid', transactionId: null })
      .where(
        and(
          inArray(invoices.transactionId, txIds),
          eq(invoices.status, 'pending')
        )
      );

    // Delete any advance invoices tied to these expired transactions
    await db.delete(invoices)
      .where(
        and(
          inArray(invoices.transactionId, txIds),
          eq(invoices.status, 'pending_advance')
        )
      );

    // Mark transactions as expired
    await db.update(transactions)
      .set({ slipStatus: 'expired' })
      .where(inArray(transactions.id, txIds));

    // --- NEW: Vercel Blob Cleanup (90 days / 3 months) ---
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldTxs = await db.select({ id: transactions.id, slipImageUrl: transactions.slipImageUrl })
      .from(transactions)
      .where(
        and(
          lt(transactions.createdAt, ninetyDaysAgo),
          // We only delete if it's a Vercel Blob URL to avoid breaking external links
          // Vercel Blob URLs usually contain 'public.blob.vercel-storage.com'
          // but we can just assume any https:// link in slipImageUrl might be blob
          // Wait, Drizzle doesn't have a simple 'like' in the import above. Let's just fetch and filter in JS if needed.
        )
      );

    let deletedBlobCount = 0;
    
    // We will dynamically import 'del' so we don't crash if SDK is missing
    const { del } = await import('@vercel/blob');

    const urlsToDelete: string[] = [];
    const oldTxIdsToUpdate: number[] = [];

    for (const tx of oldTxs) {
      if (tx.slipImageUrl && tx.slipImageUrl.includes('vercel-storage.com')) {
        urlsToDelete.push(tx.slipImageUrl);
        oldTxIdsToUpdate.push(tx.id);
      }
    }

    if (urlsToDelete.length > 0) {
      // Delete from Vercel Blob (up to 500 at a time is fine, we'll just chunk it or do it all if small)
      try {
        await del(urlsToDelete);
        deletedBlobCount = urlsToDelete.length;
        
        // Update DB to remove the image URLs so it doesn't show broken images
        await db.update(transactions)
          .set({ slipImageUrl: "DELETED_BY_RETENTION_POLICY" })
          .where(inArray(transactions.id, oldTxIdsToUpdate));
          
      } catch (e) {
        console.error("Failed to delete blobs:", e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      expiredTransactions: txIds.length,
      deletedOldBlobs: deletedBlobCount,
      message: `Expired ${txIds.length} transactions. Deleted ${deletedBlobCount} old slip images.` 
    });

  } catch (error) {
    console.error("Cleanup Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
