import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, invoices, houses, lineMessages } from "@/lib/schema";
import { eq, desc, inArray, and, or, ilike, sql, gte, lte, notInArray } from "drizzle-orm";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month, 10)]} ${parseInt(year, 10) + 543}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const search = url.searchParams.get("search") || "";
    const startDate = url.searchParams.get("startDate") || "";
    const endDate = url.searchParams.get("endDate") || "";
    const isExport = url.searchParams.get("export") === "csv";
    const status = url.searchParams.get("status") || "verified";
    const channel = url.searchParams.get("channel") || "all";
    const monthYear = url.searchParams.get("monthYear") || "";

    // Build conditions
    const conditions = [];
    
    if (status === "all") {
      conditions.push(inArray(transactions.slipStatus, ["verified", "voided"]));
    } else {
      conditions.push(eq(transactions.slipStatus, status));
    }

    if (channel === "line") {
      const lineMsgTxIds = await db.select({ txId: lineMessages.transactionId }).from(lineMessages).where(sql`${lineMessages.transactionId} IS NOT NULL`);
      const lineTxIds = lineMsgTxIds.map(m => m.txId as number);
      conditions.push(or(
        eq(transactions.verifiedBy, "line_bot"),
        lineTxIds.length > 0 ? inArray(transactions.id, lineTxIds) : sql`false`
      ));
    } else if (channel === "web") {
      const lineMsgTxIds = await db.select({ txId: lineMessages.transactionId }).from(lineMessages).where(sql`${lineMessages.transactionId} IS NOT NULL`);
      const lineTxIds = lineMsgTxIds.map(m => m.txId as number);
      conditions.push(and(
        or(sql`${transactions.verifiedBy} IS NULL`, sql`${transactions.verifiedBy} != 'line_bot'`),
        lineTxIds.length > 0 ? notInArray(transactions.id, lineTxIds) : undefined
      ));
    }

    if (monthYear) {
      const matchedInvoices = await db.select({ transactionId: invoices.transactionId })
        .from(invoices)
        .where(and(eq(invoices.monthYear, monthYear), sql`${invoices.transactionId} IS NOT NULL`));
      
      const monthTxIds = Array.from(new Set(matchedInvoices.map(i => i.transactionId as number)));
      if (monthTxIds.length === 0) {
        return isExport ? new NextResponse("\uFEFF", { headers: { "Content-Type": "text/csv; charset=utf-8" } }) 
                        : NextResponse.json({ data: [], totalCount: 0, totalAmount: 0 });
      }
      conditions.push(inArray(transactions.id, monthTxIds));
    }

    if (startDate) {
      conditions.push(gte(transactions.paidAt, new Date(`${startDate}T00:00:00.000Z`)));
    }
    if (endDate) {
      conditions.push(lte(transactions.paidAt, new Date(`${endDate}T23:59:59.999Z`)));
    }

    let matchingTxIds: number[] | null = null;

    if (search) {
      // Find houses matching search
      const matchedHouses = await db.select({ id: houses.id }).from(houses)
        .where(or(
          ilike(houses.houseNumber, `%${search}%`),
          ilike(houses.ownerName, `%${search}%`)
        ));
      
      const houseIds = matchedHouses.map(h => h.id);

      if (houseIds.length === 0) {
        // If no houses match, return empty
        return isExport ? new NextResponse("\uFEFF", { headers: { "Content-Type": "text/csv; charset=utf-8" } }) 
                        : NextResponse.json({ data: [], totalCount: 0, totalAmount: 0 });
      }

      // Find transactions for these houses
      const matchedInvoices = await db.select({ transactionId: invoices.transactionId })
        .from(invoices)
        .where(and(inArray(invoices.houseId, houseIds), sql`${invoices.transactionId} IS NOT NULL`));

      matchingTxIds = Array.from(new Set(matchedInvoices.map(i => i.transactionId as number)));

      if (matchingTxIds.length === 0) {
         return isExport ? new NextResponse("\uFEFF", { headers: { "Content-Type": "text/csv; charset=utf-8" } }) 
                        : NextResponse.json({ data: [], totalCount: 0, totalAmount: 0 });
      }

      conditions.push(inArray(transactions.id, matchingTxIds));
    }

    // First pass to get total count and total amount
    const allMatchingTxs = await db.select({
      id: transactions.id,
      amount: transactions.amount
    }).from(transactions).where(and(...conditions));

    const totalCount = allMatchingTxs.length;
    const totalAmount = allMatchingTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);

    // Sort logic (descending by paidAt)
    const pagedTxsQuery = db.select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.paidAt));

    if (!isExport) {
      pagedTxsQuery.limit(limit).offset((page - 1) * limit);
    }

    const pagedTxs = await pagedTxsQuery;
    const pagedTxIds = pagedTxs.map(t => t.id);

    let historyItems: any[] = [];

    if (pagedTxIds.length > 0) {
      const relatedInvoices = await db.select({
        transactionId: invoices.transactionId,
        monthYear: invoices.monthYear,
        amount: invoices.amount,
        houseNumber: houses.houseNumber,
        ownerName: houses.ownerName,
      })
        .from(invoices)
        .innerJoin(houses, eq(invoices.houseId, houses.id))
        .where(inArray(invoices.transactionId, pagedTxIds));

      const lineMsg = await db.select({
        transactionId: lineMessages.transactionId,
        senderName: lineMessages.senderName,
      })
        .from(lineMessages)
        .where(inArray(lineMessages.transactionId, pagedTxIds));

      const lineMsgMap = new Map(lineMsg.map(m => [m.transactionId, m]));

      historyItems = pagedTxs.map(tx => {
        const txInvoices = relatedInvoices.filter(inv => inv.transactionId === tx.id);
        const lineData = lineMsgMap.get(tx.id);
        return {
          ...tx,
          invoices: txInvoices,
          houseNumber: txInvoices[0]?.houseNumber || "ไม่ระบุ",
          ownerName: txInvoices[0]?.ownerName || "ไม่ระบุ",
          months: txInvoices.map(inv => inv.monthYear),
          paidVia: tx.verifiedBy === "line_bot" ? "LINE Bot" : tx.verifiedBy === "admin_cash" ? "เงินสด (หน้าเคาน์เตอร์)" : lineData ? "LINE Bot" : "เว็บไซต์",
          senderName: lineData?.senderName || null,
        };
      });
    }

    if (isExport) {
      // Create CSV
      const header = ["รหัสทำรายการ", "วันที่ชำระ", "สถานะ", "บ้านเลขที่", "ชื่อเจ้าบ้าน", "รอบเดือน", "ช่องทาง", "ผู้โอน", "ยอดเงิน"];
      const rows = historyItems.map(item => [
        item.id,
        item.paidAt ? new Date(item.paidAt).toLocaleString("th-TH") : "",
        item.slipStatus === "voided" ? "ยกเลิกแล้ว" : "ชำระแล้ว",
        item.houseNumber,
        item.ownerName,
        item.months.map((m: string) => formatThaiMonth(m)).join(", "),
        item.paidVia,
        item.senderName || "",
        item.amount
      ]);

      const csvContent = [
        header.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      // Prepend BOM for Excel compatibility
      return new NextResponse("\uFEFF" + csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="revenue_history_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({
      data: historyItems,
      totalCount,
      totalAmount
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
