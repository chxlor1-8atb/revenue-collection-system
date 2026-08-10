import { db } from "@/lib/db";
import { lineMessages } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function LineSlipsPage() {
  const pendingSlips = await db
    .select()
    .from(lineMessages)
    .where(eq(lineMessages.status, "pending"))
    .orderBy(desc(lineMessages.createdAt));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold font-serif mb-6 text-slate-800">
        สลิปจาก LINE (รอดำเนินการ)
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {pendingSlips.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-sans">
            ไม่มีสลิปจาก LINE ที่รอดำเนินการ
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">วัน-เวลา</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">รูปสลิป</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">ข้อมูลจาก Slip2Go</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans">บ้านเลขที่ (ที่พิมพ์แจ้งมา)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-sans text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingSlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">
                    {slip.createdAt?.toLocaleString("th-TH")}
                  </td>
                  <td className="px-6 py-4">
                    {slip.imageUrl ? (
                      <a href={slip.imageUrl} target="_blank" rel="noreferrer">
                        <img src={slip.imageUrl} alt="Slip" className="w-16 h-16 object-cover rounded-md border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm font-sans">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-sans">
                    {slip.isVerified ? (
                      <div className="flex flex-col">
                        <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-md inline-block w-fit mb-1 border border-emerald-100">
                          สลิปแท้
                        </span>
                        <span className="text-xs text-slate-500 mt-1">ยอดเงิน: <strong className="text-slate-800">฿{slip.amount}</strong></span>
                        <span className="text-xs text-slate-500">ผู้โอน: {slip.senderName}</span>
                      </div>
                    ) : (
                      <span className="text-red-500 font-bold text-sm bg-red-50 px-2 py-1 rounded-md inline-block border border-red-100">
                        ไม่ผ่านการตรวจสอบ
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-sans">
                    {slip.houseNumber ? (
                      <span className="font-semibold text-slate-800">{slip.houseNumber}</span>
                    ) : (
                      <span className="text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded-full">ยังไม่ระบุบ้านเลขที่</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm px-4 py-2 rounded-lg shadow-sm transition-colors mr-2">
                      จับคู่บ้าน / อนุมัติ
                    </button>
                    <button className="bg-red-50 hover:bg-red-100 text-red-600 font-sans text-sm px-4 py-2 rounded-lg transition-colors">
                      ปฏิเสธ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
