"use client";

import { useState } from "react";
import { 
  Send, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  QrCode, 
  Sparkles, 
  Building2, 
  Calendar, 
  Loader2, 
  ArrowRight, 
  BellRing,
  Phone,
  Megaphone,
  Save,
  Smartphone,
  Info
} from "lucide-react";
import LottieIcon from "@/components/LottieIcon";
import ConfirmModal from "@/components/ConfirmModal";

interface BroadcastClientProps {
  zones: string[];
  totalHouses: number;
  totalLinkedLine: number;
  totalOverdueDebt: number;
  overdueHousesCount: number;
  initialLineConfig?: {
    healthDeptPhone?: string;
    announcementText?: string;
    isAnnouncementActive?: boolean;
  };
}

export default function BroadcastClient({
  zones,
  totalHouses,
  totalLinkedLine,
  totalOverdueDebt,
  overdueHousesCount,
  initialLineConfig,
}: BroadcastClientProps) {
  const [activeMainTab, setActiveMainTab] = useState<"dunning" | "announcement">("dunning");

  // Dunning Campaign State
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [minMonths, setMinMonths] = useState<number>(1);
  const [customNote, setCustomNote] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // LINE Bot Announcement & Phone State
  const [healthDeptPhone, setHealthDeptPhone] = useState<string>(initialLineConfig?.healthDeptPhone || "044-631405");
  const [announcementText, setAnnouncementText] = useState<string>(initialLineConfig?.announcementText || "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา");
  const [isAnnouncementActive, setIsAnnouncementActive] = useState<boolean>(initialLineConfig?.isAnnouncementActive ?? true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configMsg, setConfigMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSendBroadcast = async () => {
    setShowConfirm(false);
    setIsSending(true);
    setResultMsg(null);

    try {
      const res = await fetch("/api/broadcast/dunning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: selectedZone,
          minMonths,
          customNote: customNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultMsg({
          type: "success",
          text: `ส่งข้อความแจ้งเตือนสำเร็จ ${data.successCount} หลัง (ข้าม ${data.skippedNoLineCount} หลังที่ยังไม่ผูก LINE, ล้มเหลว ${data.failedCount} หลัง)`,
        });
      } else {
        setResultMsg({
          type: "error",
          text: data.error || "เกิดข้อผิดพลาดในการส่งข้อความ",
        });
      }
    } catch (err: any) {
      setResultMsg({
        type: "error",
        text: "ไม่สามารถส่งข้อความได้: " + err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveLineConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigMsg(null);

    try {
      const res = await fetch("/api/line/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthDeptPhone,
          announcementText,
          isAnnouncementActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfigMsg({
          type: "success",
          text: "บันทึกข้อมูลข่าวสารและเบอร์ติดต่อ LINE Bot เรียบร้อยแล้ว",
        });
      } else {
        setConfigMsg({
          type: "error",
          text: data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        });
      }
    } catch (err: any) {
      setConfigMsg({
        type: "error",
        text: "เกิดข้อผิดพลาด: " + err.message,
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="font-sans pb-12 space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 lg:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <LottieIcon src="/icons/icons8-document.json" size={52} className="shrink-0" loop autoplay />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-2xl lg:text-3xl text-slate-800 tracking-tight">
                แจ้งเตือนทวงหนี้ & ข่าวสาร LINE
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <BellRing size={12} /> LINE Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ส่งการ์ดแจ้งเตือนยอดค้างชำระค่าขยะ และจัดการข้อความประกาศข่าวสารใน LINE Bot ของเทศบาล
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveMainTab("dunning")}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === "dunning"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Send size={14} className={activeMainTab === "dunning" ? "text-[#5B58F2]" : ""} />
            <span>ยิงแจ้งเตือนทวงหนี้ (Bulk Push)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("announcement")}
            className={`flex-1 md:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === "announcement"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Megaphone size={14} className={activeMainTab === "announcement" ? "text-emerald-600" : ""} />
            <span>ข่าวสาร & เบอร์ติดต่อ LINE</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: BULK DUNNING PUSH
      ======================================================== */}
      {activeMainTab === "dunning" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="text-slate-500 text-xs font-medium">ทะเบียนบ้านทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 font-mono">{totalHouses.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">หลัง</span></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-2xs">
              <div className="text-emerald-700 text-xs font-medium flex items-center gap-1">
                <MessageSquare size={13} /> ผูกบัญชี LINE แล้ว
              </div>
              <div className="text-2xl font-bold text-emerald-800 mt-1 font-mono">
                {totalLinkedLine.toLocaleString()} <span className="text-sm font-sans font-normal text-emerald-600">หลัง ({Math.round((totalLinkedLine / (totalHouses || 1)) * 100)}%)</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/30 shadow-2xs">
              <div className="text-amber-700 text-xs font-medium flex items-center gap-1">
                <AlertCircle size={13} /> ลูกบ้านที่ค้างชำระ
              </div>
              <div className="text-2xl font-bold text-amber-800 mt-1 font-mono">{overdueHousesCount.toLocaleString()} <span className="text-sm font-sans font-normal text-amber-600">หลัง</span></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-100 bg-red-50/30 shadow-2xs">
              <div className="text-red-700 text-xs font-medium">ยอดหนี้ค้างชำระรวม</div>
              <div className="text-2xl font-bold text-red-700 mt-1 font-mono">฿{totalOverdueDebt.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Notification Banner */}
          {resultMsg && (
            <div className={`p-4 rounded-2xl text-sm border flex items-center gap-3 ${
              resultMsg.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-red-50 text-red-800 border-red-200"
            }`}>
              {resultMsg.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-red-600 shrink-0" />}
              <span className="font-semibold">{resultMsg.text}</span>
            </div>
          )}

          {/* Main 2-Column Campaign Builder & Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Target Configuration Form (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">1. กำหนดกลุ่มเป้าหมายผู้รับข้อความ</h2>
                <p className="text-xs text-slate-500 mt-0.5">เลือกเงื่อนไขลูกบ้านที่ต้องการส่งแจ้งเตือน</p>
              </div>

              <div className="space-y-4">
                {/* Zone Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-400" />
                    เลือกชุมชนเป้าหมาย
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden cursor-pointer"
                  >
                    <option value="ALL">🌐 ทุกชุมชนในเขตเทศบาลเมืองนางรอง (20 ชุมชน)</option>
                    {zones.map((z) => (
                      <option key={z} value={z}>ชุมชน{z}</option>
                    ))}
                  </select>
                </div>

                {/* Overdue Duration Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    ระยะเวลาค้างชำระ
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { value: 1, label: "ค้าง 1 เดือนขึ้นไป" },
                      { value: 2, label: "ค้าง 2 เดือนขึ้นไป" },
                      { value: 3, label: "ค้าง 3 เดือนขึ้นไป (เร่งด่วน)" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setMinMonths(item.value)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                          minMonths === item.value
                            ? "bg-[#5B58F2] text-white border-[#5B58F2] shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Announcement Header */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-slate-400" />
                    ข้อความประกาศเพิ่มเติม (Optional)
                  </label>
                  <textarea
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="ระบุข้อความประกาศเพิ่มเติม เช่น 'กรุณาชำระภายในวันที่ 5 สิ้นเดือนนี้ เพื่อหลีกเลี่ยงการระงับบริการเก็บขยะ'"
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  * ระบบจะส่งเฉพาะลูกบ้านที่ <strong className="text-emerald-700 font-semibold">ผูก LINE แล้ว</strong> เท่านั้น
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={isSending}
                  className="px-6 py-3 bg-[#5B58F2] hover:bg-[#4A47D1] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#5B58F2]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังส่งข้อความ...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>ส่งแจ้งเตือน LINE ทันที</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Live Interactive Flex Message Preview (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#5B58F2]" /> ตัวอย่างหน้าจอที่ลูกบ้านจะได้รับใน LINE
              </div>

              <div className="bg-[#849EB5] p-5 rounded-3xl shadow-inner flex flex-col items-center justify-center min-h-[420px]">
                {/* Phone Screen Mockup Card */}
                <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 text-slate-800">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">เทศบาลเมืองนางรอง</span>
                      <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-medium">กองสาธารณสุข</span>
                    </div>
                    <div className="text-base font-bold mt-1">แจ้งเตือนยอดค้างชำระ</div>
                    <div className="text-[11px] opacity-90">บ้านเลขที่ 101/1 • ชุมชน{selectedZone === "ALL" ? "หนองรี" : selectedZone}</div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <div className="text-[10px] text-slate-500">ยอดค้างชำระรวม</div>
                      <div className="text-2xl font-bold text-slate-900 font-mono">฿{(minMonths * 20).toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">({minMonths} เดือน)</div>
                    </div>

                    {customNote && (
                      <div className="text-[11px] text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                        📢 {customNote}
                      </div>
                    )}

                    {/* Simulated Payment Action Buttons */}
                    <div className="space-y-2 pt-1">
                      <div className="w-full py-2 bg-emerald-600 text-white rounded-xl text-center text-xs font-bold shadow-xs">
                        📱 สแกน QR Code ชำระเงิน
                      </div>
                      <div className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-center text-xs font-medium">
                        ดูประวัติใบแจ้งหนี้
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] text-center text-slate-400">
                    ระบบชำระค่าธรรมเนียมเทศบาลเมืองนางรอง
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ANNOUNCEMENT & CONTACT CONFIG
      ======================================================== */}
      {activeMainTab === "announcement" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          
          {/* Left Configuration Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800">ตั้งค่าข่าวสาร & เบอร์ติดต่อ LINE Bot</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดเบอร์โทรศัพท์และข้อความประชาสัมพันธ์ที่ประชาชนจะมองเห็นเมื่อใช้งาน LINE Bot
              </p>
            </div>

            {configMsg && (
              <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
                configMsg.type === "success" 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                  : "bg-red-50 text-red-800 border-red-200"
              }`}>
                {configMsg.type === "success" ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : <AlertCircle size={16} className="shrink-0 text-red-600" />}
                <span className="font-bold">{configMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveLineConfig} className="space-y-5">
              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone size={14} className="text-emerald-600" />
                  เบอร์โทรศัพท์กองสาธารณสุขและสิ่งแวดล้อม
                </label>
                <input
                  type="text"
                  required
                  value={healthDeptPhone}
                  onChange={(e) => setHealthDeptPhone(e.target.value)}
                  placeholder="เช่น 044-631405"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden transition-all"
                />
                <p className="text-[11px] text-slate-400">
                  เบอร์นี้จะแสดงบน Flex Card เมื่อประชาชนกด &ldquo;ติดต่อเจ้าหน้าที่&rdquo; ใน LINE เพื่อให้ประชาชนกดโทรออกได้ทันที
                </p>
              </div>

              {/* Announcement Box with iOS Switch */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Megaphone size={14} className="text-emerald-600" />
                    ข้อความประกาศข่าวสารใน LINE Bot
                  </label>
                  
                  {/* iOS Style Animated Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnnouncementActive}
                      onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ml-2 text-xs font-bold text-slate-700">
                      {isAnnouncementActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </label>
                </div>

                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="ระบุข้อความประกาศ..."
                  rows={4}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden transition-all"
                />

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info size={13} className="text-slate-400 shrink-0" />
                  ข้อความนี้จะปรากฏให้ประชาชนทุกคนเห็นเมื่อทักแชท LINE หรือกดเมนูติดต่อ
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังบันทึกข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>บันทึกข้อมูลข่าวสาร & เบอร์ติดต่อ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Preview: Contact Card in LINE (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" /> ตัวอย่างหน้าจอติดต่อที่ลูกบ้านจะได้รับใน LINE
            </div>

            <div className="bg-[#849EB5] p-5 rounded-3xl shadow-inner flex flex-col items-center justify-center min-h-[420px]">
              {/* Phone Screen Mockup Card */}
              <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 text-slate-800">
                <div className="p-4 space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <Phone size={16} className="text-emerald-600" /> ติดต่อเจ้าหน้าที่
                    </div>
                    <div className="text-[11px] text-slate-500">กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง</div>
                  </div>

                  {isAnnouncementActive && announcementText && (
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60 text-[11px] text-blue-900 leading-relaxed space-y-0.5">
                      <div className="font-bold flex items-center gap-1 text-[10px] text-blue-700">
                        📢 ข่าวสารประชาสัมพันธ์
                      </div>
                      <div>{announcementText}</div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">เบอร์โทรศัพท์:</span>
                      <span className="font-mono font-bold text-slate-900">{healthDeptPhone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">เวลาทำการ:</span>
                      <span className="text-slate-700 text-[11px]">จ.-ศ. (08:30-16:30)</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-center text-xs font-bold shadow-xs flex items-center justify-center gap-1.5">
                      <Phone size={13} /> โทร. กองสาธารณสุข ({healthDeptPhone})
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] text-center text-slate-400">
                  ระบบบริการประชาชน เทศบาลเมืองนางรอง
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Confirmation Modal for Dunning */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSendBroadcast}
        title="ยืนยันการส่งข้อความแจ้งเตือนผ่าน LINE"
        description={`คุณต้องการส่งข้อความแจ้งเตือนยอดค้างชำระไปยังลูกบ้าน (${selectedZone === "ALL" ? "ทุกชุมชน" : `ชุมชน${selectedZone}`}, ค้าง ${minMonths} เดือนขึ้นไป) ใช่หรือไม่?`}
        confirmText="ยืนยันการส่งทันที"
        variant="primary"
      />
    </div>
  );
}
