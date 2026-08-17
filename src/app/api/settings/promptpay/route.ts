import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/schema";
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

    const updateData = { accountName: name, promptPayId };

    const existing = await db.select().from(systemSettings).limit(1);
    if (existing.length > 0) {
      await db.update(systemSettings).set(updateData);
    } else {
      await db.insert(systemSettings).values({ ...updateData, id: 1 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating promptpay:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
