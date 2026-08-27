import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, systemSettings, houses } from "@/lib/schema";
import { inArray, eq, and, lt, isNull, desc } from "drizzle-orm";
import { generateIdempotencyKey, acquireInFlightLock, releaseInFlightLock } from "@/lib/idempotency";

export async function POST(request: Request) {
  let idempotencyKey: string | null = null;

  try {
    const { invoiceIds, advanceMonths = 0, houseId } = await request.json();

    if ((!invoiceIds || invoiceIds.length === 0) && advanceMonths === 0) {
      return NextResponse.json({ error: "No invoices provided" }, { status: 400 });
    }

    if (advanceMonths > 0 && !houseId) {
      return NextResponse.json({ error: "houseId is required for advance payments" }, { status: 400 });
    }

    // 1. Concurrency / Idempotency protection against rapid duplicate bursts
    idempotencyKey = generateIdempotencyKey("intent", houseId, advanceMonths, ...(invoiceIds || []));
    const lockAcquired = await acquireInFlightLock(idempotencyKey, 6); // 6 seconds lock
    if (!lockAcquired) {
      return NextResponse.json(
        { error: "กำลังประมวลผลการสร้าง QR Code กรุณารอสักครู่..." },
        { status: 429 }
      );
    }

    // 2. Auto-cleanup: Clear old stuck transactions (> 5 mins)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 5);

    try {
      const expiredTxs = await db.select().from(transactions).where(
        and(
          eq(transactions.slipStatus, 'waiting_for_slip'),
          lt(transactions.createdAt, expiryTime)
        )
      );
      
      const expiredIds = expiredTxs.map(t => t.id);
      if (expiredIds.length > 0) {
        await db.delete(invoices).where(
          and(
            inArray(invoices.transactionId, expiredIds),
            eq(invoices.status, 'pending_advance')
          )
        );

        await db.update(invoices)
          .set({ transactionId: null })
          .where(inArray(invoices.transactionId, expiredIds));
        
        await db.delete(transactions)
          .where(inArray(transactions.id, expiredIds));
      }
    } catch (cleanupError) {
      console.error("Cleanup Error:", cleanupError);
    }

    // 3. Clean up any existing waiting_for_slip transactions for this house to prevent duplicates
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
        await db.delete(invoices).where(
          and(
            inArray(invoices.transactionId, activeTxIds),
            eq(invoices.status, 'pending_advance')
          )
        );

        await db.update(invoices)
          .set({ transactionId: null })
          .where(inArray(invoices.transactionId, activeTxIds));
          
        await db.delete(transactions)
          .where(inArray(transactions.id, activeTxIds));
      }
    }

    // 4. Get invoices if any selected
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
    const advanceInvoicesToInsert: any[] = [];
    if (advanceMonths > 0) {
      const allHouseInvoices = await db.select().from(invoices).where(eq(invoices.houseId, houseId)).orderBy(desc(invoices.monthYear)).limit(1);
      
      let year: number;
      let month: number;
      if (allHouseInvoices.length > 0) {
        const parts = allHouseInvoices[0].monthYear.split('-');
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
      } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth();
        if (month === 0) {
          month = 12;
          year--;
        }
      }

      let billingAmount = 20; // Default 20 THB
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

    // Fetch house info for real-time broadcast
    let houseNumber = "-";
    let ownerName = "-";
    if (houseId) {
      const h = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
      if (h.length > 0) {
        houseNumber = h[0].houseNumber;
        ownerName = h[0].ownerName;
      }
    } else if (targetInvoices.length > 0) {
      const h = await db.select().from(houses).where(eq(houses.id, targetInvoices[0].houseId)).limit(1);
      if (h.length > 0) {
        houseNumber = h[0].houseNumber;
        ownerName = h[0].ownerName;
      }
    }

    let transactionId = 0;

    // 5. Create transaction and link invoices
    const [newTx] = await db.insert(transactions).values({
      amount: finalAmount.toString(),
      slipImageUrl: '',
      slipStatus: 'waiting_for_slip',
    }).returning();

    transactionId = newTx.id;

    if (invoiceIds && invoiceIds.length > 0) {
      const updatedInvoices = await db.update(invoices)
        .set({ transactionId: transactionId })
        .where(
          and(
            inArray(invoices.id, invoiceIds),
            isNull(invoices.transactionId)
          )
        )
        .returning({ id: invoices.id });

      if (updatedInvoices.length !== invoiceIds.length) {
        // Rollback transaction if race condition
        await db.delete(transactions).where(eq(transactions.id, transactionId));
        return NextResponse.json({ error: "บิลถูกล็อกหรือกำลังมีผู้ทำรายการ กรุณาลองใหม่อีกครั้ง" }, { status: 409 });
      }
    }

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

  } catch (error: any) {
    console.error("Intent creation error:", error);
    if (error?.message?.includes("locked by another request")) {
      return NextResponse.json({ error: "บิลถูกล็อกหรือกำลังมีผู้ทำรายการ กรุณาลองใหม่อีกครั้ง" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (idempotencyKey) {
      await releaseInFlightLock(idempotencyKey);
    }
  }
}
