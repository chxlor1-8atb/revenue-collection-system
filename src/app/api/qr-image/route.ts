import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const amountStr = searchParams.get("amount");
    const amount = amountStr ? parseFloat(amountStr) : 0;

    if (amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    const settings = await db.select().from(systemSettings).limit(1);
    if (!settings || settings.length === 0 || !settings[0].promptPayId) {
      return new NextResponse("PromptPay not configured", { status: 500 });
    }

    const promptPayId = settings[0].promptPayId;
    const payload = generatePayload(promptPayId, { amount });

    // Generate QR code as a PNG buffer
    const buffer = await QRCode.toBuffer(payload, {
      type: "png",
      width: 500,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("QR Code Generation Error:", error);
    return new NextResponse("Failed to generate QR code", { status: 500 });
  }
}
