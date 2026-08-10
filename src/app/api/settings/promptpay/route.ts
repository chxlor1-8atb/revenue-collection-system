import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collectors } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, promptPayId, qrCodeBase64, removeQrCode } = await request.json();

    if (!id || !name || !promptPayId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let qrCodeImageUrl = undefined;

    if (qrCodeBase64) {
      // Decode base64 to buffer
      const base64Data = qrCodeBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const blob = await put(`qr-codes/system-qr-${Date.now()}.jpg`, buffer, {
        access: "public",
        contentType: "image/jpeg",
      });
      qrCodeImageUrl = blob.url;
    }

    // Only update qrCodeImageUrl if a new image was uploaded or if it's explicitly removed
    const updateData: any = { name, promptPayId };
    
    if (removeQrCode) {
      updateData.qrCodeImageUrl = null;
    } else if (qrCodeImageUrl) {
      updateData.qrCodeImageUrl = qrCodeImageUrl;
    }

    await db.update(collectors)
      .set(updateData)
      .where(eq(collectors.id, parseInt(id, 10)));

    return NextResponse.json({ success: true, qrCodeImageUrl });
  } catch (error) {
    console.error("Error updating promptpay:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
