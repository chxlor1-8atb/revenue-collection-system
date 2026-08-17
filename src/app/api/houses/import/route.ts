import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses } from "@/lib/schema";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: "No data provided" }, { status: 400 });
    }

    // validate format
    const validData = data.filter((item: any) => item.houseNumber && item.ownerName).map((item: any) => ({
      houseNumber: String(item.houseNumber).trim(),
      ownerName: String(item.ownerName).trim(),
      zone: item.zone ? String(item.zone).trim() : null,
      road: item.road ? String(item.road).trim() : null,
      customFields: item.customFields || {},
    }));

    if (validData.length === 0) {
      return NextResponse.json({ success: false, error: "No valid house data found (houseNumber and ownerName are required)" }, { status: 400 });
    }

    // Get all existing house numbers to prevent duplicates
    const allExistingHouses = await db.select({ houseNumber: houses.houseNumber }).from(houses);
    const existingHouseNumbers = new Set(allExistingHouses.map(h => h.houseNumber));

    const toInsert = validData.filter(item => !existingHouseNumbers.has(item.houseNumber));
    
    // Prevent duplicate houseNumbers within the uploaded batch itself
    const uniqueToInsert = [];
    const seenInBatch = new Set();
    for (const item of toInsert) {
       if (!seenInBatch.has(item.houseNumber)) {
          seenInBatch.add(item.houseNumber);
          uniqueToInsert.push(item);
       }
    }

    if (uniqueToInsert.length > 0) {
      await db.insert(houses).values(uniqueToInsert);
    }

    const skippedCount = data.length - uniqueToInsert.length;

    return NextResponse.json({ 
      success: true, 
      insertedCount: uniqueToInsert.length,
      skippedCount: skippedCount
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
