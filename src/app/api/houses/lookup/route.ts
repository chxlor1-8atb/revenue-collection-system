import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses } from "@/lib/schema";
import { eq, or, ilike } from "drizzle-orm";
import { encodeSecureId } from "@/lib/secureId";

function maskName(name: string) {
  if (!name || name.length <= 2) return name;
  const parts = name.split(' ');
  if (parts.length > 1) {
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return `${firstName} ${lastName.charAt(0)}****`;
  } else {
    return `${name.substring(0, 2)}****`;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: "Missing search query" }, { status: 400 });
    }

    if (query.trim().length < 3) {
      return NextResponse.json({ error: "Query too short. Please enter at least 3 characters." }, { status: 400 });
    }

    const result = await db.select()
      .from(houses)
      .where(
        or(
          eq(houses.houseNumber, query.trim()),
          ilike(houses.ownerName, `%${query.trim()}%`)
        )
      )
      .limit(20);

    if (result.length === 0) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    // Mask owner names and encode IDs
    const maskedResult = result.map(house => ({
      ...house,
      id: encodeSecureId(house.id),
      ownerName: maskName(house.ownerName)
    }));

    return NextResponse.json(maskedResult, { status: 200 });
  } catch (error) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
