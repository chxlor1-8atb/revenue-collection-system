import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { houses, transactions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ houseId: string }> | { houseId: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const houseId = parseInt(resolvedParams.houseId, 10);
    const { amount, action } = await request.json(); // action: 'add' | 'set'

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const [house] = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1);
    if (!house) return NextResponse.json({ error: "House not found" }, { status: 404 });

    const currentWallet = parseFloat(house.walletBalance || "0");
    const newWallet = action === 'set' ? numAmount : currentWallet + numAmount;

    await db.update(houses)
      .set({ walletBalance: newWallet.toFixed(2) })
      .where(eq(houses.id, houseId));

    return NextResponse.json({ success: true, walletBalance: newWallet.toFixed(2) });
  } catch (error) {
    console.error("Wallet Adjustment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
