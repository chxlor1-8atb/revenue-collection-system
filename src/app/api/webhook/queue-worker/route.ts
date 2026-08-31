import { NextResponse } from "next/server";
import { pushMessage } from "@/lib/line";

// Endpoint for QStash to call when processing queue items
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, messages } = body;

    if (!userId || !messages) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Attempt to send the message
    await pushMessage(userId, messages);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Queue Worker Error:", error);
    // Returning 500 tells QStash to retry later
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
