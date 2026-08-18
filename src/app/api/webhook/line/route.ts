import { NextResponse } from "next/server";
import { generateBillFlexMessage, generateSlipErrorFlexMessage, generateSlipVerificationSuccessFlexMessage, replyMessage, replyWithMessages, safeReplyOrPush, getMessageContent, generateReceiptFlexMessage, generateDuplicateHouseSelectionFlexMessage } from "@/lib/line";
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
                status: "rejected",
                isVerified: false,
              });
            } catch {}
            
            let title = "สลิปไม่ถูกต้อง";
            let subtitle = "กรุณาตรวจสอบว่าส่งรูปสลิปที่ชัดเจน";
            let color = "#ef4444"; // Red
            
            if (verification.errorCode === "duplicate") {
              title = "สลิปซ้ำ";
              subtitle = "โปรดตรวจสอบสลิป";
              color = "#f59e0b"; // Orange
            } else if (verification.errorCode === "invalid") {
              title = "บัญชีผู้รับไม่ถูกต้อง";
              subtitle = "โปรดตรวจสอบรูปสลิป หรือบัญชีผู้รับของท่าน";
              color = "#0ea5e9"; // Blue
            }
            
            const orig = verification.originalData || {};
            const senderName = orig.sender?.name || orig.senderName || orig.sender?.account?.name || orig.senderAccount;
            const senderAccount = orig.sender?.account?.number || orig.senderAccountNumber;
            const receiverName = orig.receiver?.name || orig.receiverName || orig.receiver?.account?.name || orig.receiverAccount;
            const receiverAccount = orig.receiver?.account?.number || orig.receiverAccountNumber;
            const transDate = orig.transDate || orig.transTime || orig.transTimestamp;
            
            const flexError = generateSlipErrorFlexMessage(
               title, 
               subtitle, 
               color, 
               orig.amount ? parseFloat(orig.amount) : undefined,
               senderName,
               senderAccount,
               receiverName,
               receiverAccount,
               transDate
            );
            
            await safeReplyOrPush(userId, replyToken, [flexError]);
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
              const orig: any = verification.data || {};
              const senderName = orig.sender?.name || orig.senderName || orig.sender?.account?.name || orig.senderAccount;
              const senderAccount = orig.sender?.account?.number || orig.senderAccountNumber;
              const receiverName = orig.receiver?.name || orig.receiverName || orig.receiver?.account?.name || orig.receiverAccount;
              const receiverAccount = orig.receiver?.account?.number || orig.receiverAccountNumber;
              const transDate = orig.transDate || orig.transTime || orig.transTimestamp;
              
              const flexError = generateSlipErrorFlexMessage(
                 "สลิปซ้ำ", 
                 "สลิปนี้เคยถูกใช้ยืนยันการชำระเงินไปแล้ว", 
                 "#f59e0b", // Orange
                 orig.amount ? parseFloat(orig.amount as any) : undefined,
                 senderName,
                 senderAccount,
                 receiverName,
                 receiverAccount,
                 transDate
              );
              await safeReplyOrPush(userId, replyToken, [
                flexError,
                { type: "text", text: "❌ ตรวจพบการใช้สลิปซ้ำ! สลิปนี้เคยถูกใช้ยืนยันการชำระเงินไปแล้วค่ะ" }
              ]);
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
              
              await safeReplyOrPush(userId, replyToken, [{
                type: "text",
                text: `ได้รับยอดเงิน ${slipAmount} บาท เรียบร้อยแล้วค่ะ ✅\nแต่ระบบเกิดขัดข้องไม่สามารถจับคู่บิลได้ (ไม่พบหนี้)\n\nกรุณาแจ้งแอดมินเพื่อตรวจสอบและตัดยอดให้แบบ Manual นะคะ 🙏`
              }]);
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
            
            const flexMsg = generateSlipVerificationSuccessFlexMessage(
              verification.data?.amount || 0,
              verification.data?.sender?.name || "",
              verification.data?.sender?.accountNumber || "",
              verification.data?.receiver?.name || "",
              verification.data?.receiver?.accountNumber || "",
              verification.data?.transDate || ""
            );
            
            await safeReplyOrPush(userId, replyToken, [
              flexMsg,
              {
                type: "text",
                text: `ระบบได้ทำการตัดยอดหนี้ให้เรียบร้อยแล้วค่ะ${houseText} ขอบคุณที่ใช้บริการ 💚`
              }
            ]);
            continue;
          }
        }

        // 3.6 Auto-match with linked house if amount matches exactly
        if (slipAmount && slipAmount !== "0") {
          const linkedHouses = await db.select().from(houses).where(eq(houses.lineUserId, userId)).limit(1);
          if (linkedHouses.length > 0) {
            const house = linkedHouses[0];
            const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
            const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            
            if (totalDebt > 0 && Math.abs(parseFloat(slipAmount) - totalDebt) < 0.01) {
              // Perfect match! Auto-approve for the linked house
              const newTx = await db.insert(transactions).values({
                amount: slipAmount,
                amountClaimedByPayer: slipAmount,
                slipImageUrl: blobUrl,
                slipStatus: "verified",
                slipRefId: transRef || null,
                paidAt: new Date(),
                verifiedBy: "line_bot_auto",
              }).returning();
              
              await db.update(invoices).set({ status: 'paid', transactionId: newTx[0].id }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
              
              await db.insert(lineMessages).values({
                lineMessageId: event.message.id,
                lineUserId: userId,
                type: "image",
                imageUrl: blobUrl,
                status: "verified_auto",
                amount: slipAmount,
                senderName: verification.data?.sender.name,
                isVerified: true,
                transactionId: newTx[0].id
              });
              
              const flexMsg = generateSlipVerificationSuccessFlexMessage(
                verification.data?.amount || 0,
                verification.data?.sender?.name || "",
                verification.data?.sender?.accountNumber || "",
                verification.data?.receiver?.name || "",
                verification.data?.receiver?.accountNumber || "",
                verification.data?.transDate || ""
              );
              
              await safeReplyOrPush(userId, replyToken, [
                flexMsg,
                {
                  type: "text",
                  text: `✅ ระบบได้ทำการตัดยอดหนี้ ${totalDebt} บาท สำหรับบ้านเลขที่ ${house.houseNumber} ให้เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚`
                }
              ]);
              continue;
            }
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
          const flexMsg = generateSlipVerificationSuccessFlexMessage(
            verification.data?.amount || 0,
            verification.data?.sender?.name || "",
            verification.data?.sender?.accountNumber || "",
            verification.data?.receiver?.name || "",
            verification.data?.receiver?.accountNumber || "",
            verification.data?.transDate || ""
          );
          
          await safeReplyOrPush(userId, replyToken, [
            flexMsg,
            {
              type: "text",
              text: `กรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) เพื่อให้ระบบตัดยอดหนี้อัตโนมัติค่ะ 🙏`
            }
          ]);

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
          const host = request.headers.get("host") || "";
          const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
          const appUrl = isLocal 
            ? "http://localhost:3000" 
            : "https://nangronggarbagepayments.vercel.app";
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
            const qrUrl = `${appUrl}/api/qr-image?amount=${totalAmount}&ext=.png`;
            const flexMsg = generateBillFlexMessage(house.houseNumber, monthStr, totalAmount, payUrl, qrUrl);
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
            
            const latestTxs = await db.select().from(transactions)
              .where(and(
                 inArray(transactions.id, txIds),
                 eq(transactions.slipStatus, 'verified')
              ))
              .orderBy(desc(transactions.paidAt))
              .limit(5);
              
            if (latestTxs.length === 0) {
              await replyMessage(replyToken, `ยังไม่มีประวัติการรับชำระเงินสำหรับบ้านเลขที่ ${house.houseNumber} ค่ะ`);
              continue;
            }
            
            const receiptUrl = `${appUrl}/house/${house.id}`;
            const carouselContents = [];
            
            for (const tx of latestTxs) {
              const txInvoices = await db.select().from(invoices).where(eq(invoices.transactionId, tx.id));
              let monthStr = "";
              if (txInvoices.length === 1) {
                const [y, m] = txInvoices[0].monthYear.split("-");
                monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
              } else {
                monthStr = `${txInvoices.length} รายการ`;
              }
              const flexMsg = generateReceiptFlexMessage(house.houseNumber, monthStr, parseFloat(tx.amount || "0"), receiptUrl, tx.paidAt, tx.slipImageUrl);
              carouselContents.push(flexMsg.contents);
            }
            
            const carouselMsg = {
              type: "flex",
              altText: `ประวัติการชำระเงิน 5 รายการล่าสุด`,
              contents: {
                type: "carousel",
                contents: carouselContents
              }
            };
            
            await replyWithMessages(replyToken, [carouselMsg]);
            continue;
          }
          
          if (text === "วิธีใช้งาน") {
            await replyMessage(replyToken, "📖 วิธีใช้งานระบบชำระค่าขยะ:\n\n1️⃣ ผูกบัญชีบ้าน\nพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 124/4) ส่งเข้ามาในแชท\n\n2️⃣ เช็คบิลค้างชำระ\nกดปุ่ม 'เช็คบิล' ที่เมนูด้านล่าง ระบบจะแสดงยอดที่ต้องจ่าย\n\n3️⃣ ชำระเงิน\nกดปุ่มชำระเงินเพื่อแสกน QR Code จากนั้นส่งรูป 'สลิปการโอนเงิน' กลับมาในแชทนี้ ระบบจะตัดยอดให้อัตโนมัติค่ะ 💚");
            continue;
          }
          
          if (text === "แจ้งปัญหา") {
            await replyMessage(replyToken, "🗑️ หากท่านพบปัญหาเรื่องการเก็บขยะ (เช่น รถไม่มาเก็บ, ถังขยะชำรุด)\n\nกรุณาพิมพ์รายละเอียดปัญหา พร้อมระบุ 'หมู่บ้าน/ชุมชน' และแนบรูปถ่ายสถานที่ส่งเข้ามาในแชทนี้ได้เลยค่ะ เจ้าหน้าที่จะรีบตรวจสอบและดำเนินการแก้ไขให้โดยเร็วที่สุดค่ะ 🙏");
            continue;
          }
          
          if (text === "ติดต่อเจ้าหน้าที่") {
            await replyMessage(replyToken, "📞 ติดต่อกองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง\n\nโทร: 044-631-419\nเวลาทำการ: วันจันทร์ - ศุกร์ (08:30 - 16:30 น.)");
            continue;
          }

          if (text === "ข้อมูลของฉัน" || text === "ข้อมูลบ้าน") {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "คุณยังไม่ได้ผูกบัญชีบ้านค่ะ\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) ส่งเข้ามาในแชทเพื่อผูกบัญชีค่ะ 🙏");
              continue;
            }
            const house = houseList[0];
            await replyMessage(replyToken, `🏠 ข้อมูลที่ผูกบัญชีไว้\n\nบ้านเลขที่: ${house.houseNumber}\nชื่อเจ้าบ้าน: ${house.ownerName || "ไม่ระบุ"}\nถนน: ${house.road || "-"}\nชุมชน/โซน: ${house.zone || "ไม่ระบุ"}\n\n💡 หากต้องการเปลี่ยนบ้านที่ผูกไว้ สามารถพิมพ์ "บ้านเลขที่ใหม่" ส่งเข้ามาในแชทได้เลยค่ะ`);
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
              
              if (totalDebt > 0 && slipData.isVerified && slipData.amount && Math.abs(parseFloat(slipData.amount) - totalDebt) < 0.01) {
                // Perfect match! Auto-approve using existing transaction
                if (slipData.transactionId) {
                  await db.update(lineMessages).set({ status: 'verified_auto' }).where(eq(lineMessages.id, slipData.id));
                  await db.update(invoices).set({ status: 'paid', transactionId: slipData.transactionId }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
                  
                  await replyMessage(replyToken, `✅ ยืนยันข้อมูลสำเร็จ!\nระบบได้ตัดยอดหนี้ ${totalDebt} บาท สำหรับบ้านเลขที่ ${text} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚`);
                  return NextResponse.json({ status: "ok" });
                }
              }
            } else if (houseResult.length > 1) {
              const flexMsg = generateDuplicateHouseSelectionFlexMessage(houseResult, slipData.id);
              await replyWithMessages(replyToken, [flexMsg]);
              return NextResponse.json({ status: "ok" });
            }

            // If not auto-approved and not duplicate (or other reason)
            await replyMessage(replyToken, `ขอบคุณค่ะ! ระบบได้บันทึกสลิปสำหรับบ้านเลขที่ ${text} แล้ว\n\nเจ้าหน้าที่จะทำการตรวจสอบและอัปเดตยอดในระบบให้ภายใน 24 ชั่วโมงค่ะ 💚`);
          } else {
            // User sent text without a prior pending image
            // Maybe they are trying to link their account
            const houseResult = await db.select().from(houses).where(eq(houses.houseNumber, text));
            if (houseResult.length === 1) {
              // 1. Unlink any previous houses bound to this LINE user
              await db.update(houses).set({ lineUserId: null }).where(eq(houses.lineUserId, userId));
              // 2. Link the new house
              await db.update(houses).set({ lineUserId: userId }).where(eq(houses.id, houseResult[0].id));
              await replyMessage(replyToken, `✅ เปลี่ยน/ผูกบัญชีกับบ้านเลขที่ ${text} สำเร็จแล้ว!\nคุณสามารถพิมพ์ "เช็คบิล" เพื่อดูยอด หรือ "ใบเสร็จ" เพื่อดูประวัติการจ่ายเงินได้เลยค่ะ 💚`);
            } else if (houseResult.length > 1) {
              const flexMsg = generateDuplicateHouseSelectionFlexMessage(houseResult);
              await replyWithMessages(replyToken, [flexMsg]);
            } else {
              await replyMessage(replyToken, "หากต้องการชำระเงิน กรุณาส่งรูป 'สลิปการโอนเงิน' เข้ามาในแชทก่อน แล้วค่อยพิมพ์บ้านเลขที่ตามนะคะ 🙏\n\nหรือหากต้องการเช็คยอด พิมพ์คำว่า 'เช็คบิล' ได้เลยค่ะ");
            }
          }
          }
        } else if (event.message?.type) {
          // Ignore other message types
        }
      
      // Handle Postback Events
      if (event.type === "postback") {
        const userId = event.source.userId;
        const replyToken = event.replyToken;
        const data = event.postback.data;
        
        // Parse url-encoded postback data (e.g. action=bindHouse&houseId=123)
        const params = new URLSearchParams(data);
        const action = params.get('action');
        
        if (action === "bindHouse") {
          const houseId = parseInt(params.get('houseId') || "0", 10);
          const slipId = params.get('slipId') ? parseInt(params.get('slipId')!, 10) : null;
          
          if (houseId > 0) {
            const houseResult = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
            if (houseResult.length === 1) {
              const house = houseResult[0];
              // 1. Unlink any previous houses bound to this LINE user
              await db.update(houses).set({ lineUserId: null }).where(eq(houses.lineUserId, userId));
              // 2. Link the new house
              await db.update(houses).set({ lineUserId: userId }).where(eq(houses.id, houseId));
              
              if (slipId) {
                // Continuation of auto-approve logic
                const slipResult = await db.select().from(lineMessages).where(eq(lineMessages.id, slipId)).limit(1);
                if (slipResult.length === 1) {
                  const slipData = slipResult[0];
                  const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
                  const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
                  
                  if (totalDebt > 0 && slipData.isVerified && slipData.amount && Math.abs(parseFloat(slipData.amount) - totalDebt) < 0.01) {
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
                    
                    await replyMessage(replyToken, `✅ ยืนยันข้อมูลสำเร็จ!\nระบบได้ตัดยอดหนี้ ${totalDebt} บาท สำหรับบ้านเลขที่ ${house.houseNumber} เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚`);
                    continue;
                  }
                }
                await replyMessage(replyToken, `ขอบคุณค่ะ! ระบบได้บันทึกสลิปสำหรับบ้านเลขที่ ${house.houseNumber} แล้ว\n\nเจ้าหน้าที่จะทำการตรวจสอบและอัปเดตยอดในระบบให้ภายใน 24 ชั่วโมงค่ะ 💚`);
              } else {
                await replyMessage(replyToken, `✅ เปลี่ยน/ผูกบัญชีกับบ้านเลขที่ ${house.houseNumber} สำเร็จแล้ว!\nคุณสามารถพิมพ์ "เช็คบิล" เพื่อดูยอด หรือ "ใบเสร็จ" เพื่อดูประวัติการจ่ายเงินได้เลยค่ะ 💚`);
              }
            } else {
              await replyMessage(replyToken, "❌ ไม่พบข้อมูลบ้านในระบบ กรุณาลองใหม่อีกครั้งค่ะ");
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
