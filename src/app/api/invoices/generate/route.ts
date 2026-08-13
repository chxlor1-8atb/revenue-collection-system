import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { monthYear, amount } = await request.json();

    if (!monthYear || !amount) {
      return NextResponse.json({ error: "Missing monthYear or amount" }, { status: 400 });
    }

    // 1. Fetch all houses
    const allHouses = await db.select({ id: houses.id }).from(houses);
    
    if (allHouses.length === 0) {
       return NextResponse.json({ error: "No houses found" }, { status: 400 });
    }

    // 2. Prepare invoices data
    const newInvoices = allHouses.map(house => ({
      houseId: house.id,
      monthYear: monthYear,
      amount: amount,
      status: 'unpaid'
    }));

    // 3. Bulk insert with conflict resolution
    await db.insert(invoices).values(newInvoices).onConflictDoNothing({
      target: [invoices.houseId, invoices.monthYear]
    });

    return NextResponse.json({ success: true, count: newInvoices.length });
  } catch (error) {
    console.error("Generate Invoice Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
