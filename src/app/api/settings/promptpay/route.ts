import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collectors } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, promptPayId } = await request.json();

    if (!id || !name || !promptPayId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await db.update(collectors)
      .set({ name, promptPayId })
      .where(eq(collectors.id, parseInt(id, 10)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating promptpay:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
