import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
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
    const updateData: any = { accountName: name, promptPayId };
    
    if (removeQrCode) {
      updateData.qrCodeImageUrl = null;
    } else if (qrCodeImageUrl) {
      updateData.qrCodeImageUrl = qrCodeImageUrl;
    }

    // Since there's only one row, we can update or insert. Assuming row ID 1 exists.
    const existing = await db.select().from(systemSettings).limit(1);
    if (existing.length > 0) {
      await db.update(systemSettings)
        .set(updateData);
    } else {
      await db.insert(systemSettings).values({ ...updateData, id: 1 });
    }

    return NextResponse.json({ success: true, qrCodeImageUrl });
  } catch (error) {
    console.error("Error updating promptpay:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
