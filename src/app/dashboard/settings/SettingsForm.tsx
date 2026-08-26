"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Smartphone, BookOpen, Save, CheckCircle2, AlertCircle, Phone, Megaphone, Calendar, Clock, Loader2, Send, Shield, ArrowRight, Users, BarChart3 } from "lucide-react";

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

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 font-sans space-y-6">
      {/* Quick Access to System Tools */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">เครื่องมือ & รายงานระบบ</div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Financial Reports Primary Card */}
          <Link
            href="/dashboard/reports"
            className="p-3.5 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/70 transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5B58F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BarChart3 size={16} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-indigo-950">รายงานการคลัง</div>
                <div className="text-[10px] text-indigo-700">สถ. กองคลัง & 20 ชุมชน</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* User Management Card */}
          <Link
            href="/dashboard/users"
            className="p-3.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60 transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users size={16} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-blue-950">ผู้ดูแลระบบ</div>
                <div className="text-[10px] text-blue-700">จัดการสิทธิ์ & บัญชี</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Broadcast LINE Card */}
          <Link
            href="/dashboard/broadcast"
            className="p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/60 transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send size={15} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-purple-950">แจ้งเตือน LINE</div>
                <div className="text-[10px] text-purple-700">Bulk Push ทวงหนี้</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Audit Logs Card */}
          <Link
            href="/dashboard/logs"
            className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Shield size={15} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">ประวัติระบบ</div>
                <div className="text-[10px] text-slate-500">Audit Logs เจ้าหน้าที่</div>
              </div>
            </div>
            <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">การตั้งค่าพารามิเตอร์ระบบ</div>
        
        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl mb-5 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "account"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard size={14} className={activeTab === "account" ? "text-[#5B58F2]" : ""} />
            <span>บัญชี & บิล</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("line")}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "line"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Smartphone size={14} className={activeTab === "line" ? "text-emerald-600" : ""} />
            <span>LINE Bot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("receipt")}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "receipt"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen size={14} className={activeTab === "receipt" ? "text-amber-600" : ""} />
            <span>เล่มใบเสร็จ</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* ==========================================
              TAB 1: ACCOUNT & BILLING SCHEDULE
          ========================================== */}
          {activeTab === "account" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อบัญชี / ชื่อหน่วยงาน
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น เทศบาลเมืองนางรอง"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เบอร์พร้อมเพย์ (PromptPay ID)
                </label>
                <input
                  type="text"
                  required
                  value={promptPayId}
                  onChange={(e) => setPromptPayId(e.target.value)}
                  placeholder="เช่น 0994000160759 หรือ เบอร์มือถือ 10 หลัก"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#5B58F2]" /> ตั้งเวลาออกบิลอัตโนมัติ
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    วันที่ออกบิลประจำเดือน (วันที่ 1-28)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={autoBillingDay}
                    onChange={(e) => setAutoBillingDay(e.target.value)}
                    placeholder="เช่น 25 (เว้นว่างถ้าไม่ออกบิลอัตโนมัติ)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#5B58F2] outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: LINE BOT & ANNOUNCEMENTS
          ========================================== */}
          {activeTab === "line" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-600" />
                  เบอร์โทรศัพท์กองสาธารณสุขและสิ่งแวดล้อม
                </label>
                <input
                  type="text"
                  value={healthDeptPhone}
                  onChange={(e) => setHealthDeptPhone(e.target.value)}
                  placeholder="เช่น 044-631405"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Megaphone size={13} className="text-emerald-600" />
                    ข้อความประกาศข่าวสารใน LINE Bot
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isAnnouncementActive}
                      onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-slate-600 font-medium text-[11px]">เปิดใช้งานประกาศ</span>
                  </label>
                </div>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="ระบุข้อความประกาศ..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: RECEIPT BOOK & NUMBER SERIES
          ========================================== */}
          {activeTab === "receipt" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ปีงบประมาณทางราชการ
                </label>
                <input
                  type="text"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  placeholder="เช่น 2569"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  จำนวนฉบับต่อเล่ม (Items per Book)
                </label>
                <select
                  value={itemsPerBook}
                  onChange={(e) => setItemsPerBook(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-hidden cursor-pointer"
                >
                  <option value="50">50 ฉบับ / เล่ม (มาตรฐานราชการทั่วไป)</option>
                  <option value="100">100 ฉบับ / เล่ม</option>
                  <option value="25">25 ฉบับ / เล่ม</option>
                </select>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 text-xs text-amber-800 leading-relaxed">
                💡 <strong>รูปแบบรหัสกำกับใบเสร็จ:</strong> 
                <div className="font-mono font-bold text-amber-900 mt-1">
                  เล่มที่ 01 เลขที่ 01/{fiscalYear}
                </div>
              </div>
            </div>
          )}

          {/* Result Message */}
          {message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              message.type === "success" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-red-50 text-red-800 border-red-200"
            }`}>
              {message.type === "success" ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
              <span className="font-semibold">{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5B58F2] hover:bg-[#4A47D1] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-[#5B58F2]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
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
