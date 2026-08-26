import { NextResponse } from "next/server";
import { generateBillFlexMessage, generateSlipErrorFlexMessage, generateSlipVerificationSuccessFlexMessage, replyMessage, replyWithMessages, safeReplyOrPush, getMessageContent, generateReceiptFlexMessage, generateDuplicateHouseSelectionFlexMessage, generateHowToUseFlexMessage, generateReportProblemFlexMessage, generateContactFlexMessage, generateMyInfoFlexMessage, generateWelcomeFlexMessage, generateAdvanceOptionsFlexMessage, generateAdvanceQrFlexMessage } from "@/lib/line";
import { db } from "@/lib/db";
import { lineMessages, houses, invoices, transactions, systemSettings } from "@/lib/schema";
import { eq, and, desc, gte, inArray } from "drizzle-orm";
import { put } from "@vercel/blob";
import { verifySlipWithBuffer } from "@/lib/slip2go";
import { generateNextReceiptSeries } from "@/lib/receiptSeries";
import { broadcastEvent } from "@/lib/eventHub";

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

    let txId: number | undefined;
    const series = await generateNextReceiptSeries(new Date());

    // ATOMIC TRANSACTION: CREATE TRANSACTION, MARK INVOICES AS PAID, GENERATE ADVANCE INVOICES
    await db.transaction(async (txDb) => {
      const newTx = await txDb.insert(transactions).values({
        amount: slipAmountStr,
        amountClaimedByPayer: slipAmountStr,
        slipImageUrl: slipImageUrl,
        slipStatus: "verified",
        slipRefId: transRef,
        paidAt: new Date(),
        verifiedBy: "line_bot_auto",
        receiptCode: series.receiptCode,
        bookNumber: series.bookNumber,
        receiptNumber: series.receiptNumber,
        fiscalYear: series.fiscalYear,
      }).returning();

      txId = newTx[0].id;

      // MARK EXISTING INVOICES AS PAID
      if (unpaidInvoices.length > 0) {
        await txDb.update(invoices).set({ status: 'paid', transactionId: txId }).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
      }

      // GENERATE ADVANCE INVOICES
      if (advanceMonthsCount > 0) {
        let lastMonthDate = new Date();
        const latestInvoiceList = await txDb.select().from(invoices).where(eq(invoices.houseId, house.id)).orderBy(desc(invoices.monthYear)).limit(1);
        if (latestInvoiceList.length > 0) {
          const [year, month] = latestInvoiceList[0].monthYear.split("-");
          lastMonthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        }
        
        for (let i = 1; i <= advanceMonthsCount; i++) {
          const advanceDate = new Date(lastMonthDate);
          advanceDate.setMonth(advanceDate.getMonth() + i);
          const advanceMonthYear = `${advanceDate.getFullYear()}-${String(advanceDate.getMonth() + 1).padStart(2, "0")}`;
          
          await txDb.insert(invoices).values({
            houseId: house.id,
            amount: defaultBill.toString(),
            status: 'paid', // immediately paid
            monthYear: advanceMonthYear,
            transactionId: txId
          });
        }
      }
    });

    if (txId) {
      broadcastEvent("transaction:verified", {
        transactionId: txId,
        receiptCode: series.receiptCode,
        houseNumber: house?.houseNumber,
        amount: slipAmountStr,
        verifiedAt: new Date().toISOString(),
      });
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
      try {
        if (event.type === "follow") {
          const replyToken = event.replyToken;
          if (replyToken) {
            await replyWithMessages(replyToken, [generateWelcomeFlexMessage()]);
          }
        } else if (event.type === "message") {
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        if (event.message.type === "image") {
          console.log(`[Webhook] Image received – messageId: ${event.message.id}`);

          // Atomic Idempotency Lock: Reserve this messageId immediately to prevent ANY concurrent Slip2Go duplicate calls
          let msgRowId: number;
          try {
            const [inserted] = await db.insert(lineMessages).values({
              lineMessageId: event.message.id,
              lineUserId: userId,
              type: "image",
              status: "processing",
            }).returning({ id: lineMessages.id });
            msgRowId = inserted.id;
          } catch {
            // Already processing or processed by another concurrent webhook invocation
            console.log(`[Webhook] Message ${event.message.id} is already registered/processed, skipping Slip2Go verification.`);
            continue;
          }

          // 1. Download image from LINE
          const imageBuffer = await getMessageContent(event.message.id);
          if (!imageBuffer || imageBuffer.length < 500) {
            console.error("[Webhook] Failed to download valid image from LINE");
            await db.update(lineMessages).set({ status: 'rejected' }).where(eq(lineMessages.id, msgRowId));
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
            blobUrl = `line://message/${event.message.id}`;
          }

          await db.update(lineMessages).set({ imageUrl: blobUrl }).where(eq(lineMessages.id, msgRowId));

          // 3. Verify with Slip2Go EXACTLY ONCE
          console.log("[Webhook] Sending to Slip2Go for verification...");
          const verification = await verifySlipWithBuffer(imageBuffer);
          console.log("[Webhook] Slip2Go result:", JSON.stringify(verification));

          if (!verification.success) {
            await db.update(lineMessages).set({
              status: "rejected",
              isVerified: false,
            }).where(eq(lineMessages.id, msgRowId));
            
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
          
          // Dedup: Check if this transfer reference has already been processed in transactions table
          if (transRef) {
            const existingRefTx = await db.select({ id: transactions.id })
              .from(transactions)
              .where(eq(transactions.slipRefId, transRef))
              .limit(1);
            
            if (existingRefTx.length > 0) {
              await db.update(lineMessages).set({
                status: "rejected",
                isVerified: false,
                amount: slipAmount,
                senderName: verification.data?.sender?.name
              }).where(eq(lineMessages.id, msgRowId));

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
                const series = await generateNextReceiptSeries(new Date());
                await db.update(transactions).set({
                  slipImageUrl: blobUrl,
                  slipStatus: "verified",
                  slipRefId: transRef || null,
                  paidAt: new Date(),
                  verifiedBy: "line_bot_auto",
                  receiptCode: series.receiptCode,
                  bookNumber: series.bookNumber,
                  receiptNumber: series.receiptNumber,
                  fiscalYear: series.fiscalYear,
                }).where(eq(transactions.id, matchingIntent.txId));
                
                await db.update(invoices).set({ status: 'paid' }).where(eq(invoices.transactionId, matchingIntent.txId));
                
                const matchedHouse = linkedHouses.find(h => h.id === matchingIntent.houseId);
                
                await db.update(lineMessages).set({
                  status: "verified_auto",
                  amount: slipAmount,
                  senderName: verification.data?.sender.name,
                  isVerified: true,
                  transactionId: matchingIntent.txId,
                  houseNumber: matchedHouse?.houseNumber
                }).where(eq(lineMessages.id, msgRowId));
                
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
                    text: `✅ ระบบได้ทำการชำระบิลตามที่คุณทำรายการไว้บนหน้าเว็บเรียบร้อยแล้วค่ะ (ยอด ${slipAmount} บาท บ้านเลขที่ ${matchedHouse?.houseNumber || ''}) ขอบคุณที่ใช้บริการ 💚`
                  }
                ]);
                continue;
              }
            }
          }

          // 3.6 Auto-match with linked house (supports exact match AND advance payment matching)
          if (slipAmount && slipAmount !== "0") {
            const linkedHouses = await db.select().from(houses).where(eq(houses.lineUserId, userId)).limit(1);
            if (linkedHouses.length > 0) {
              const house = linkedHouses[0];
              const approveResult = await attemptAutoApprove(house, slipAmount, blobUrl, transRef || null);
              
              if (approveResult.success && approveResult.newTxId) {
                await db.update(lineMessages).set({
                  status: "verified_auto",
                  amount: slipAmount,
                  senderName: verification.data?.sender.name,
                  isVerified: true,
                  transactionId: approveResult.newTxId,
                  houseNumber: house.houseNumber
                }).where(eq(lineMessages.id, msgRowId));
                
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
                    text: `✅ ระบบได้ทำการตัดยอดชำระเงิน ${parseFloat(slipAmount).toLocaleString()} บาท สำหรับบ้านเลขที่ ${house.houseNumber} ให้เรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการ 💚`
                  }
                ]);
                continue;
              }
            }
          }
            
          // 4. Save verified data to lineMessages (Normal fallback flow: waiting for resident to type house number)
          await db.update(lineMessages).set({
            status: "pending",
            amount: slipAmount,
            senderName: verification.data?.sender.name,
            isVerified: true,
          }).where(eq(lineMessages.id, msgRowId));

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
            await replyWithMessages(replyToken, [generateHowToUseFlexMessage(appUrl)]);
            continue;
          }
          
          if (text === "แจ้งปัญหา") {
            await replyWithMessages(replyToken, [generateReportProblemFlexMessage(appUrl)]);
            continue;
          }
          
          if (text === "พิมพ์ข้อความ" || text === "เปิดแป้นพิมพ์") {
            await replyMessage(replyToken, "💬 คุณสามารถพิมพ์ข้อความที่ต้องการสอบถาม หรือส่งรูปสลิปโอนเงินเข้ามาในแชทนี้ได้เลยครับ เจ้าหน้าที่จะรีบตอบกลับโดยเร็วที่สุดครับ 🙏");
            continue;
          }
          if (text === "ติดต่อเจ้าหน้าที่" || text === "ติดต่อ" || text === "เบอร์โทร" || text === "เบอร์โทรศัพท์") {
            const settings = await db.select().from(systemSettings).limit(1);
            const lineConfig = settings[0]?.lineConfig;
            await replyWithMessages(replyToken, [generateContactFlexMessage(appUrl, lineConfig)]);
            continue;
          }

          if (text === "ข้อมูลของฉัน" || text === "ข้อมูลบ้าน") {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "คุณยังไม่ได้ผูกบัญชีบ้านค่ะ\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) ส่งเข้ามาในแชทเพื่อผูกบัญชีค่ะ 🙏");
              continue;
            }
            const house = houseList[0];
            await replyWithMessages(replyToken, [generateMyInfoFlexMessage(appUrl, house)]);
            continue;
          }

          // Advance Payment Keyword Matching
          const isAdvanceKeyword = 
            text === "ชำระเงินล่วงหน้า" ||
            text === "จ่ายล่วงหน้า" ||
            text === "ชำระล่วงหน้า" ||
            text === "จ่ายค่าขยะล่วงหน้า" ||
            text === "จ่ายค่าธรรมเนียมล่วงหน้า" ||
            text === "จ่ายล่วงหน้าค่าขยะ" ||
            text === "ล่วงหน้า" ||
            text.toLowerCase() === "advance" ||
            /^(?:ชำระ|จ่าย)(?:เงิน)?(?:ค่าขยะ|ค่าธรรมเนียม)?ล่วงหน้า/i.test(text);

          const advanceMonthMatch = text.match(/(?:ชำระ|จ่าย)(?:เงิน)?(?:ค่าขยะ|ค่าธรรมเนียม)?ล่วงหน้า\s*(\d+)\s*(?:เดือน)?/i);

          if (isAdvanceKeyword) {
            const houseList = await db.select().from(houses).where(eq(houses.lineUserId, userId));
            if (houseList.length === 0) {
              await replyMessage(replyToken, "คุณยังไม่ได้ผูกบัญชีบ้านค่ะ\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) ส่งเข้ามาในแชทเพื่อผูกบัญชีก่อน แล้วค่อยพิมพ์ 'ชำระเงินล่วงหน้า' อีกครั้งนะคะ 🙏");
              continue;
            }
            const house = houseList[0];
            const monthlyRate = parseFloat(house.defaultBillingAmount || "20");
            const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, house.id), eq(invoices.status, 'unpaid')));
            const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const unpaidCount = unpaidInvoices.length;

            const specificMonths = advanceMonthMatch && advanceMonthMatch[1] ? parseInt(advanceMonthMatch[1], 10) : null;

            if (specificMonths && specificMonths > 0) {
              const advanceCost = specificMonths * monthlyRate;
              const totalAmount = advanceCost + unpaidTotal;
              const qrUrl = `${appUrl}/api/qr-image?amount=${totalAmount}&ext=.png`;
              const payUrl = `${appUrl}/house/${house.id}`;
              const qrFlex = generateAdvanceQrFlexMessage(
                house.houseNumber,
                specificMonths,
                unpaidCount,
                unpaidTotal,
                totalAmount,
                payUrl,
                qrUrl
              );
              await replyWithMessages(replyToken, [qrFlex]);
              continue;
            }

            // Show Options Flex Message
            const optionsFlex = generateAdvanceOptionsFlexMessage(
              house,
              unpaidCount,
              unpaidTotal,
              monthlyRate,
              appUrl
            );
            await replyWithMessages(replyToken, [optionsFlex]);
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
                  
                  
                  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
                  let monthStr = "";
                  if (unpaidInvoices.length === 1) {
                    const [y, m] = unpaidInvoices[0].monthYear.split("-");
                    monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
                  } else {
                    monthStr = `${unpaidInvoices.length} เดือนที่ค้างชำระ`;
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
        } else if (event.message?.type) {
          // Ignore other message types
        }
      } else if (event.type === "postback") {
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
                    
                    
                    const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
                    let monthStr = "";
                    if (unpaidInvoices.length === 1) {
                      const [y, m] = unpaidInvoices[0].monthYear.split("-");
                      monthStr = `${thaiMonths[parseInt(m)]} ${parseInt(y) + 543}`;
                    } else {
                      monthStr = `${unpaidInvoices.length} เดือนที่ค้างชำระ`;
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
                await replyMessage(replyToken, `ขอบคุณค่ะ! ระบบได้บันทึกสลิปสำหรับบ้านเลขที่ ${house.houseNumber} แล้ว\n\nเจ้าหน้าที่จะทำการตรวจสอบและอัปเดตยอดในระบบให้ภายใน 24 ชั่วโมงค่ะ 💚`);
              } else {
                await replyMessage(replyToken, `✅ เปลี่ยน/ผูกบัญชีกับบ้านเลขที่ ${house.houseNumber} สำเร็จแล้ว!\nคุณสามารถพิมพ์ "เช็คบิล" เพื่อดูยอด หรือ "ใบเสร็จ" เพื่อดูประวัติการจ่ายเงินได้เลยค่ะ 💚`);
              }
            } else {
              await replyMessage(replyToken, "❌ ไม่พบข้อมูลบ้านในระบบ กรุณาลองใหม่อีกครั้งค่ะ");
            }
          }
        }

        if (action === "payAdvance") {
          const houseId = parseInt(params.get('houseId') || "0", 10);
          const months = parseInt(params.get('months') || "3", 10);
          
          let targetHouse = null;
          if (houseId > 0) {
            const hResult = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
            if (hResult.length > 0) targetHouse = hResult[0];
          }
          if (!targetHouse) {
            const hResult = await db.select().from(houses).where(eq(houses.lineUserId, userId)).limit(1);
            if (hResult.length > 0) targetHouse = hResult[0];
          }

          if (targetHouse && months > 0) {
            const host = request.headers.get("host") || "";
            const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
            const appUrl = isLocal 
              ? "http://localhost:3000" 
              : "https://nangronggarbagepayments.vercel.app";

            const monthlyRate = parseFloat(targetHouse.defaultBillingAmount || "20");
            const unpaidInvoices = await db.select().from(invoices).where(and(eq(invoices.houseId, targetHouse.id), eq(invoices.status, 'unpaid')));
            const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const unpaidCount = unpaidInvoices.length;

            const advanceCost = months * monthlyRate;
            const totalAmount = advanceCost + unpaidTotal;
            const qrUrl = `${appUrl}/api/qr-image?amount=${totalAmount}&ext=.png`;
            const payUrl = `${appUrl}/house/${targetHouse.id}`;

            const qrFlex = generateAdvanceQrFlexMessage(
              targetHouse.houseNumber,
              months,
              unpaidCount,
              unpaidTotal,
              totalAmount,
              payUrl,
              qrUrl
            );
            await replyWithMessages(replyToken, [qrFlex]);
            continue;
          }
        }
      }
    } catch (eventError: any) {
      console.error(`[Webhook] Error processing event (${event?.type}):`, eventError?.message || eventError);
    }
  }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("LINE Webhook Top-level Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

