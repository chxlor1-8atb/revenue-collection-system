"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({
  collectorId,
  initialName,
  initialPromptPay,
  initialAutoBillingDay,
  initialDueDateDays,
  initialAutoRemindDays,
}: {
  collectorId: number;
  initialName: string;
  initialPromptPay: string;
  initialAutoBillingDay: number | null;
  initialDueDateDays: number | null;
  initialAutoRemindDays: number | null;
}) {
  const [name, setName] = useState(initialName);
  const [promptPayId, setPromptPayId] = useState(initialPromptPay);
  const [autoBillingDay, setAutoBillingDay] = useState<string>(initialAutoBillingDay?.toString() || "");
  const [dueDateDays, setDueDateDays] = useState<string>(initialDueDateDays?.toString() || "");
  const [autoRemindDays, setAutoRemindDays] = useState<string>(initialAutoRemindDays?.toString() || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings/promptpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: collectorId, name, promptPayId, autoBillingDay: autoBillingDay ? parseInt(autoBillingDay) : null, dueDateDays: dueDateDays ? parseInt(dueDateDays) : null, autoRemindDays: autoRemindDays ? parseInt(autoRemindDays) : null }),
      });

      if (res.ok) {
        setMessage("✅ บันทึกข้อมูลสำเร็จ");
        router.refresh();
      } else {
        setMessage("❌ เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      setMessage("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold font-sans text-slate-800 mb-6">ตั้งค่าบัญชีรับเงิน</h2>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 font-sans">
            ชื่อบัญชี / ชื่อหน่วยงาน
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น เทศบาลเมืองนางรอง"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-sans"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 font-sans">
            เบอร์พร้อมเพย์
          </label>
          <input
            type="text"
            required
            value={promptPayId}
            onChange={(e) => setPromptPayId(e.target.value)}
            placeholder="เช่น 0994000160759"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-mono"
          />
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm font-sans ${message.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#1F2E22] hover:bg-[#2d4332] text-white font-bold py-3 px-4 rounded-lg transition-colors font-sans shadow-md disabled:opacity-50"
        >
          {isLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
              
        <div className="pt-6 border-t border-slate-200 mt-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">ตั้งค่าระบบบิลและทวงหนี้อัตโนมัติ</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                วันที่ออกบิลอัตโนมัติ (วันที่ของทุกเดือน)
              </label>
              <input
                type="number"
                min="1"
                max="28"
                value={autoBillingDay}
                onChange={(e) => setAutoBillingDay(e.target.value)}
                placeholder="เช่น 25 (เว้นว่างถ้าไม่ต้องการให้ออกบิลอัตโนมัติ)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1">ระบบจะส่งแจ้งเตือน LINE ทันทีที่ออกบิล (แนะนำ 1-28)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                จำนวนวันครบกำหนดชำระ (Due Date)
              </label>
              <input
                type="number"
                min="1"
                value={dueDateDays}
                onChange={(e) => setDueDateDays(e.target.value)}
                placeholder="เช่น 10 (หมายถึงให้เวลาจ่าย 10 วันนับจากวันออกบิล)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                จำนวนวันที่เลยกำหนด แล้วให้ทวงหนี้ (Auto-Remind)
              </label>
              <input
                type="number"
                min="1"
                value={autoRemindDays}
                onChange={(e) => setAutoRemindDays(e.target.value)}
                placeholder="เช่น 3 (หมายถึงเลยกำหนด 3 วันแล้วให้บอททวงหนี้)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
