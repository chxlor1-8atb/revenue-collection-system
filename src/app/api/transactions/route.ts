import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { qrCodes, transactions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const qrCodeIdStr = formData.get("qrCodeId") as string;

    if (!file || !qrCodeIdStr) {
      return NextResponse.json({ error: "Missing file or qrCodeId" }, { status: 400 });
    }

    const qrCodeId = parseInt(qrCodeIdStr, 10);
    if (isNaN(qrCodeId)) {
      return NextResponse.json({ error: "Invalid qrCodeId" }, { status: 400 });
    }

    // Verify QR Code exists and is active
    const qrResult = await db.select().from(qrCodes).where(eq(qrCodes.id, qrCodeId)).limit(1);
    if (qrResult.length === 0 || !qrResult[0].active) {
      return NextResponse.json({ error: "QR Code not found or inactive" }, { status: 404 });
    }

    const qrCode = qrResult[0];

    // Upload slip to Vercel Blob
    const blob = await put(`slips/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    // Insert transaction record
    await db.insert(transactions).values({
      qrCodeId: qrCode.id,
      collectorId: qrCode.collectorId,
      slipImageUrl: blob.url,
      slipStatus: "pending",
    });

    // In a future phase, we will trigger Slip API checking here asynchronously.

    return NextResponse.json({ success: true, url: blob.url }, { status: 200 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
