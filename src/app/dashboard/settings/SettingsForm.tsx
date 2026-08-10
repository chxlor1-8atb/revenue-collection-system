"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({
  collectorId,
  initialName,
  initialPromptPay,
}: {
  collectorId: number;
  initialName: string;
  initialPromptPay: string;
}) {
  const [name, setName] = useState(initialName);
  const [promptPayId, setPromptPayId] = useState(initialPromptPay);
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
        body: JSON.stringify({ id: collectorId, name, promptPayId }),
      });

      if (res.ok) {
        setMessage("✅ บันทึกข้อมูลสำเร็จ QR Code เปลี่ยนแล้วครับ");
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
      <h2 className="text-xl font-bold font-sans text-slate-800 mb-6">ตั้งค่าบัญชีรับเงิน (QR Code)</h2>
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
            เบอร์พร้อมเพย์ (เลขบัตรปชช. / เบอร์โทร / เลขนิติบุคคล)
          </label>
          <input
            type="text"
            required
            value={promptPayId}
            onChange={(e) => setPromptPayId(e.target.value)}
            placeholder="เช่น 0994000160759"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-mono"
          />
          <p className="text-xs text-slate-500 mt-2 font-sans">
            *ระบบจะนำเบอร์พร้อมเพย์นี้ไปสร้างเป็นรูป QR Code ในหน้าชำระเงินอัตโนมัติ
          </p>
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
      </form>
    </div>
  );
}
