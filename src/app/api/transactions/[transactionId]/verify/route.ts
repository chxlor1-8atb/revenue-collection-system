import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, invoices, houses } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { verifySlipWithBuffer } from "@/lib/slip2go";
import { put } from "@vercel/blob";

export async function POST(req: Request, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const transactionId = parseInt((await params).transactionId, 10);
    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Verify with Slip2Go
    const verification = await verifySlipWithBuffer(buffer);

    if (!verification.success) {
      return NextResponse.json({ 
        error: verification.error || "สลิปไม่ถูกต้อง",
        code: verification.errorCode 
      }, { status: 400 });
    }

    const transRef = verification.data?.transRef;
    const slipAmount = verification.data?.amount;

    if (!transRef || !slipAmount) {
      return NextResponse.json({ error: "ไม่สามารถอ่านยอดเงินหรือรหัสอ้างอิงจากสลิปได้" }, { status: 400 });
    }

    // 2. Check for duplicate slip
    const existingTx = await db.select().from(transactions).where(eq(transactions.slipRefId, transRef)).limit(1);
    if (existingTx.length > 0) {
      return NextResponse.json({ error: "สลิปนี้เคยถูกใช้งานไปแล้ว" }, { status: 400 });
    }

    // 3. Find the pending transaction
    const txResult = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
    if (txResult.length === 0) {
      return NextResponse.json({ error: "ไม่พบรายการชำระเงิน" }, { status: 404 });
    }
    const tx = txResult[0];

    if (tx.slipStatus === "verified") {
      return NextResponse.json({ error: "รายการนี้ได้รับการชำระเงินเรียบร้อยแล้ว" }, { status: 400 });
    }

    // 4. Verify Amount match
    if (Math.abs(parseFloat(tx.amount || "0") - slipAmount) >= 0.01) {
      return NextResponse.json({ error: `ยอดเงินในสลิป (${slipAmount} บาท) ไม่ตรงกับยอดที่ต้องชำระ (${tx.amount} บาท)` }, { status: 400 });
    }

    // 5. Upload image to Vercel Blob
    let blobUrl = "";
    try {
      const blob = await put(`line-slips/${Date.now()}-web-${transactionId}.jpg`, buffer, {
        access: 'public',
        addRandomSuffix: false
      });
      blobUrl = blob.url;
    } catch (error) {
      console.error("Failed to upload to Vercel Blob:", error);
      // Fallback if blob fails
    }

    // 6. Update Transaction & Invoices
    await db.update(transactions).set({
      slipStatus: "verified",
      slipRefId: transRef,
      slipImageUrl: blobUrl,
      amountClaimedByPayer: slipAmount.toString(),
      paidAt: new Date(),
      verifiedBy: "web_auto"
    }).where(eq(transactions.id, transactionId));

    // Update related invoices
    const relatedInvoices = await db.select().from(invoices).where(eq(invoices.transactionId, transactionId));
    if (relatedInvoices.length > 0) {
      await db.update(invoices).set({ status: 'paid' }).where(eq(invoices.transactionId, transactionId));
    }

    return NextResponse.json({ success: true, message: "ชำระเงินสำเร็จ" });
  } catch (error) {
    console.error("Web Verification Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
