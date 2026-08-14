import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const searchTerm = query.trim();

    const result = await db.select({
      id: houses.id,
      houseNumber: houses.houseNumber,
      ownerName: houses.ownerName,
      zone: houses.zone,
      similarity: sql<number>`similarity(${houses.houseNumber} || ' ' || ${houses.ownerName}, ${searchTerm})`.as('similarity')
    })
    .from(houses)
    .where(sql`similarity(${houses.houseNumber} || ' ' || ${houses.ownerName}, ${searchTerm}) > 0.05`)
    .orderBy(sql`similarity(${houses.houseNumber} || ' ' || ${houses.ownerName}, ${searchTerm}) DESC`)
    .limit(10);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Predict API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
