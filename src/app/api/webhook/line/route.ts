import { NextResponse } from "next/server";
import { replyMessage, getMessageContent } from "@/lib/line";
import { db } from "@/lib/db";
import { lineMessages } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { put } from "@vercel/blob";

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

          // 2. Upload to Vercel Blob
          const blob = await put(`line-slips/${Date.now()}-${event.message.id}.jpg`, imageBuffer, {
            access: "public",
            contentType: "image/jpeg",
          });

          // 3. Save to database
          await db.insert(lineMessages).values({
            lineUserId: userId,
            type: "image",
            imageUrl: blob.url,
            status: "pending",
          });

          // 4. Reply asking for house number
          await replyMessage(replyToken, "ระบบได้รับสลิปของคุณแล้วค่ะ 🧾\n\nกรุณาพิมพ์ 'บ้านเลขที่' ของคุณ (เช่น 123/45) เพื่อให้เจ้าหน้าที่ตรวจสอบความถูกต้องค่ะ 🙏");

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
            // Link this text (house number) to the image
            await db.update(lineMessages)
              .set({ houseNumber: text })
              .where(eq(lineMessages.id, recentImages[0].id));

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
