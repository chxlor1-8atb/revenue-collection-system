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
    const sortBy = url.searchParams.get("sortBy") || "paidAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // Build conditions
    const conditions = [];
    
    if (status === "all") {
      conditions.push(inArray(transactions.slipStatus, ["verified", "voided"]));
    } else {
      conditions.push(eq(transactions.slipStatus, status));
    }

    if (channel === "line") {
      conditions.push(or(
        eq(transactions.verifiedBy, "line_bot"),
        sql`EXISTS (SELECT 1 FROM ${lineMessages} WHERE ${lineMessages.transactionId} = ${transactions.id})`
      ));
    } else if (channel === "web") {
      conditions.push(and(
        or(sql`${transactions.verifiedBy} IS NULL`, sql`${transactions.verifiedBy} != 'line_bot'`),
        sql`NOT EXISTS (SELECT 1 FROM ${lineMessages} WHERE ${lineMessages.transactionId} = ${transactions.id})`
      ));
    }

    if (monthYear) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${invoices} 
        WHERE ${invoices.transactionId} = ${transactions.id} 
        AND ${invoices.monthYear} = ${monthYear}
      )`);
    }

    if (startDate) {
      conditions.push(gte(transactions.paidAt, new Date(`${startDate}T00:00:00.000Z`)));
    }
    if (endDate) {
      conditions.push(lte(transactions.paidAt, new Date(`${endDate}T23:59:59.999Z`)));
    }

    if (search.trim()) {
      const q = search.trim();
      conditions.push(or(
        ilike(transactions.slipRefId, `%${q}%`),
        ilike(transactions.payerNote, `%${q}%`),
        sql`EXISTS (
          SELECT 1 FROM ${invoices}
          JOIN ${houses} ON ${invoices.houseId} = ${houses.id}
          WHERE ${invoices.transactionId} = ${transactions.id}
          AND (${ilike(houses.houseNumber, `%${q}%`)} OR ${ilike(houses.ownerName, `%${q}%`)})
        )`
      ));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting expression
    let orderExpr;
    if (sortBy === "amount") {
      orderExpr = sortOrder === "asc" ? sql`${transactions.amount}::numeric ASC` : sql`${transactions.amount}::numeric DESC`;
    } else if (sortBy === "id") {
      orderExpr = sortOrder === "asc" ? sql`${transactions.id} ASC` : sql`${transactions.id} DESC`;
    } else if (sortBy === "houseNumber") {
      orderExpr = sortOrder === "asc" 
        ? sql`(SELECT ${houses.houseNumber} FROM ${invoices} JOIN ${houses} ON ${invoices.houseId} = ${houses.id} WHERE ${invoices.transactionId} = ${transactions.id} LIMIT 1) ASC`
        : sql`(SELECT ${houses.houseNumber} FROM ${invoices} JOIN ${houses} ON ${invoices.houseId} = ${houses.id} WHERE ${invoices.transactionId} = ${transactions.id} LIMIT 1) DESC`;
    } else {
      orderExpr = sortOrder === "asc" ? sql`${transactions.paidAt} ASC` : sql`${transactions.paidAt} DESC`;
    }

    // Fast concurrent aggregation & pagination query
    const pagedTxsQuery = db.select()
      .from(transactions)
      .where(whereClause)
      .orderBy(orderExpr);

    if (!isExport) {
      pagedTxsQuery.limit(limit).offset((page - 1) * limit);
    }

    const [summaryResult, pagedTxs] = await Promise.all([
      db.select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}::numeric), 0)`
      }).from(transactions).where(whereClause),
      pagedTxsQuery
    ]);

    const totalCount = Number(summaryResult[0]?.count || 0);
    const totalAmount = Number(summaryResult[0]?.totalAmount || 0);
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
          verifiedBy: tx.verifiedBy || (lineData ? "line_bot" : "ระบบ"),
        };
      });
    }

    if (isExport) {
      // Create CSV
      const header = ["รหัสทำรายการ", "วันที่ชำระ", "สถานะ", "บ้านเลขที่", "ชื่อเจ้าบ้าน", "รอบเดือน", "ช่องทาง", "ผู้โอน", "ยอดเงิน", "ผู้ตรวจสอบ"];
      const rows = historyItems.map(item => [
        item.id,
        item.paidAt ? new Date(item.paidAt).toLocaleString("th-TH") : "",
        item.slipStatus === "voided" ? "ยกเลิกแล้ว" : "ชำระแล้ว",
        item.houseNumber,
        item.ownerName,
        item.months.map((m: string) => formatThaiMonth(m)).join(", "),
        item.paidVia,
        item.senderName || "",
        item.amount,
        item.verifiedBy === "line_bot" ? "ระบบอัตโนมัติ" : item.verifiedBy || "เจ้าหน้าที่"
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
