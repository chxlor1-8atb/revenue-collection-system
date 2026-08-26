"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CreditCard, 
  Smartphone, 
  BookOpen, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Megaphone, 
  Calendar, 
  Clock, 
  Loader2, 
  Send, 
  Shield, 
  ArrowRight, 
  Users, 
  BarChart3,
  Building2,
  Sparkles,
  ExternalLink
} from "lucide-react";

export default function SettingsForm({
  collectorId,
  initialName,
  initialPromptPay,
  initialAutoBillingDay,
  initialDueDateDays,
  initialAutoRemindDays,
  initialLineConfig,
  initialReceiptBookConfig,
}: {
  collectorId: number;
  initialName: string;
  initialPromptPay: string;
  initialAutoBillingDay: number | null;
  initialDueDateDays: number | null;
  initialAutoRemindDays: number | null;
  initialLineConfig?: any;
  initialReceiptBookConfig?: any;
}) {
  const [activeTab, setActiveTab] = useState<"account" | "line" | "receipt">("account");

  // Tab 1: Account & Billing Schedule
  const [name, setName] = useState(initialName);
  const [promptPayId, setPromptPayId] = useState(initialPromptPay);
  const [autoBillingDay, setAutoBillingDay] = useState<string>(initialAutoBillingDay?.toString() || "");
  const [dueDateDays, setDueDateDays] = useState<string>(initialDueDateDays?.toString() || "");
  const [autoRemindDays, setAutoRemindDays] = useState<string>(initialAutoRemindDays?.toString() || "");

  // Tab 2: LINE Bot & Announcements
  const [healthDeptPhone, setHealthDeptPhone] = useState(initialLineConfig?.healthDeptPhone || "044-631405");
  const [announcementText, setAnnouncementText] = useState(initialLineConfig?.announcementText || "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา");
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(initialLineConfig?.isAnnouncementActive ?? true);

  // Tab 3: Receipt Book Config
  const [itemsPerBook, setItemsPerBook] = useState<string>(initialReceiptBookConfig?.itemsPerBook?.toString() || "50");
  const [fiscalYear, setFiscalYear] = useState<string>(initialReceiptBookConfig?.fiscalYear || "2569");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/promptpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: collectorId,
          name,
          promptPayId,
          autoBillingDay: autoBillingDay ? parseInt(autoBillingDay) : null,
          dueDateDays: dueDateDays ? parseInt(dueDateDays) : null,
          autoRemindDays: autoRemindDays ? parseInt(autoRemindDays) : null,
          lineConfig: {
            healthDeptPhone,
            announcementText,
            isAnnouncementActive,
          },
          receiptBookConfig: {
            itemsPerBook: parseInt(itemsPerBook) || 50,
            fiscalYear,
          },
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "บันทึกการตั้งค่าระบบสำเร็จเรียบร้อยแล้ว" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message });
    } finally {
      setIsLoading(false);
    }
  }

  // Detect PromptPay Type (Tax ID vs Phone)
  const cleanPp = promptPayId.replace(/[^0-9]/g, "");
  const promptPayType = cleanPp.length === 13 ? "นิติบุคคล (13 หลัก)" : cleanPp.length === 10 ? "เบอร์มือถือ (10 หลัก)" : "ระบุเลขพร้อมเพย์";

  return (
    <div className="space-y-5 font-sans">
      
      {/* ========================================================
          SECTION 1: QUICK ACCESS CARDS (COMPACT 2x2 GRID)
      ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            เครื่องมือ & รายงานระบบ
          </span>
          <span className="text-[10px] font-medium text-slate-400">ทางลัดจัดการ</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {/* Card 1: Finance Reports */}
          <Link
            href="/dashboard/reports"
            className="group relative p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-200/60 border border-indigo-200/70 hover:border-indigo-300 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B58F2] to-indigo-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <BarChart3 size={15} />
              </div>
              <ArrowRight size={13} className="text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950 group-hover:text-indigo-900 leading-tight">รายงานการคลัง</div>
              <div className="text-[10px] text-indigo-600/90 font-medium truncate mt-0.5">20 ชุมชน & สถ.</div>
            </div>
          </Link>

          {/* Card 2: User Management */}
          <Link
            href="/dashboard/users"
            className="group relative p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-blue-50/90 to-sky-100/50 hover:from-blue-100 hover:to-sky-200/60 border border-blue-200/70 hover:border-blue-300 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Users size={15} />
              </div>
              <ArrowRight size={13} className="text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950 group-hover:text-blue-900 leading-tight">ผู้ดูแลระบบ</div>
              <div className="text-[10px] text-blue-600/90 font-medium truncate mt-0.5">สิทธิ์ & ผู้ใช้งาน</div>
            </div>
          </Link>

          {/* Card 3: Broadcast LINE */}
          <Link
            href="/dashboard/broadcast"
            className="group relative p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-purple-50/90 to-fuchsia-100/50 hover:from-purple-100 hover:to-fuchsia-200/60 border border-purple-200/70 hover:border-purple-300 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Send size={14} />
              </div>
              <ArrowRight size={13} className="text-purple-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-950 group-hover:text-purple-900 leading-tight">แจ้งเตือน LINE</div>
              <div className="text-[10px] text-purple-600/90 font-medium truncate mt-0.5">Bulk Push ทวงหนี้</div>
            </div>
          </Link>

          {/* Card 4: Audit Logs */}
          <Link
            href="/dashboard/logs"
            className="group relative p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 hover:from-slate-200 hover:to-slate-300/60 border border-slate-300/70 hover:border-slate-400/80 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Shield size={14} />
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">ประวัติระบบ</div>
              <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">Audit Logs</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================
          SECTION 2: PARAMETERS & TABS CONTAINER
      ======================================================== */}
      <div className="pt-3 border-t border-slate-200/80 space-y-4">
        
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            การตั้งค่าพารามิเตอร์ระบบ
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Sync
          </span>
        </div>
        
        {/* Animated Segmented Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-xl border border-slate-300/50">
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "account"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <CreditCard size={13} className={activeTab === "account" ? "text-[#5B58F2]" : ""} />
            <span className="truncate">บัญชี & บิล</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("line")}
            className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "line"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <Smartphone size={13} className={activeTab === "line" ? "text-emerald-600" : ""} />
            <span className="truncate">LINE Bot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("receipt")}
            className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "receipt"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <BookOpen size={13} className={activeTab === "receipt" ? "text-amber-600" : ""} />
            <span className="truncate">เล่มใบเสร็จ</span>
          </button>
        </div>

        {/* ========================================================
            FORM CONTENTS
        ======================================================== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* TAB 1: ACCOUNT & BILLING SCHEDULE */}
          {activeTab === "account" && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Account Name */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#5B58F2]" />
                  ชื่อบัญชี / ชื่อหน่วยงาน
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น เทศบาลเมืองนางรอง"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5B58F2]/30 focus:border-[#5B58F2] outline-hidden transition-all"
                />
              </div>

              {/* PromptPay ID */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard size={13} className="text-[#5B58F2]" />
                    เบอร์พร้อมเพย์ (PromptPay ID)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {promptPayType}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={promptPayId}
                  onChange={(e) => setPromptPayId(e.target.value)}
                  placeholder="เช่น 0994000160759 หรือ เบอร์มือถือ 10 หลัก"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5B58F2]/30 focus:border-[#5B58F2] outline-hidden transition-all"
                />
              </div>

              {/* Auto Billing Schedule Grid */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#5B58F2]" /> รอบออกบิลอัตโนมัติประจำเดือน
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    วันที่ออกบิลอัตโนมัติ (วันที่ 1 - 28 ของทุกเดือน)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={autoBillingDay}
                    onChange={(e) => setAutoBillingDay(e.target.value)}
                    placeholder="เช่น 25 (เว้นว่างถ้าออกบิลเอง)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5B58F2]/30 focus:border-[#5B58F2] outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      ครบกำหนดใน (วัน)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={dueDateDays}
                      onChange={(e) => setDueDateDays(e.target.value)}
                      placeholder="เช่น 10"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5B58F2]/30 focus:border-[#5B58F2] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      ทวงหนี้หลังเกิน (วัน)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={autoRemindDays}
                      onChange={(e) => setAutoRemindDays(e.target.value)}
                      placeholder="เช่น 3"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5B58F2]/30 focus:border-[#5B58F2] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINE BOT & ANNOUNCEMENTS */}
          {activeTab === "line" && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Phone Input */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-600" />
                  เบอร์โทรศัพท์กองสาธารณสุขและสิ่งแวดล้อม
                </label>
                <input
                  type="text"
                  value={healthDeptPhone}
                  onChange={(e) => setHealthDeptPhone(e.target.value)}
                  placeholder="เช่น 044-631405"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden transition-all"
                />
                <p className="text-[10px] text-slate-400">
                  เบอร์นี้จะแสดงบน Flex Card เมื่อประชาชนกด &ldquo;ติดต่อเจ้าหน้าที่&rdquo; ใน LINE
                </p>
              </div>

              {/* Announcement Box with iOS Switch Toggle */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Megaphone size={13} className="text-emerald-600" />
                    ข้อความประกาศข่าวสารใน LINE
                  </label>
                  
                  {/* iOS Style Animated Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnnouncementActive}
                      onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ml-1.5 text-[10px] font-bold text-slate-600">
                      {isAnnouncementActive ? "เปิด" : "ปิด"}
                    </span>
                  </label>
                </div>

                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="ระบุข้อความประกาศ..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden transition-all"
                />

                {isAnnouncementActive && announcementText && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-[11px] text-emerald-800 leading-relaxed flex items-start gap-2">
                    <Sparkles size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">พรีวิวในแชท:</span> &ldquo;{announcementText}&rdquo;
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RECEIPT BOOK & NUMBER SERIES */}
          {activeTab === "receipt" && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Fiscal Year Input */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-600" />
                  ปีงบประมาณทางราชการ
                </label>
                <input
                  type="text"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  placeholder="เช่น 2569"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-hidden"
                />
              </div>

              {/* Items per Book */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-amber-600" />
                  จำนวนฉบับต่อเล่ม (Items per Book)
                </label>
                <select
                  value={itemsPerBook}
                  onChange={(e) => setItemsPerBook(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-hidden cursor-pointer"
                >
                  <option value="50">50 ฉบับ / เล่ม (มาตรฐานกองคลัง)</option>
                  <option value="100">100 ฉบับ / เล่ม</option>
                  <option value="25">25 ฉบับ / เล่ม</option>
                </select>
              </div>

              {/* Live Receipt Series Preview */}
              <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/80 p-3.5 rounded-2xl border border-amber-200/70 text-xs text-amber-900 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-600" /> รูปแบบรหัสกำกับใบเสร็จจริง:
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md">
                    {itemsPerBook} ฉบับ/เล่ม
                  </span>
                </div>
                <div className="font-mono font-black text-sm text-amber-950 bg-white/80 p-2.5 rounded-xl border border-amber-200/60 text-center tracking-wide shadow-2xs">
                  เล่มที่ 01 เลขที่ 01/{fiscalYear}
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed text-center">
                  เมื่อครบฉบับที่ {itemsPerBook} ระบบจะขึ้นเล่มที่ 02 ให้อัตโนมัติตามระเบียบ สถ.
                </p>
              </div>
            </div>
          )}

          {/* Feedback Message */}
          {message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in zoom-in-95 duration-150 ${
              message.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs" 
                : "bg-red-50 text-red-800 border-red-200 shadow-2xs"
            }`}>
              {message.type === "success" ? <CheckCircle2 size={15} className="shrink-0 text-emerald-600" /> : <AlertCircle size={15} className="shrink-0 text-red-600" />}
              <span className="font-bold">{message.text}</span>
            </div>
          )}

          {/* Glowing Save Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#5B58F2] via-[#6366F1] to-[#7C3AED] hover:from-[#4A47D1] hover:to-[#6D28D9] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>บันทึกการตั้งค่าทั้งหมด</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
