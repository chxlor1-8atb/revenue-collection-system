import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { houseNumber } = await request.json();

    if (!houseNumber) {
      return NextResponse.json({ error: "Missing houseNumber" }, { status: 400 });
    }

    const result = await db.select().from(houses).where(eq(houses.houseNumber, houseNumber)).limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
