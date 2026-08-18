import { NextResponse } from "next/server";
import { replyMessage, getMessageContent, replyWithMessages, generateBillFlexMessage, generateReceiptFlexMessage } from "@/lib/line";
import { db } from "@/lib/db";
import { lineMessages, houses, invoices, transactions } from "@/lib/schema";
import { eq, and, desc, gte, inArray } from "drizzle-orm";
import { put } from "@vercel/blob";
import { verifySlipWithBuffer } from "@/lib/slip2go";

import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    const signature = request.headers.get('x-line-signature');
    
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
    const hash = crypto.createHmac('sha256', channelSecret).update(textBody).digest('base64');
    
    if (hash !== signature) {
      console.error("Invalid LINE signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(textBody);
    
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

          // Idempotency check
          const existingMsg = await db.select().from(lineMessages).where(eq(lineMessages.lineMessageId, event.message.id)).limit(1);
          if (existingMsg.length > 0) {
            console.log(`[Webhook] Message ${event.message.id} already processed, skipping.`);
            continue;
          }

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
                lineMessageId: event.message.id,
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

          const transRef = verification.data?.transRef;
          
          // Dedup: Check if this transfer reference has already been processed
          if (transRef) {
            const existingRefTx = await db.select({ id: transactions.id })
              .from(transactions)
              .where(eq(transactions.slipRefId, transRef))
              .limit(1);
            
            if (existingRefTx.length > 0) {
              await replyMessage(replyToken, `สลิปนี้เคยถูกใช้ยืนยันการชำระเงินไปแล้วค่ะ ❌\nกรุณาส่งสลิปใหม่ที่ยังไม่เคยใช้นะคะ 🙏`);
              continue;
            }
          }
          
          // 3.5 Match waiting_for_slip transaction by amount (FIFO — oldest first)
          // Important: Only match if we have a valid non-zero amount to prevent matching null or "0"
          if (slipAmount && slipAmount !== "0" && slipAmount !== "0.00") {
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() - 5);

            // Match waiting transactions by whole amount (FIFO — oldest first)
            const waitingTx = await db.select()
              .from(transactions)
              .where(and(
                eq(transactions.amount, Math.floor(parseFloat(slipAmount)).toString()), 
                eq(transactions.slipStatus, 'waiting_for_slip'),
                gte(transactions.createdAt, expiryTime)
              ))
              .orderBy(transactions.createdAt)  // ASC: oldest first for FIFO matching
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
                  slipStatus: 'manual_review',
                  slipRefId: transRef || null,
                  payerNote: 'ยอดเงินเข้าจริง แต่ระบบหาบิลไม่พบ (Orphaned)'
                })
                .where(eq(transactions.id, tx.id));
                
              await db.insert(lineMessages).values({
                lineMessageId: event.message.id,
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

            // Amount matched — verify and link invoices
            const updateResult = await db.update(transactions)
              .set({ 
                slipImageUrl: blobUrl, 
                slipStatus: 'verified', 
                slipRefId: transRef || null,
                paidAt: new Date(), 
                verifiedBy: 'line_bot',
                lockKey: null,
              })
              .where(and(eq(transactions.id, tx.id), eq(transactions.slipStatus, 'waiting_for_slip')))
              .returning();
              
            if (updateResult.length === 0) continue; // Race condition: already processed
            
            await db.update(invoices)
              .set({ status: 'paid' })
              .where(eq(invoices.transactionId, tx.id));
            
            await db.insert(lineMessages).values({
              lineMessageId: event.message.id,
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
            lineMessageId: event.message.id,
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

          // Idempotency check for text messages
          const existingMsg = await db.select().from(lineMessages).where(eq(lineMessages.lineMessageId, event.message.id)).limit(1);
          if (existingMsg.length > 0) continue;

          // Save text message to lineMessages to prevent duplicate processing if retried
          await db.insert(lineMessages).values({
            lineMessageId: event.message.id,
            lineUserId: userId,
            type: "text",
            status: "processed"
          });

          // PULL SYSTEM LOGIC
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
          
          if (text === "เช็คบิล" || text === "บิล") {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "คุณยังไม่ได้ผูกบัญชีบ้านค่ะ\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) ส่งเข้ามาในแชทเพื่อผูกบัญชีก่อนนะคะ 🙏");
              continue;
            }
            const house = houseList[0];
            const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
            
            if (unpaidInvoices.length === 0) {
              await replyMessage(replyToken, `บ้านเลขที่ ${house.houseNumber} ไม่มีบิลค้างชำระค่ะ ✅\nขอบคุณที่ใช้บริการ 💚`);
              continue;
            }
            
            const totalAmount = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            let monthStr = "";
            if (unpaidInvoices.length === 1) {
              const [y, m] = unpaidInvoices[0].monthYear.split("-");
              monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
            } else {
              monthStr = `${unpaidInvoices.length} เดือนค้างชำระ`;
            }
            
            const payUrl = `${appUrl}/house/${house.id}`;
            const flexMsg = generateBillFlexMessage(house.houseNumber, monthStr, totalAmount, payUrl);
            await replyWithMessages(replyToken, [flexMsg]);
            continue;
          }

          if (text === "ใบเสร็จ") {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "คุณยังไม่ได้ผูกบัญชีบ้านค่ะ\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) ส่งเข้ามาในแชทเพื่อผูกบัญชีก่อนนะคะ 🙏");
              continue;
            }
            const house = houseList[0];
            
            // Find latest verified transaction with invoices for this house
            const houseInvoices = await db.select().from(invoices).where(eq(invoices.houseId, house.id));
            const txIds = houseInvoices.map(inv => inv.transactionId).filter(Boolean) as number[];
            
            if (txIds.length === 0) {
              await replyMessage(replyToken, `ยังไม่มีประวัติการรับชำระเงินสำหรับบ้านเลขที่ ${house.houseNumber} ค่ะ`);
              continue;
            }
            
            const latestTx = await db.select().from(transactions)
              .where(and(
                 inArray(transactions.id, txIds),
                 eq(transactions.slipStatus, 'verified')
              ))
              .orderBy(desc(transactions.paidAt))
              .limit(1);
              
            if (latestTx.length === 0) {
              await replyMessage(replyToken, `ยังไม่มีประวัติการรับชำระเงินสำหรับบ้านเลขที่ ${house.houseNumber} ค่ะ`);
              continue;
            }
            
            const tx = latestTx[0];
            const txInvoices = await db.select().from(invoices).where(eq(invoices.transactionId, tx.id));
            
            let monthStr = "";
            if (txInvoices.length === 1) {
              const [y, m] = txInvoices[0].monthYear.split("-");
              monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
            } else {
              monthStr = `${txInvoices.length} รายการ`;
            }
            
            const receiptUrl = `${appUrl}/house/${house.id}`;
            const flexMsg = generateReceiptFlexMessage(house.houseNumber, monthStr, parseFloat(tx.amount || "0"), receiptUrl);
            await replyWithMessages(replyToken, [flexMsg]);
            continue;
          }

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
              // Link lineUserId to the house
              await db.update(houses).set({ lineUserId: userId }).where(eq(houses.id, house.id));

              // Find unpaid invoices for this house
              const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
              const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
              
              if (totalDebt > 0 && slipData.amount && Math.abs(parseFloat(slipData.amount) - totalDebt) < 0.01) {
                // Perfect match! Auto-approve
                  const newTx = await db.insert(transactions).values({
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
              }
            } else if (houseResult.length > 1) {
              await replyMessage(replyToken, `พบบ้านเลขที่ ${text} ซ้ำกันหลายรายการในระบบ\nเจ้าหน้าที่จะทำการตรวจสอบข้อมูลและอัปเดตยอดให้ภายใน 24 ชั่วโมงค่ะ 💚`);
              return NextResponse.json({ status: "ok" });
            }

            // If not auto-approved and not duplicate (or other reason)
            await replyMessage(replyToken, `ขอบคุณค่ะ! ระบบได้บันทึกสลิปสำหรับบ้านเลขที่ ${text} แล้ว\n\nเจ้าหน้าที่จะทำการตรวจสอบและอัปเดตยอดในระบบให้ภายใน 24 ชั่วโมงค่ะ 💚`);
          } else {
            // User sent text without a prior pending image
            // Maybe they are trying to link their account
            const houseResult = await db.select().from(houses).where(eq(houses.houseNumber, text));
            if (houseResult.length === 1) {
              await db.update(houses).set({ lineUserId: userId }).where(eq(houses.id, houseResult[0].id));
              await replyMessage(replyToken, `✅ ผูกบัญชีกับบ้านเลขที่ ${text} สำเร็จแล้ว!\nคุณสามารถพิมพ์ "เช็คบิล" เพื่อดูยอด หรือ "ใบเสร็จ" เพื่อดูประวัติการจ่ายเงินได้เลยค่ะ 💚`);
            } else {
              await replyMessage(replyToken, "หากต้องการชำระเงิน กรุณาส่งรูป 'สลิปการโอนเงิน' เข้ามาในแชทก่อน แล้วค่อยพิมพ์บ้านเลขที่ตามนะคะ 🙏\n\nหรือหากต้องการเช็คยอด พิมพ์คำว่า 'เช็คบิล' ได้เลยค่ะ");
            }
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
