import { db } from "@/lib/db";
import { transactions, invoices, houses, collectors, lineMessages } from "@/lib/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { CheckCircle2, Smartphone, Globe, Calendar, Home, User } from "lucide-react";
import SlipModalButton from "@/components/SlipModalButton";

export const dynamic = "force-dynamic";

function formatThaiMonth(monthYear: string) {
  const thaiMonths = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const [year, month] = monthYear.split("-");
  return `${thaiMonths[parseInt(month)]} ${parseInt(year) + 543}`;
}

export default async function HistoryPage() {
  // Fetch all verified transactions
  const verifiedTxs = await db.select()
    .from(transactions)
    .where(eq(transactions.slipStatus, "verified"))
    .orderBy(desc(transactions.paidAt));

  // Fetch related invoices + house info
  let historyItems: any[] = [];

  if (verifiedTxs.length > 0) {
    const txIds = verifiedTxs.map(t => t.id);

    const relatedInvoices = await db.select({
      transactionId: invoices.transactionId,
      monthYear: invoices.monthYear,
      amount: invoices.amount,
      houseNumber: houses.houseNumber,
      ownerName: houses.ownerName,
    })
      .from(invoices)
      .innerJoin(houses, eq(invoices.houseId, houses.id))
      .where(inArray(invoices.transactionId, txIds));

    // Fetch LINE message info for those txIds (to know if paid via LINE)
    const lineMsg = await db.select({
      transactionId: lineMessages.transactionId,
      senderName: lineMessages.senderName,
    })
      .from(lineMessages)
      .where(inArray(lineMessages.transactionId, txIds));

    const lineMsgMap = new Map(lineMsg.map(m => [m.transactionId, m]));

    historyItems = verifiedTxs.map(tx => {
      const txInvoices = relatedInvoices.filter(inv => inv.transactionId === tx.id);
      const lineData = lineMsgMap.get(tx.id);
      return {
        ...tx,
        invoices: txInvoices,
        houseNumber: txInvoices[0]?.houseNumber || "ไม่ระบุ",
        ownerName: txInvoices[0]?.ownerName || "ไม่ระบุ",
        months: txInvoices.map(inv => inv.monthYear),
        paidVia: tx.verifiedBy === "line_bot" ? "LINE Bot" : lineData ? "LINE Bot" : "เว็บไซต์",
        senderName: lineData?.senderName || null,
      };
    });
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-3xl text-[#1F2E22]">ประวัติการรับชำระเงิน</h1>
        <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full border border-emerald-200">
          ทั้งหมด {historyItems.length} รายการ
        </span>
      </div>

      {historyItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 text-center py-20 flex flex-col items-center justify-center">
          <CheckCircle2 size={52} strokeWidth={1} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium text-lg">ยังไม่มีประวัติการชำระเงิน</p>
          <p className="text-slate-400 text-sm mt-1">รายการที่ชำระแล้วจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header strip */}
              <div className="flex items-center justify-between px-6 py-3 bg-emerald-50 border-b border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 size={16} className="fill-emerald-100" />
                  <span className="text-sm font-semibold">ชำระแล้ว</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  {item.paidVia === "LINE Bot" ? (
                    <><Smartphone size={12} /> LINE Bot</>
                  ) : (
                    <><Globe size={12} /> เว็บไซต์</>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* House */}
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                    <Home size={11} /> บ้านเลขที่
                  </div>
                  <div className="font-mono font-bold text-slate-800">{item.houseNumber}</div>
                  <div className="text-sm text-slate-500">{item.ownerName}</div>
                </div>

                {/* Months */}
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <Calendar size={11} /> รายการที่จ่าย
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.months.length > 0 ? item.months.map((m: string) => (
                      <span key={m} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {formatThaiMonth(m)}
                      </span>
                    )) : <span className="text-xs text-slate-400">-</span>}
                  </div>
                </div>

                {/* Sender */}
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                    <User size={11} /> ผู้โอน
                  </div>
                  <div className="text-sm font-medium text-slate-700">{item.senderName || "ไม่ระบุ"}</div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-0.5">ยอดเงิน</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ฿{parseFloat(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {item.paidAt ? new Date(item.paidAt).toLocaleDateString("th-TH", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    }) : "-"}
                  </div>
                  {item.slipImageUrl && item.slipImageUrl !== "pending" && (
                    <div className="mt-2 flex justify-end">
                      <SlipModalButton imageUrl={item.slipImageUrl} buttonStyle="history" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
