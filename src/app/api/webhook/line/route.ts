import { NextResponse } from "next/server";
import { replyMessage, getMessageContent } from "@/lib/line";
import { db } from "@/lib/db";
import { lineMessages, houses, invoices, transactions, qrCodes } from "@/lib/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { put } from "@vercel/blob";
import { verifySlipWithBuffer } from "@/lib/slip2go";

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
          console.log(`[Webhook] Image received – messageId: ${event.message.id}`);

          // 1. Download image from LINE
          const imageBuffer = await getMessageContent(event.message.id);
          if (!imageBuffer) {
            console.error("[Webhook] Failed to download image from LINE");
            await replyMessage(replyToken, "ขออภัยค่ะ ระบบไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาส่งใหม่อีกครั้งค่ะ");
            continue;
          }
          console.log(`[Webhook] Image downloaded – size: ${imageBuffer.length} bytes`);

          // 2. Upload to Vercel Blob (with error handling)
          let blobUrl = "";
          try {
            console.log("[Webhook] Uploading to Vercel Blob...");
            const blob = await put(`line-slips/${Date.now()}-${event.message.id}.jpg`, imageBuffer, {
              access: "public",
              contentType: "image/jpeg",
            });
            blobUrl = blob.url;
            console.log("[Webhook] Blob upload success:", blobUrl);
          } catch (blobError: any) {
            console.error("[Webhook] Blob upload FAILED:", blobError?.message || blobError);
            // Continue without blob URL – we still want to verify & save to DB
            blobUrl = `line://message/${event.message.id}`; // fallback reference
          }

          // 3. Verify with Slip2Go
          console.log("[Webhook] Sending to Slip2Go for verification...");
          const verification = await verifySlipWithBuffer(imageBuffer);
          console.log("[Webhook] Slip2Go result:", JSON.stringify(verification));

          if (!verification.success) {
            // Save the image to DB even if slip verification fails, for manual admin review
            try {
              await db.insert(lineMessages).values({
                lineUserId: userId,
                type: "image",
                imageUrl: blobUrl,
                status: "pending",
                isVerified: false,
              });
            } catch {}
            await replyMessage(replyToken, `❌ ตรวจสอบสลิปไม่ผ่านค่ะ\nรายละเอียด: ${verification.error}\n\nกรุณาตรวจสอบว่าส่งรูปสลิปที่ชัดเจนและครบถ้วนนะคะ 🙏`);
            continue;
          }


          const slipAmount = verification.data?.amount.toString();

          // 3.5 Check if this exact amount matches any waiting_for_slip transaction within the last 3 minutes
          // Important: Only match if we have a valid non-zero amount to prevent matching null or "0"
          if (slipAmount && slipAmount !== "0" && slipAmount !== "0.00") {
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() - 3);

            const waitingTx = await db.select()
              .from(transactions)
              .where(and(
                eq(transactions.amount, slipAmount), 
                eq(transactions.slipStatus, 'waiting_for_slip'),
                gte(transactions.createdAt, expiryTime)
              ))
              .orderBy(desc(transactions.createdAt))
              .limit(1);

            if (waitingTx.length > 0) {
              const tx = waitingTx[0];
            const txInvoices = await db.select().from(invoices).where(eq(invoices.transactionId, tx.id));
            
            if (txInvoices.length === 0) {
              // This is an orphaned transaction! The race condition rollback might have unlinked it, 
              // or it's a bug. Do NOT mark it as verified since no debt will be cleared.
              await db.update(transactions)
                .set({ 
                  slipImageUrl: blobUrl, 
                  slipStatus: 'manual_review', // Needs manual admin intervention
                  payerNote: 'ยอดเงินเข้าจริง แต่ระบบหาบิลไม่พบ (Orphaned)'
                })
                .where(eq(transactions.id, tx.id));
                
              await db.insert(lineMessages).values({
                lineUserId: userId,
                type: "image",
                imageUrl: blobUrl,
                status: "pending",
                amount: slipAmount,
                senderName: verification.data?.sender.name,
                isVerified: true,
                transactionId: tx.id
              });
              
              await replyMessage(replyToken, `ได้รับยอดเงิน ${slipAmount} บาท เรียบร้อยแล้วค่ะ ✅\nแต่ระบบเกิดขัดข้องไม่สามารถจับคู่บิลได้ (ไม่พบหนี้)\n\nกรุณาแจ้งแอดมินเพื่อตรวจสอบและตัดยอดให้แบบ Manual นะคะ 🙏`);
              continue;
            }

            // Perfect decimal match with invoices!
            await db.update(transactions)
              .set({ 
                slipImageUrl: blobUrl, 
                slipStatus: 'verified', 
                paidAt: new Date(), 
                verifiedBy: 'line_bot',
                lockKey: null // Free up the lockKey so others can use this amount
              })
              .where(eq(transactions.id, tx.id));
            
            await db.update(invoices)
              .set({ status: 'paid' })
              .where(eq(invoices.transactionId, tx.id));
            
            await db.insert(lineMessages).values({
              lineUserId: userId,
              type: "image",
              imageUrl: blobUrl,
              status: "verified_auto",
              amount: slipAmount,
              senderName: verification.data?.sender.name,
              isVerified: true,
              transactionId: tx.id
            });
            
            let houseText = "";
            if (txInvoices.length > 0) {
               const house = await db.select().from(houses).where(eq(houses.id, txInvoices[0].houseId)).limit(1);
               if (house.length > 0) houseText = ` (บ้านเลขที่ ${house[0].houseNumber})`;
            }
            
            await replyMessage(replyToken, `ตรวจสอบสลิปสำเร็จ! ✅\nยอดเงิน: ${slipAmount} บาท\nระบบได้ทำการตัดยอดหนี้ให้เรียบร้อยแล้วค่ะ${houseText} ขอบคุณที่ใช้บริการ 💚`);
            continue;
          }
        }
          
        // 4. Save to database (Normal fallback flow)
          await db.insert(lineMessages).values({
            lineUserId: userId,
            type: "image",
            imageUrl: blobUrl,
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
                // We need to create a transaction to record this in the ledger
                const defaultQr = await db.select().from(qrCodes).where(eq(qrCodes.active, true)).limit(1);
                if (defaultQr.length > 0) {
                  const newTx = await db.insert(transactions).values({
                    qrCodeId: defaultQr[0].id,
                    collectorId: defaultQr[0].collectorId,
                    amount: slipData.amount,
                    amountClaimedByPayer: slipData.amount,
                    slipImageUrl: slipData.imageUrl || "",
                    slipStatus: "verified",
                    paidAt: new Date(),
                    verifiedBy: "line_bot_auto",
                  }).returning();

                  await db.update(lineMessages).set({ status: 'verified_auto', transactionId: newTx[0].id }).where(eq(lineMessages.id, slipData.id));
                  await db.update(invoices).set({ status: 'paid', transactionId: newTx[0].id }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
                  
                  await replyMessage(replyToken, `✅ ยืนยันข้อมูลสำเร็จ!\nระบบได้ตัดยอดหนี้ ${totalDebt} บาท สำหรับบ้านเลขที่ ${text} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚`);
                  return NextResponse.json({ status: "ok" });
                } else {
                  // CRITICAL: Cannot create transaction without a QR code. Fallback to manual review.
                  await replyMessage(replyToken, `ขอบคุณค่ะ! ระบบได้บันทึกสลิปสำหรับบ้านเลขที่ ${text} แล้ว\n\nเจ้าหน้าที่จะทำการตรวจสอบและอัปเดตยอดในระบบให้ภายใน 24 ชั่วโมงค่ะ 💚`);
                  return NextResponse.json({ status: "ok" });
                }
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
