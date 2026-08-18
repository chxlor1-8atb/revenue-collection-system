import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, systemSettings, houses } from "@/lib/schema";
import { inArray, eq, and, lt, isNull, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { invoiceIds, advanceMonths = 0, houseId } = await request.json();

    if ((!invoiceIds || invoiceIds.length === 0) && advanceMonths === 0) {
      return NextResponse.json({ error: "No invoices provided" }, { status: 400 });
    }

    if (advanceMonths > 0 && !houseId) {
      return NextResponse.json({ error: "houseId is required for advance payments" }, { status: 400 });
    }

    // 0. Auto-cleanup: Clear old stuck transactions
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 5); // 5 minutes grace period for cleanup

    try {
      // Find expired waiting_for_slip transactions
      const expiredTxs = await db.select().from(transactions).where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          lt(transactions.createdAt, expiryTime)
        )
      );
      
      const expiredIds = expiredTxs.map(t => t.id);
      if (expiredIds.length > 0) {
        // First delete any pending_advance invoices linked to these expired transactions
        await db.delete(invoices).where(
          and(
            inArray(invoices.transactionId, expiredIds),
            eq(invoices.status, 'pending_advance')
          )
        );

        // Unlink regular invoices
        await db.update(invoices)
          .set({ transactionId: null })
          .where(inArray(invoices.transactionId, expiredIds));
        
        // Delete the transactions
        await db.delete(transactions)
          .where(inArray(transactions.id, expiredIds));
      }
    } catch (cleanupError) {
      console.error("Cleanup Error:", cleanupError);
      // Ignore cleanup error, proceed with intent creation
    }

    // Clean up any existing waiting_for_slip transactions for this house to prevent duplicates
    if (houseId) {
      const activeTxs = await db.select({ 
        txId: transactions.id 
      })
      .from(transactions)
      .innerJoin(invoices, eq(invoices.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          eq(invoices.houseId, houseId)
        )
      );

      const activeTxIds = [...new Set(activeTxs.map(t => t.txId))];
      if (activeTxIds.length > 0) {
        // Delete pending advance invoices for these transactions
        await db.delete(invoices).where(
          and(
            inArray(invoices.transactionId, activeTxIds),
            eq(invoices.status, 'pending_advance')
          )
        );

        // Unlink regular invoices
        await db.update(invoices)
          .set({ transactionId: null })
          .where(inArray(invoices.transactionId, activeTxIds));
          
        // Delete the old intent transactions
        await db.delete(transactions)
          .where(inArray(transactions.id, activeTxIds));
      }
    }

    // Get invoices if any selected
    let targetInvoices: any[] = [];
    if (invoiceIds && invoiceIds.length > 0) {
      targetInvoices = await db.select().from(invoices).where(inArray(invoices.id, invoiceIds));
      if (targetInvoices.length !== invoiceIds.length) {
        return NextResponse.json({ error: "Some invoices not found" }, { status: 404 });
      }
    }

    // Calculate base amount from selected invoices
    let finalAmount = targetInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    // Prepare advance invoices if needed
    const advanceInvoicesToInsert = [];
    if (advanceMonths > 0) {
      // Find latest invoice for this house to determine the next month
      const allHouseInvoices = await db.select().from(invoices).where(eq(invoices.houseId, houseId)).orderBy(desc(invoices.monthYear)).limit(1);
      
      let year, month;
      if (allHouseInvoices.length > 0) {
        const parts = allHouseInvoices[0].monthYear.split('-');
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
      } else {
        // If no invoices exist, treat 'last month' as the month before current,
        // so that the first advance month generated is the current month.
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth(); // 0-11, so if current is August (7), this sets month=7.
        if (month === 0) { // If current is January (0)
          month = 12;
          year--;
        }
      }

      // Find billing amount
      let billingAmount = 100;
      const houseRecord = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
      if (houseRecord.length > 0 && houseRecord[0].defaultBillingAmount) {
        billingAmount = parseFloat(houseRecord[0].defaultBillingAmount);
      } else if (allHouseInvoices.length > 0) {
        billingAmount = parseFloat(allHouseInvoices[0].amount);
      }

      for (let i = 0; i < advanceMonths; i++) {
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
        const nextMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        advanceInvoicesToInsert.push({
          houseId: houseId,
          monthYear: nextMonthStr,
          amount: billingAmount.toString(),
          status: 'pending_advance'
        });
        finalAmount += billingAmount;
      }
    }

    // Get system settings to verify setup
    const settings = await db.select().from(systemSettings).limit(1);
    if (settings.length === 0 || !settings[0].promptPayId) {
      return NextResponse.json({ error: "System PromptPay is not configured. Please contact admin." }, { status: 400 });
    }

    // Create transaction with the exact final amount
    const [newTx] = await db.insert(transactions).values({
      amount: finalAmount.toString(),
      slipImageUrl: '',
      slipStatus: 'waiting_for_slip',
    }).returning();

    const transactionId = newTx.id;

    // Link regular invoices to this transaction
    if (invoiceIds && invoiceIds.length > 0) {
      const updatedInvoices = await db.update(invoices)
        .set({ transactionId: transactionId })
        .where(
          and(
            inArray(invoices.id, invoiceIds),
            isNull(invoices.transactionId) // Ensure they weren't locked by a racing request
          )
        )
        .returning({ id: invoices.id });

      if (updatedInvoices.length !== invoiceIds.length) {
        // Race condition detected! Another request grabbed these invoices.
        // Rollback the transaction we just created
        await db.delete(transactions).where(eq(transactions.id, transactionId));
        return NextResponse.json({ error: "Invoices were locked by another request. Please try again." }, { status: 409 });
      }
    }

    // Insert advance invoices linked to this transaction
    if (advanceInvoicesToInsert.length > 0) {
      const advanceInvoicesWithTx = advanceInvoicesToInsert.map(inv => ({
        ...inv,
        transactionId: transactionId
      }));
      await db.insert(invoices).values(advanceInvoicesWithTx);
    }

    return NextResponse.json({ 
      transactionId, 
      amount: finalAmount 
    });

  } catch (error) {
    console.error("Intent Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
