"use client";

import { useState } from "react";
import { Smartphone, Phone, Megaphone, Save, CheckCircle2, AlertCircle, Loader2, Sparkles, MessageCircle, ExternalLink } from "lucide-react";
import LottieIcon from "@/components/LottieIcon";

interface LineManagerClientProps {
  initialConfig: {
    emergencyPhone?: string;
    healthDeptPhone?: string;
    announcementText?: string;
    isAnnouncementActive?: boolean;
  };
}

export default function LineManagerClient({ initialConfig }: LineManagerClientProps) {
  const [emergencyPhone, setEmergencyPhone] = useState(initialConfig.emergencyPhone || "044-631405");
  const [healthDeptPhone, setHealthDeptPhone] = useState(initialConfig.healthDeptPhone || "044-631405");
  const [announcementText, setAnnouncementText] = useState(initialConfig.announcementText || "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา");
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(initialConfig.isAnnouncementActive ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/line/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyPhone,
          healthDeptPhone,
          announcementText,
          isAnnouncementActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus({ type: "success", text: "บันทึกการตั้งค่า LINE Bot สำเร็จเรียบร้อยแล้ว" });
      } else {
        setSaveStatus({ type: "error", text: data.error || "เกิดข้อผิดพลาดในการบันทึก" });
      }
    } catch (err: any) {
      setSaveStatus({ type: "error", text: "เกิดข้อผิดพลาด: " + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="font-sans pb-12 space-y-6">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 lg:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <LottieIcon src="/icons/icons8-document.json" size={52} className="shrink-0" loop autoplay />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-2xl lg:text-3xl text-slate-800 tracking-tight">
                จัดการ LINE Bot & ข่าวสารประชาสัมพันธ์
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <Smartphone size={12} /> LINE Official Account
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ปรับปรุงเบอร์โทรศัพท์ติดต่อสายด่วน ข้อความประกาศ และเมนูอัตโนมัติใน LINE OA
            </p>
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-2xl text-sm border flex items-center gap-3 ${
          saveStatus.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {saveStatus.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
          <span className="font-semibold">{saveStatus.text}</span>
        </div>
      )}

      {/* 2. Main Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: 7 Cols */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">ตั้งค่าข้อมูลประชาสัมพันธ์ใน LINE Bot</h2>
            <p className="text-xs text-slate-500 mt-0.5">ข้อมูลนี้จะถูกนำไปตอบกลับอัตโนมัติเมื่อลูกบ้านสอบถาม</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                เบอร์โทรศัพท์กองสาธารณสุขและสิ่งแวดล้อม
              </label>
              <input
                type="text"
                value={healthDeptPhone}
                onChange={(e) => setHealthDeptPhone(e.target.value)}
                placeholder="เช่น 044-631405"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                เบอร์โทรศัพท์ติดต่อสายด่วน / เหตุฉุกเฉิน
              </label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="เช่น 044-631405 หรือ 199"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Megaphone size={14} className="text-slate-400" />
                  ข้อความประกาศข่าวสารประชาสัมพันธ์
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isAnnouncementActive}
                    onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                    className="rounded text-[#5B58F2] focus:ring-[#5B58F2]"
                  />
                  <span className="text-slate-600 font-medium">เปิดใช้งานประกาศ</span>
                </label>
              </div>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="ระบุข้อความประกาศ..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#5B58F2] hover:bg-[#4A47D1] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#5B58F2]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>บันทึกการตั้งค่า</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Preview: 5 Cols */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#5B58F2]" /> ตัวอย่างเมนูติดต่อใน LINE OA
          </div>

          <div className="bg-[#849EB5] p-5 rounded-3xl shadow-inner flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 text-slate-800">
              <div className="bg-gradient-to-r from-[#5B58F2] to-indigo-600 p-4 text-white">
                <div className="text-xs font-bold uppercase opacity-90">เทศบาลเมืองนางรอง</div>
                <div className="text-base font-bold mt-0.5">ศูนย์บริการข้อมูลประชาชน</div>
                <div className="text-[11px] opacity-80">กองสาธารณสุขและสิ่งแวดล้อม</div>
              </div>

              <div className="p-4 space-y-3 text-xs">
                {isAnnouncementActive && (
                  <div className="bg-indigo-50 text-indigo-900 p-3 rounded-xl border border-indigo-100 text-[11px] leading-relaxed">
                    📢 <strong>ประกาศ:</strong> {announcementText}
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="font-bold text-slate-800 text-[11px]">📞 ช่องทางติดต่อราชการ</div>
                  <div className="text-slate-600 flex justify-between">
                    <span>กองสาธารณสุข:</span>
                    <strong className="font-mono text-slate-900">{healthDeptPhone}</strong>
                  </div>
                  <div className="text-slate-600 flex justify-between">
                    <span>สายด่วนฉุกเฉิน:</span>
                    <strong className="font-mono text-slate-900">{emergencyPhone}</strong>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-1">
                  เปิดทำการ: จันทร์ - ศุกร์ 08:30 - 16:30 น.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
