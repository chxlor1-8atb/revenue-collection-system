import { NextResponse } from "next/server";
import { replyMessage, getMessageContent } from "@/lib/line";
import { db } from "@/lib/db";
import { lineMessages, houses, invoices, transactions } from "@/lib/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { put } from "@vercel/blob";
import { verifySlipWithBase64 } from "@/lib/slip2go";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // LINE Webhook Verification check
    if (body.events.length === 0) {
      return NextResponse.json({ status: "ok" });
    }

    for (const event of body.events) {
      if (event.type === "message") {
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        if (event.message.type === "image") {
          // 1. Download image from LINE
          const imageBuffer = await getMessageContent(event.message.id);
          if (!imageBuffer) {
            await replyMessage(replyToken, "ขออภัยค่ะ ระบบไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาส่งใหม่อีกครั้งค่ะ");
            continue;
          }
          const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

          // 2. Upload to Vercel Blob
          const blob = await put(`line-slips/${Date.now()}-${event.message.id}.jpg`, imageBuffer, {
            access: "public",
            contentType: "image/jpeg",
          });

          // 3. Verify with Slip2Go
          const verification = await verifySlipWithBase64(base64Image);

          if (!verification.success) {
            await replyMessage(replyToken, `❌ สลิปไม่ถูกต้อง หรือไม่สามารถตรวจสอบได้ค่ะ\nรายละเอียด: ${verification.error}`);
            continue;
          }

          const slipAmount = verification.data?.amount.toString();

          // 3.5 Check if this exact amount matches any waiting_for_slip transaction within the last 3 minutes
          const expiryTime = new Date();
          expiryTime.setMinutes(expiryTime.getMinutes() - 3);

          const waitingTx = await db.select()
            .from(transactions)
            .where(and(
              eq(transactions.amount, slipAmount || "0"), 
              eq(transactions.slipStatus, 'waiting_for_slip'),
              gte(transactions.createdAt, expiryTime)
            ))
            .orderBy(desc(transactions.createdAt))
            .limit(1);

          if (waitingTx.length > 0) {
            const tx = waitingTx[0];
            // Perfect decimal match!
            await db.update(transactions)
              .set({ slipImageUrl: blob.url, slipStatus: 'verified', paidAt: new Date(), verifiedBy: 'line_bot' })
              .where(eq(transactions.id, tx.id));
            
            await db.update(invoices)
              .set({ status: 'paid' })
              .where(eq(invoices.transactionId, tx.id));
            
            await db.insert(lineMessages).values({
              lineUserId: userId,
              type: "image",
              imageUrl: blob.url,
              status: "verified_auto",
              amount: slipAmount,
              senderName: verification.data?.sender.name,
              isVerified: true,
              transactionId: tx.id
            });
            
            // Try to find house number for a better reply
            const txInvoices = await db.select().from(invoices).where(eq(invoices.transactionId, tx.id)).limit(1);
            let houseText = "";
            if (txInvoices.length > 0) {
               const house = await db.select().from(houses).where(eq(houses.id, txInvoices[0].houseId)).limit(1);
               if (house.length > 0) houseText = ` (บ้านเลขที่ ${house[0].houseNumber})`;
            }
            
            await replyMessage(replyToken, `ตรวจสอบสลิปสำเร็จ! ✅\nยอดเงิน: ${slipAmount} บาท\nระบบได้ทำการตัดยอดหนี้ให้เรียบร้อยแล้วค่ะ${houseText} ขอบคุณที่ใช้บริการ 💚`);
            continue;
          }

          // 4. Save to database (Normal fallback flow)
          await db.insert(lineMessages).values({
            lineUserId: userId,
            type: "image",
            imageUrl: blob.url,
            status: "pending",
            amount: slipAmount,
            senderName: verification.data?.sender.name,
            isVerified: true,
          });

          // 5. Reply asking for house number
          await replyMessage(replyToken, `ตรวจสอบสลิปสำเร็จ! ✅\nยอดเงิน: ${slipAmount} บาท\nผู้โอน: ${verification.data?.sender.name}\n\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) เพื่อให้ระบบตัดยอดหนี้อัตโนมัติค่ะ 🙏`);

        } else if (event.message.type === "text") {
          const text = event.message.text.trim();

          // 1. Find the most recent pending image from this user
          const recentImages = await db.select()
            .from(lineMessages)
            .where(and(
              eq(lineMessages.lineUserId, userId),
              eq(lineMessages.type, "image"),
              eq(lineMessages.status, "pending")
            ))
            .orderBy(desc(lineMessages.createdAt))
            .limit(1);

          if (recentImages.length > 0 && !recentImages[0].houseNumber) {
            const slipData = recentImages[0];
            
            // Link this text (house number) to the image
            await db.update(lineMessages)
              .set({ houseNumber: text })
              .where(eq(lineMessages.id, slipData.id));

            // Auto-Approve Logic
            const houseResult = await db.select().from(houses).where(eq(houses.houseNumber, text));
            
            if (houseResult.length === 1) {
              const house = houseResult[0];
              // Find unpaid invoices for this house
              const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
              const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
              
              if (totalDebt > 0 && slipData.amount && parseFloat(slipData.amount) === totalDebt) {
                // Perfect match! Auto-approve
                await db.update(lineMessages).set({ status: 'verified_auto' }).where(eq(lineMessages.id, slipData.id));
                await db.update(invoices).set({ status: 'paid' }).where(eq(invoices.houseId, house.id));
                
                await replyMessage(replyToken, `✅ ยืนยันข้อมูลสำเร็จ!\nระบบได้ตัดยอดหนี้ ${totalDebt} บาท สำหรับบ้านเลขที่ ${text} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚`);
                return NextResponse.json({ status: "ok" });
              }
            } else if (houseResult.length > 1) {
              await replyMessage(replyToken, `พบบ้านเลขที่ ${text} ซ้ำกันหลายรายการในระบบ\nเจ้าหน้าที่จะทำการตรวจสอบข้อมูลและอัปเดตยอดให้ภายใน 24 ชั่วโมงค่ะ 💚`);
              return NextResponse.json({ status: "ok" });
            }

            // If not auto-approved and not duplicate (or other reason)
            await replyMessage(replyToken, `ขอบคุณค่ะ! ระบบได้บันทึกสลิปสำหรับบ้านเลขที่ ${text} แล้ว\n\nเจ้าหน้าที่จะทำการตรวจสอบและอัปเดตยอดในระบบให้ภายใน 24 ชั่วโมงค่ะ 💚`);
          } else {
            // User sent text without a prior pending image
            await replyMessage(replyToken, "หากต้องการชำระเงิน กรุณาส่งรูป 'สลิปการโอนเงิน' เข้ามาในแชทก่อน แล้วค่อยพิมพ์บ้านเลขที่ตามนะคะ 🙏");
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("LINE Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
