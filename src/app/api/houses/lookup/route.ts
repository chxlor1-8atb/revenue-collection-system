import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { eq, or, ilike } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { houseNumber } = await request.json(); // Keeping parameter name for frontend compatibility, though it acts as a generic query now
    const query = houseNumber;

    if (!query) {
      return NextResponse.json({ error: "Missing search query" }, { status: 400 });
    }

    const result = await db.select()
      .from(houses)
      .where(
        or(
          eq(houses.houseNumber, query),
          ilike(houses.ownerName, `%${query}%`)
        )
      )
      .limit(20); // Limit results to prevent massive payloads

    if (result.length === 0) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    // Return the array of results
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
