"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({
  collectorId,
  initialName,
  initialPromptPay,
  initialQrCodeImageUrl,
}: {
  collectorId: number;
  initialName: string;
  initialPromptPay: string;
  initialQrCodeImageUrl?: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [promptPayId, setPromptPayId] = useState(initialPromptPay);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialQrCodeImageUrl || null);
  const [removeQrCode, setRemoveQrCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrCodeFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemoveQrCode(false); // They uploaded a new one, so don't remove
    }
  };

  const handleRemoveImage = () => {
    setQrCodeFile(null);
    setPreviewUrl(null);
    setRemoveQrCode(true); // Flag to tell server to delete
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      let qrCodeBase64 = null;
      if (qrCodeFile) {
        qrCodeBase64 = await toBase64(qrCodeFile);
      }

      const res = await fetch("/api/settings/promptpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: collectorId, name, promptPayId, qrCodeBase64, removeQrCode }),
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
            เบอร์พร้อมเพย์ (สำหรับสร้างอัตโนมัติหากไม่อัปโหลดรูป)
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

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 font-sans">
            รูป QR Code (ไม่บังคับ)
          </label>
          <p className="text-xs text-slate-500 mb-3 font-sans">
            หากอัปโหลดรูป ระบบจะแสดงรูปนี้แทนการสร้างอัตโนมัติจากเบอร์พร้อมเพย์
          </p>
          
          <div className="flex flex-col items-start gap-4">
            {previewUrl && (
              <div className="relative group p-2 border border-slate-200 rounded-lg bg-slate-50">
                <img src={previewUrl} alt="QR Code Preview" className="w-32 h-32 object-contain" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ลบรูปภาพ"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            )}
            
            {!previewUrl && (
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 w-32 h-32 flex flex-col items-center justify-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <span className="text-xs">ไม่มีรูปภาพ</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors font-sans border border-slate-200">
                <span>{previewUrl ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูป QR Code'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="bg-white hover:bg-red-50 text-red-600 py-2 px-4 rounded-lg text-sm font-medium transition-colors font-sans border border-red-200"
                >
                  ลบรูปทิ้ง
                </button>
              )}
            </div>
          </div>
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
