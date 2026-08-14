import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses, invoices } from "@/lib/schema";
import { auth } from "@/lib/auth";

import { z } from "zod";

const generateSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Invalid format, expected YYYY-MM"),
  amount: z.union([z.string(), z.number()]).transform(v => v.toString()).refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Invalid amount"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = generateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    
    const { monthYear, amount } = parseResult.data;

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
