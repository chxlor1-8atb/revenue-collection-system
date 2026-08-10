"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Receipt } from "lucide-react";

export default function GenerateInvoiceButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    const month = prompt("กรุณาระบุเดือน/ปี สำหรับบิลที่จะสร้าง (เช่น 2024-04):", new Date().toISOString().slice(0, 7));
    if (!month) return;

    if (!confirm(`คุณต้องการสร้างบิลค่าขยะรอบเดือน ${month} ให้กับบ้านทุกหลังใช่หรือไม่?`)) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthYear: month, amount: "20.00" })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`สำเร็จ! สร้างบิลประจำเดือน ${month} จำนวน ${data.count} ใบเรียบร้อยแล้ว`);
        router.refresh();
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      className="btn font-sans border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white text-sm py-2 px-4 flex items-center gap-1.5"
    >
      <Receipt className="w-4 h-4 text-emerald-400" />
      {isGenerating ? "กำลังสร้าง..." : "สร้างบิลประจำเดือน (ทุกบ้าน)"}
    </button>
  );
}
