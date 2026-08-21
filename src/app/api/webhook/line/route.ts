import { NextResponse } from "next/server";
import { generateBillFlexMessage, generateSlipErrorFlexMessage, generateSlipVerificationSuccessFlexMessage, replyMessage, replyWithMessages, safeReplyOrPush, getMessageContent, generateReceiptFlexMessage, generateDuplicateHouseSelectionFlexMessage, generateHowToUseFlexMessage, generateReportProblemFlexMessage, generateContactFlexMessage, generateMyInfoFlexMessage } from "@/lib/line";
import { db } from "@/lib/db";
import { lineMessages, houses, invoices, transactions } from "@/lib/schema";
import { eq, and, desc, gte, inArray } from "drizzle-orm";
import { put } from "@vercel/blob";
import { verifySlipWithBuffer } from "@/lib/slip2go";

import crypto from 'crypto';


async function attemptAutoApprove(house: any, slipAmountStr: string, slipImageUrl: string, transRef: string | null = null): Promise<{ success: boolean; newTxId?: number; totalDebt?: number }> {
  try {
    const slipValue = parseFloat(slipAmountStr);
    const defaultBill = parseFloat(house.defaultBillingAmount || "20");
    
    const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
    const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    
    let isMatch = false;
    let advanceMonthsCount = 0;
    
    if (Math.abs(slipValue - totalDebt) < 0.01) {
      isMatch = true; // Exact match
    } else if (slipValue > totalDebt && defaultBill > 0) {
      const overpayAmount = slipValue - totalDebt;
      const remainder = overpayAmount % defaultBill;
      if (remainder < 0.01 || Math.abs(remainder - defaultBill) < 0.01) {
        isMatch = true; // Advance match
        advanceMonthsCount = Math.round(overpayAmount / defaultBill);
      }
    } else if (totalDebt === 0 && defaultBill > 0 && slipValue > 0) {
      const remainder = slipValue % defaultBill;
      if (remainder < 0.01 || Math.abs(remainder - defaultBill) < 0.01) {
        isMatch = true;
        advanceMonthsCount = Math.round(slipValue / defaultBill);
      }
    }

    if (!isMatch) {
      return { success: false, totalDebt };
    }

    // CREATE TRANSACTION
    const newTx = await db.insert(transactions).values({
      amount: slipAmountStr,
      amountClaimedByPayer: slipAmountStr,
      slipImageUrl: slipImageUrl,
      slipStatus: "verified",
      slipRefId: transRef,
      paidAt: new Date(),
      verifiedBy: "line_bot_auto",
    }).returning();

    const txId = newTx[0].id;

    // MARK EXISTING INVOICES AS PAID
    if (unpaidInvoices.length > 0) {
      await db.update(invoices).set({ status: 'paid', transactionId: txId }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
    }

    // GENERATE ADVANCE INVOICES
    if (advanceMonthsCount > 0) {
      let lastMonthDate = new Date();
      const latestInvoiceList = await db.select().from(invoices).where(eq(invoices.houseId, house.id)).orderBy(desc(invoices.monthYear)).limit(1);
      if (latestInvoiceList.length > 0) {
        const [year, month] = latestInvoiceList[0].monthYear.split("-");
        lastMonthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      }
      
      for (let i = 1; i <= advanceMonthsCount; i++) {
        const advanceDate = new Date(lastMonthDate);
        advanceDate.setMonth(advanceDate.getMonth() + i);
        const advanceMonthYear = `${advanceDate.getFullYear()}-${String(advanceDate.getMonth() + 1).padStart(2, "0")}`;
        
        await db.insert(invoices).values({
          houseId: house.id,
          amount: defaultBill.toString(),
          status: 'paid', // immediately paid
          monthYear: advanceMonthYear,
          transactionId: txId
        });
      }
    }

    return { success: true, newTxId: txId, totalDebt };
  } catch (error) {
    console.error("Auto approve error:", error);
    return { success: false, totalDebt: 0 };
  }
}

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
          console.log(`[Webhook] Image received โ€“ messageId: ${event.message.id}`);

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
            await replyMessage(replyToken, "เธเธญเธญเธ เธฑเธขเธเนเธฐ เธฃเธฐเธเธเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธฒเธงเธเนเนเธซเธฅเธ”เธฃเธนเธเธ เธฒเธเนเธ”เน เธเธฃเธธเธ“เธฒเธชเนเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธเธเนเธฐ");
            continue;
          }
          console.log(`[Webhook] Image downloaded โ€“ size: ${imageBuffer.length} bytes`);

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
            // Continue without blob URL โ€“ we still want to verify & save to DB
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
            
            let title = "เธชเธฅเธดเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ";
            let subtitle = "เธเธฃเธธเธ“เธฒเธ•เธฃเธงเธเธชเธญเธเธงเนเธฒเธชเนเธเธฃเธนเธเธชเธฅเธดเธเธ—เธตเนเธเธฑเธ”เน€เธเธ";
            let color = "#ef4444"; // Red
            
            if (verification.errorCode === "duplicate") {
              title = "เธชเธฅเธดเธเธเนเธณ";
              subtitle = "เนเธเธฃเธ”เธ•เธฃเธงเธเธชเธญเธเธชเธฅเธดเธ";
              color = "#f59e0b"; // Orange
            } else if (verification.errorCode === "invalid") {
              title = "เธเธฑเธเธเธตเธเธนเนเธฃเธฑเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ";
              subtitle = "เนเธเธฃเธ”เธ•เธฃเธงเธเธชเธญเธเธฃเธนเธเธชเธฅเธดเธ เธซเธฃเธทเธญเธเธฑเธเธเธตเธเธนเนเธฃเธฑเธเธเธญเธเธ—เนเธฒเธ";
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
                 "เธชเธฅเธดเธเธเนเธณ", 
                 "เธชเธฅเธดเธเธเธตเนเน€เธเธขเธ–เธนเธเนเธเนเธขเธทเธเธขเธฑเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธเนเธเนเธฅเนเธง", 
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
                { type: "text", text: "โ เธ•เธฃเธงเธเธเธเธเธฒเธฃเนเธเนเธชเธฅเธดเธเธเนเธณ! เธชเธฅเธดเธเธเธตเนเน€เธเธขเธ–เธนเธเนเธเนเธขเธทเธเธขเธฑเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธเนเธเนเธฅเนเธงเธเนเธฐ" }
              ]);
              continue;
            }
          }
          
          // 3.5 Match waiting_for_slip transaction by amount (FIFO โ€” oldest first)
          // Important: Only match if we have a valid non-zero amount to prevent matching null or "0"
          if (slipAmount && slipAmount !== "0" && slipAmount !== "0.00") {
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() - 5);

            // Match waiting transactions by whole amount (FIFO โ€” oldest first)
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
                  payerNote: 'เธขเธญเธ”เน€เธเธดเธเน€เธเนเธฒเธเธฃเธดเธ เนเธ•เนเธฃเธฐเธเธเธซเธฒเธเธดเธฅเนเธกเนเธเธ (Orphaned)'
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
                text: `เนเธ”เนเธฃเธฑเธเธขเธญเธ”เน€เธเธดเธ ${slipAmount} เธเธฒเธ— เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ โ…\nเนเธ•เนเธฃเธฐเธเธเน€เธเธดเธ”เธเธฑเธ”เธเนเธญเธเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธฑเธเธเธนเนเธเธดเธฅเนเธ”เน (เนเธกเนเธเธเธซเธเธตเน)\n\nเธเธฃเธธเธ“เธฒเนเธเนเธเนเธญเธ”เธกเธดเธเน€เธเธทเนเธญเธ•เธฃเธงเธเธชเธญเธเนเธฅเธฐเธ•เธฑเธ”เธขเธญเธ”เนเธซเนเนเธเธ Manual เธเธฐเธเธฐ ๐`
              }]);
              continue;
            }

            // Amount matched โ€” verify and link invoices
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
               if (house.length > 0) houseText = ` (เธเนเธฒเธเน€เธฅเธเธ—เธตเน ${house[0].houseNumber})`;
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
                text: `เธฃเธฐเธเธเนเธ”เนเธ—เธณเธเธฒเธฃเธ•เธฑเธ”เธขเธญเธ”เธซเธเธตเนเนเธซเนเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ${houseText} เธเธญเธเธเธธเธ“เธ—เธตเนเนเธเนเธเธฃเธดเธเธฒเธฃ ๐’`
              }
            ]);
            continue;
          }
        }

        // 3.5.5 Auto-match with Web Intent Transaction
        if (slipAmount && slipAmount !== "0") {
          const linkedHouses = await db.select().from(houses).where(eq(houses.lineUserId, userId));
          if (linkedHouses.length > 0) {
            const houseIds = linkedHouses.map(h => h.id);
            
            const activeIntents = await db.select({
              txId: transactions.id,
              amount: transactions.amount,
              houseId: invoices.houseId
            })
            .from(transactions)
            .innerJoin(invoices, eq(invoices.transactionId, transactions.id))
            .where(
              and(
                eq(transactions.slipStatus, 'waiting_for_slip'),
                inArray(invoices.houseId, houseIds)
              )
            );
            
            const uniqueIntents = Array.from(new Map(activeIntents.map(item => [item.txId, item])).values());
            const matchingIntent = uniqueIntents.find(intent => 
              intent.amount && Math.abs(parseFloat(intent.amount) - parseFloat(slipAmount)) < 0.01
            );
            
            if (matchingIntent) {
              await db.update(transactions).set({
                slipImageUrl: blobUrl,
                slipStatus: "verified",
                slipRefId: transRef || null,
                paidAt: new Date(),
                verifiedBy: "line_bot_auto"
              }).where(eq(transactions.id, matchingIntent.txId));
              
              await db.update(invoices).set({ status: 'paid' }).where(eq(invoices.transactionId, matchingIntent.txId));
              
              const matchedHouse = linkedHouses.find(h => h.id === matchingIntent.houseId);
              
              await db.insert(lineMessages).values({
                lineMessageId: event.message.id,
                lineUserId: userId,
                type: "image",
                imageUrl: blobUrl,
                status: "verified_auto",
                amount: slipAmount,
                senderName: verification.data?.sender.name,
                isVerified: true,
                transactionId: matchingIntent.txId,
                houseNumber: matchedHouse?.houseNumber
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
                  text: `โ… เธฃเธฐเธเธเนเธ”เนเธ—เธณเธเธฒเธฃเธเธณเธฃเธฐเธเธดเธฅเธ•เธฒเธกเธ—เธตเนเธเธธเธ“เธ—เธณเธฃเธฒเธขเธเธฒเธฃเนเธงเนเธเธเธซเธเนเธฒเน€เธงเนเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ (เธขเธญเธ” ${slipAmount} เธเธฒเธ— เธเนเธฒเธเน€เธฅเธเธ—เธตเน ${matchedHouse?.houseNumber || ''}) เธเธญเธเธเธธเธ“เธ—เธตเนเนเธเนเธเธฃเธดเธเธฒเธฃ ๐’`
                }
              ]);
              continue;
            }
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
                  text: `โ… เธฃเธฐเธเธเนเธ”เนเธ—เธณเธเธฒเธฃเธ•เธฑเธ”เธขเธญเธ” ${parseFloat(slipAmount)} เธเธฒเธ— เธชเธณเธซเธฃเธฑเธเธเนเธฒเธเน€เธฅเธเธ—เธตเน ${house.houseNumber} เนเธซเนเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเนเธฐ เธเธญเธเธเธธเธ“เธ—เธตเนเนเธเนเธเธฃเธดเธเธฒเธฃ ๐’`
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
              text: `เธเธฃเธธเธ“เธฒเธเธดเธกเธเน 'เธเนเธฒเธเน€เธฅเธเธ—เธตเน' เธเธญเธเธเธธเธ“ (เน€เธเนเธ 123/45) เน€เธเธทเนเธญเนเธซเนเธฃเธฐเธเธเธ•เธฑเธ”เธขเธญเธ”เธซเธเธตเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธเนเธฐ ๐`
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
          const thaiMonths = ["", "เธกเธเธฃเธฒเธเธก", "เธเธธเธกเธ เธฒเธเธฑเธเธเน", "เธกเธตเธเธฒเธเธก", "เน€เธกเธฉเธฒเธขเธ", "เธเธคเธฉเธ เธฒเธเธก", "เธกเธดเธ–เธธเธเธฒเธขเธ", "เธเธฃเธเธเธฒเธเธก", "เธชเธดเธเธซเธฒเธเธก", "เธเธฑเธเธขเธฒเธขเธ", "เธ•เธธเธฅเธฒเธเธก", "เธเธคเธจเธเธดเธเธฒเธขเธ", "เธเธฑเธเธงเธฒเธเธก"];
          
          if (text === "เน€เธเนเธเธเธดเธฅ" || text === "เธเธดเธฅ") {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "เธเธธเธ“เธขเธฑเธเนเธกเนเนเธ”เนเธเธนเธเธเธฑเธเธเธตเธเนเธฒเธเธเนเธฐ\nเธเธฃเธธเธ“เธฒเธเธดเธกเธเน 'เธเนเธฒเธเน€เธฅเธเธ—เธตเน' เธเธญเธเธเธธเธ“ (เน€เธเนเธ 123/45) เธชเนเธเน€เธเนเธฒเธกเธฒเนเธเนเธเธ—เน€เธเธทเนเธญเธเธนเธเธเธฑเธเธเธตเธเนเธญเธเธเธฐเธเธฐ ๐");
              continue;
            }
            const house = houseList[0];
            const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
            
            if (unpaidInvoices.length === 0) {
              await replyMessage(replyToken, `เธเนเธฒเธเน€เธฅเธเธ—เธตเน ${house.houseNumber} เนเธกเนเธกเธตเธเธดเธฅเธเนเธฒเธเธเธณเธฃเธฐเธเนเธฐ โ…\nเธเธญเธเธเธธเธ“เธ—เธตเนเนเธเนเธเธฃเธดเธเธฒเธฃ ๐’`);
              continue;
            }
            
            const totalAmount = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            let monthStr = "";
            if (unpaidInvoices.length === 1) {
              const [y, m] = unpaidInvoices[0].monthYear.split("-");
              monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
            } else {
              monthStr = `${unpaidInvoices.length} เน€เธ”เธทเธญเธเธเนเธฒเธเธเธณเธฃเธฐ`;
            }
            
            const payUrl = `${appUrl}/house/${house.id}`;
            const qrUrl = `${appUrl}/api/qr-image?amount=${totalAmount}&ext=.png`;
            const flexMsg = generateBillFlexMessage(house.houseNumber, monthStr, totalAmount, payUrl, qrUrl);
            await replyWithMessages(replyToken, [flexMsg]);
            continue;
          }

          if (text === "เนเธเน€เธชเธฃเนเธ") {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "เธเธธเธ“เธขเธฑเธเนเธกเนเนเธ”เนเธเธนเธเธเธฑเธเธเธตเธเนเธฒเธเธเนเธฐ\nเธเธฃเธธเธ“เธฒเธเธดเธกเธเน 'เธเนเธฒเธเน€เธฅเธเธ—เธตเน' เธเธญเธเธเธธเธ“ (เน€เธเนเธ 123/45) เธชเนเธเน€เธเนเธฒเธกเธฒเนเธเนเธเธ—เน€เธเธทเนเธญเธเธนเธเธเธฑเธเธเธตเธเนเธญเธเธเธฐเธเธฐ ๐");
              continue;
            }
            const house = houseList[0];
            
            // Find latest verified transaction with invoices for this house
            const houseInvoices = await db.select().from(invoices).where(eq(invoices.houseId, house.id));
            const txIds = houseInvoices.map(inv => inv.transactionId).filter(Boolean) as number[];
            
            if (txIds.length === 0) {
              await replyMessage(replyToken, `เธขเธฑเธเนเธกเนเธกเธตเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธฃเธฑเธเธเธณเธฃเธฐเน€เธเธดเธเธชเธณเธซเธฃเธฑเธเธเนเธฒเธเน€เธฅเธเธ—เธตเน ${house.houseNumber} เธเนเธฐ`);
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
              await replyMessage(replyToken, `เธขเธฑเธเนเธกเนเธกเธตเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธฃเธฑเธเธเธณเธฃเธฐเน€เธเธดเธเธชเธณเธซเธฃเธฑเธเธเนเธฒเธเน€เธฅเธเธ—เธตเน ${house.houseNumber} เธเนเธฐ`);
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
                monthStr = `${txInvoices.length} เธฃเธฒเธขเธเธฒเธฃ`;
              }
              const flexMsg = generateReceiptFlexMessage(house.houseNumber, monthStr, parseFloat(tx.amount || "0"), receiptUrl, tx.paidAt, tx.slipImageUrl);
              carouselContents.push(flexMsg.contents);
            }
            
            const carouselMsg = {
              type: "flex",
              altText: `เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ 5 เธฃเธฒเธขเธเธฒเธฃเธฅเนเธฒเธชเธธเธ”`,
              contents: {
                type: "carousel",
                contents: carouselContents
              }
            };
            
            await replyWithMessages(replyToken, [carouselMsg]);
            continue;
          }

          if (text === "วิธีใช้งาน") {
            await replyWithMessages(replyToken, [generateHowToUseFlexMessage()]);
            continue;
          }
          
          if (text === "แจ้งปัญหา") {
            await replyWithMessages(replyToken, [generateReportProblemFlexMessage()]);
            continue;
          }
          
          if (text === "ติดต่อเจ้าหน้าที่") {
            await replyWithMessages(replyToken, [generateContactFlexMessage()]);
            continue;
          }

          if (text === "ข้อมูลของฉัน" || text === "ข้อมูลบ้าน") {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "คุณยังไม่ได้ผูกบัญชีบ้านค่ะ\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) ส่งเข้ามาในแชทเพื่อผูกบัญชีค่ะ 🙏");
              continue;
            }
            const house = houseList[0];
            await replyWithMessages(replyToken, [generateMyInfoFlexMessage(house)]);
            continue;
          }

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
                  
                  
                  const thaiMonths = ["", "เธกเธเธฃเธฒเธเธก", "เธเธธเธกเธ เธฒเธเธฑเธเธเน", "เธกเธตเธเธฒเธเธก", "เน€เธกเธฉเธฒเธขเธ", "เธเธคเธฉเธ เธฒเธเธก", "เธกเธดเธ–เธธเธเธฒเธขเธ", "เธเธฃเธเธเธฒเธเธก", "เธชเธดเธเธซเธฒเธเธก", "เธเธฑเธเธขเธฒเธขเธ", "เธ•เธธเธฅเธฒเธเธก", "เธเธคเธจเธเธดเธเธฒเธขเธ", "เธเธฑเธเธงเธฒเธเธก"];
                  let monthStr = "";
                  if (unpaidInvoices.length === 1) {
                    const [y, m] = unpaidInvoices[0].monthYear.split("-");
                    monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
                  } else {
                    monthStr = `${unpaidInvoices.length} เน€เธ”เธทเธญเธเธ—เธตเนเธเนเธฒเธเธเธณเธฃเธฐ`;
                  }

                  const appUrl = request.headers.get("host")?.includes("localhost") ? "http://localhost:3000" : "https://nangronggarbagepayments.vercel.app";
                  
                  const receiptFlex = generateReceiptFlexMessage(
                      house.houseNumber,
                      monthStr,
                      totalDebt,
                      `${appUrl}/dashboard/history/${slipData.transactionId}/receipt`,
                      new Date(),
                      slipData.imageUrl
                    );
                    await replyWithMessages(replyToken, [receiptFlex]);
                  return NextResponse.json({ status: "ok" });
                }
              }
            } else if (houseResult.length > 1) {
              const flexMsg = generateDuplicateHouseSelectionFlexMessage(houseResult, slipData.id);
              await replyWithMessages(replyToken, [flexMsg]);
              return NextResponse.json({ status: "ok" });
            }

            // If not auto-approved and not duplicate (or other reason)
            await replyMessage(replyToken, `เธเธญเธเธเธธเธ“เธเนเธฐ! เธฃเธฐเธเธเนเธ”เนเธเธฑเธเธ—เธถเธเธชเธฅเธดเธเธชเธณเธซเธฃเธฑเธเธเนเธฒเธเน€เธฅเธเธ—เธตเน ${text} เนเธฅเนเธง\n\nเน€เธเนเธฒเธซเธเนเธฒเธ—เธตเนเธเธฐเธ—เธณเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธขเธญเธ”เนเธเธฃเธฐเธเธเนเธซเนเธ เธฒเธขเนเธ 24 เธเธฑเนเธงเนเธกเธเธเนเธฐ ๐’`);
          } else {
            // User sent text without a prior pending image
            // Maybe they are trying to link their account
            const houseResult = await db.select().from(houses).where(eq(houses.houseNumber, text));
            if (houseResult.length === 1) {
              // 1. Unlink any previous houses bound to this LINE user
              await db.update(houses).set({ lineUserId: null }).where(eq(houses.lineUserId, userId));
              // 2. Link the new house
              await db.update(houses).set({ lineUserId: userId }).where(eq(houses.id, houseResult[0].id));
              await replyMessage(replyToken, `โ… เน€เธเธฅเธตเนเธขเธ/เธเธนเธเธเธฑเธเธเธตเธเธฑเธเธเนเธฒเธเน€เธฅเธเธ—เธตเน ${text} เธชเธณเน€เธฃเนเธเนเธฅเนเธง!\nเธเธธเธ“เธชเธฒเธกเธฒเธฃเธ–เธเธดเธกเธเน "เน€เธเนเธเธเธดเธฅ" เน€เธเธทเนเธญเธ”เธนเธขเธญเธ” เธซเธฃเธทเธญ "เนเธเน€เธชเธฃเนเธ" เน€เธเธทเนเธญเธ”เธนเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเนเธฒเธขเน€เธเธดเธเนเธ”เนเน€เธฅเธขเธเนเธฐ ๐’`);
            } else if (houseResult.length > 1) {
              const flexMsg = generateDuplicateHouseSelectionFlexMessage(houseResult);
              await replyWithMessages(replyToken, [flexMsg]);
            } else {
              await replyMessage(replyToken, "เธซเธฒเธเธ•เนเธญเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ เธเธฃเธธเธ“เธฒเธชเนเธเธฃเธนเธ 'เธชเธฅเธดเธเธเธฒเธฃเนเธญเธเน€เธเธดเธ' เน€เธเนเธฒเธกเธฒเนเธเนเธเธ—เธเนเธญเธ เนเธฅเนเธงเธเนเธญเธขเธเธดเธกเธเนเธเนเธฒเธเน€เธฅเธเธ—เธตเนเธ•เธฒเธกเธเธฐเธเธฐ ๐\n\nเธซเธฃเธทเธญเธซเธฒเธเธ•เนเธญเธเธเธฒเธฃเน€เธเนเธเธขเธญเธ” เธเธดเธกเธเนเธเธณเธงเนเธฒ 'เน€เธเนเธเธเธดเธฅ' เนเธ”เนเน€เธฅเธขเธเนเธฐ");
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
                    
                    
                    const thaiMonths = ["", "เธกเธเธฃเธฒเธเธก", "เธเธธเธกเธ เธฒเธเธฑเธเธเน", "เธกเธตเธเธฒเธเธก", "เน€เธกเธฉเธฒเธขเธ", "เธเธคเธฉเธ เธฒเธเธก", "เธกเธดเธ–เธธเธเธฒเธขเธ", "เธเธฃเธเธเธฒเธเธก", "เธชเธดเธเธซเธฒเธเธก", "เธเธฑเธเธขเธฒเธขเธ", "เธ•เธธเธฅเธฒเธเธก", "เธเธคเธจเธเธดเธเธฒเธขเธ", "เธเธฑเธเธงเธฒเธเธก"];
                    let monthStr = "";
                    if (unpaidInvoices.length === 1) {
                      const [y, m] = unpaidInvoices[0].monthYear.split("-");
                      monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
                    } else {
                      monthStr = `${unpaidInvoices.length} เน€เธ”เธทเธญเธเธ—เธตเนเธเนเธฒเธเธเธณเธฃเธฐ`;
                    }

                    const appUrl = request.headers.get("host")?.includes("localhost") ? "http://localhost:3000" : "https://nangronggarbagepayments.vercel.app";
                    
                    const receiptFlex = generateReceiptFlexMessage(
                      house.houseNumber,
                      monthStr,
                      totalDebt,
                      `${appUrl}/dashboard/history/${newTx[0].id}/receipt`,
                      new Date(),
                      slipData.imageUrl
                    );
                    await replyWithMessages(replyToken, [receiptFlex]);
                    continue;
                  }
                }
                await replyMessage(replyToken, `เธเธญเธเธเธธเธ“เธเนเธฐ! เธฃเธฐเธเธเนเธ”เนเธเธฑเธเธ—เธถเธเธชเธฅเธดเธเธชเธณเธซเธฃเธฑเธเธเนเธฒเธเน€เธฅเธเธ—เธตเน ${house.houseNumber} เนเธฅเนเธง\n\nเน€เธเนเธฒเธซเธเนเธฒเธ—เธตเนเธเธฐเธ—เธณเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเนเธฅเธฐเธญเธฑเธเน€เธ”เธ•เธขเธญเธ”เนเธเธฃเธฐเธเธเนเธซเนเธ เธฒเธขเนเธ 24 เธเธฑเนเธงเนเธกเธเธเนเธฐ ๐’`);
              } else {
                await replyMessage(replyToken, `โ… เน€เธเธฅเธตเนเธขเธ/เธเธนเธเธเธฑเธเธเธตเธเธฑเธเธเนเธฒเธเน€เธฅเธเธ—เธตเน ${house.houseNumber} เธชเธณเน€เธฃเนเธเนเธฅเนเธง!\nเธเธธเธ“เธชเธฒเธกเธฒเธฃเธ–เธเธดเธกเธเน "เน€เธเนเธเธเธดเธฅ" เน€เธเธทเนเธญเธ”เธนเธขเธญเธ” เธซเธฃเธทเธญ "เนเธเน€เธชเธฃเนเธ" เน€เธเธทเนเธญเธ”เธนเธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธเนเธฒเธขเน€เธเธดเธเนเธ”เนเน€เธฅเธขเธเนเธฐ ๐’`);
              }
            } else {
              await replyMessage(replyToken, "โ เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเนเธฒเธเนเธเธฃเธฐเธเธ เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธเธเนเธฐ");
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


