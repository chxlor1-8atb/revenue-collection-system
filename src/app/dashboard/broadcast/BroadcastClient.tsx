"use client";

import { useState, useRef, useEffect } from "react";
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
  Info,
  Layers,
  Clock,
  Check,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileText,
  ChevronDown,
  Search,
  X,
  MapPin
} from "lucide-react";
import CurrencyDisplay from "@/components/CurrencyDisplay";
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

  // Custom Dropdown State
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState<boolean>(false);
  const [zoneSearch, setZoneSearch] = useState<string>("");
  const zoneDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target as Node)) {
        setIsZoneDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredZones = zones.filter(z => z.toLowerCase().includes(zoneSearch.trim().toLowerCase()) || `ชุมชน${z}`.includes(zoneSearch.trim()));

  // LINE Bot Announcement & Phone State
  const [healthDeptPhone, setHealthDeptPhone] = useState<string>(initialLineConfig?.healthDeptPhone || "044-631405");
  const [announcementText, setAnnouncementText] = useState<string>(initialLineConfig?.announcementText || "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา");
  const [isAnnouncementActive, setIsAnnouncementActive] = useState<boolean>(initialLineConfig?.isAnnouncementActive ?? true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configMsg, setConfigMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick Preset Templates
  const announcementPresets = [
    "เทศบาลเมืองนางรอง ขอขอบคุณทุกท่านที่ร่วมชำระค่าธรรมเนียมขยะตรงเวลา",
    "📢 แจ้งปิดบริการจัดเก็บขยะในวันหยุดนักขัตฤกษ์ กรุณานำขยะมาทิ้งตามเวลาปกติในวันถัดไป",
    "🌿 ขอความร่วมมือคัดแยกขยะเปียกและขยะรีไซเคิลก่อนนำมาทิ้ง เพื่อสุขอนามัยของชุมชน",
  ];

  const dunningPresets = [
    "กรุณาชำระภายในสิ้นเดือนนี้เพื่อความต่อเนื่องในการให้บริการจัดเก็บขยะ",
    "หากท่านชำระเงินเรียบร้อยแล้ว สามารถส่งสลิปเข้ามาในแชทนี้เพื่อยืนยันได้เลยค่ะ",
    "ติดต่อสอบถามยอดค้างชำระหรือขอผ่อนผันได้ที่กองสาธารณสุขและสิ่งแวดล้อม",
  ];

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

  const lineConnectionRate = Math.round((totalLinkedLine / (totalHouses || 1)) * 100);

  return (
    <div className="font-sans pb-16 space-y-6 max-w-7xl mx-auto">
      
      {/* ========================================================
          1. ULTRA-POLISHED PAGE HEADER
      ======================================================== */}
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-xs border border-slate-200/80 p-5 sm:p-7">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#5B58F2] via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Megaphone size={26} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight">
                  แจ้งเตือนทวงหนี้ & ข่าวสาร LINE
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  LINE Direct Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ส่งบิลแจ้งเตือนยอดค้างชำระรายชุมชน และจัดการข่าวสารประชาสัมพันธ์ใน LINE Bot เทศบาล
              </p>
            </div>
          </div>

          {/* Segmented Control Main Tab Switcher */}
          <div className="w-full md:w-auto flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveMainTab("dunning")}
              className={`flex-1 md:flex-initial py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === "dunning"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Send size={15} className={activeMainTab === "dunning" ? "text-[#5B58F2]" : ""} />
              <span>ยิงทวงหนี้ (Bulk Push)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("announcement")}
              className={`flex-1 md:flex-initial py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === "announcement"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Smartphone size={15} className={activeMainTab === "announcement" ? "text-emerald-600" : ""} />
              <span>ข่าวสาร & เบอร์ติดต่อ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. KPI SUMMARY METRIC CARDS
      ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Houses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ทะเบียนบ้านทั้งหมด</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Building2 size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalHouses.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">20 ชุมชนในเขตเทศบาล</div>
          </div>
        </div>

        {/* Card 2: Connected LINE */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">ผูกบัญชี LINE แล้ว</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-800 font-mono tracking-tight">
              {totalLinkedLine.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-md">
                {lineConnectionRate}%
              </span>
              <span className="text-[11px] text-emerald-700/80">ของบ้านทั้งหมด</span>
            </div>
          </div>
        </div>

        {/* Card 3: Overdue Houses */}
        <div className="bg-gradient-to-br from-white to-amber-50/40 p-4 sm:p-5 rounded-2xl border border-amber-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">บ้านที่ค้างชำระ</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-800 font-mono tracking-tight">
              {overdueHousesCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">รอส่งแจ้งเตือนทวงหนี้</div>
          </div>
        </div>

        {/* Card 4: Total Overdue Debt */}
        <div className="bg-gradient-to-br from-white to-rose-50/40 p-4 sm:p-5 rounded-2xl border border-rose-200/70 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">ยอดหนี้ค้างชำระรวม</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-3">
            <CurrencyDisplay
              amount={totalOverdueDebt}
              size="2xl"
              variant="danger"
            />
            <div className="text-[11px] text-rose-600/90 mt-0.5">ยอดค้างชำระสะสม</div>
          </div>
        </div>
      </div>

      {/* Global Result Alert */}
      {resultMsg && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm border flex items-center gap-3 animate-in fade-in duration-200 ${
          resultMsg.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200 shadow-xs" 
            : "bg-red-50 text-red-900 border-red-200 shadow-xs"
        }`}>
          {resultMsg.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-red-600 shrink-0" />
          )}
          <span className="font-semibold leading-relaxed">{resultMsg.text}</span>
        </div>
      )}

      {/* ========================================================
          TAB 1: BULK DUNNING PUSH WORKFLOW
      ======================================================== */}
      {activeMainTab === "dunning" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
          
          {/* Left Column: Form Builder (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Step 1: Target Zone Selector with Custom Searchable Dropdown */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3 relative z-30" ref={zoneDropdownRef}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#5B58F2] text-white text-xs font-black flex items-center justify-center shadow-xs">1</span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">เลือกชุมชนเป้าหมาย</h2>
                </div>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {selectedZone === "ALL" ? "ครอบคลุม 20 ชุมชน" : `ชุมชน${selectedZone}`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  ระบุชุมชนที่ต้องการส่งแจ้งเตือน:
                </label>

                {/* Custom Trigger Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
                    className={`w-full bg-slate-50/80 hover:bg-slate-100/80 border rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isZoneDropdownOpen 
                        ? "border-[#5B58F2] ring-2 ring-[#5B58F2]/20 bg-white shadow-xs" 
                        : "border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {selectedZone === "ALL" ? (
                        <>
                          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-[#5B58F2] flex items-center justify-center text-xs">
                            🌐
                          </div>
                          <span className="text-slate-900 font-bold">ทุกชุมชนในเขตเทศบาลเมืองนางรอง (20 ชุมชน)</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                            🏘️
                          </div>
                          <span className="text-slate-900 font-bold">ชุมชน{selectedZone}</span>
                        </>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isZoneDropdownOpen ? "rotate-180 text-[#5B58F2]" : ""}`} />
                  </button>

                  {/* Custom Searchable Popover Menu */}
                  {isZoneDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      
                      {/* Search Box */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={zoneSearch}
                          onChange={(e) => setZoneSearch(e.target.value)}
                          placeholder="พิมพ์ค้นหาชื่อชุมชน... เช่น วัดกลาง, หนองรี"
                          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#5B58F2]/30 focus:border-[#5B58F2] outline-hidden"
                          autoFocus
                        />
                        {zoneSearch && (
                          <button
                            type="button"
                            onClick={() => setZoneSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Options List */}
                      <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                        
                        {/* Option: ALL Zones */}
                        {(!zoneSearch || "ทุกชุมชน".includes(zoneSearch) || "all".includes(zoneSearch.toLowerCase())) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedZone("ALL");
                              setIsZoneDropdownOpen(false);
                              setZoneSearch("");
                            }}
                            className={`w-full p-2.5 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                              selectedZone === "ALL"
                                ? "bg-indigo-50 text-[#5B58F2] border border-indigo-200/70"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>🌐</span>
                              <span>ทุกชุมชนในเขตเทศบาลเมืองนางรอง (20 ชุมชน)</span>
                            </div>
                            {selectedZone === "ALL" && <Check size={14} className="text-[#5B58F2]" />}
                          </button>
                        )}

                        {/* Filtered Community Zones */}
                        {filteredZones.length > 0 ? (
                          filteredZones.map((z) => (
                            <button
                              key={z}
                              type="button"
                              onClick={() => {
                                setSelectedZone(z);
                                setIsZoneDropdownOpen(false);
                                setZoneSearch("");
                              }}
                              className={`w-full p-2.5 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer ${
                                selectedZone === z
                                  ? "bg-indigo-50 text-[#5B58F2] font-bold border border-indigo-200/70"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">🏘️</span>
                                <span>ชุมชน{z}</span>
                              </div>
                              {selectedZone === z && <Check size={14} className="text-[#5B58F2]" />}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">
                            ไม่พบชื่อชุมชนที่ตรงกับคำค้นหา
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Popular Quick Filter Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2.5">
                  <span className="text-[10px] font-bold text-slate-400">ลัดเลือกด่วน:</span>
                  {["ALL", "หนองรี", "บ้านเก่า", "วัดขุนก้อง", "วัดกลาง", "ถนนหักพัฒนา"].map((zKey) => (
                    <button
                      key={zKey}
                      type="button"
                      onClick={() => {
                        setSelectedZone(zKey);
                        setIsZoneDropdownOpen(false);
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        selectedZone === zKey
                          ? "bg-[#5B58F2] text-white border-[#5B58F2] shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200/70 text-slate-600 border-slate-200/70"
                      }`}
                    >
                      {zKey === "ALL" ? "🌐 ทุกชุมชน" : `ชุมชน${zKey}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Overdue Duration Filter */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#5B58F2] text-white text-xs font-black flex items-center justify-center shadow-xs">2</span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">เกณฑ์ระยะเวลาค้างชำระ</h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">Overdue Tier</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: 1, label: "ค้าง 1 เดือนขึ้นไป", desc: "เตือนปกติประจำงวด", color: "border-indigo-200 text-indigo-900 bg-indigo-50/50" },
                  { value: 2, label: "ค้าง 2 เดือนขึ้นไป", desc: "ค้างชำระต่อเนื่อง", color: "border-amber-200 text-amber-900 bg-amber-50/50" },
                  { value: 3, label: "ค้าง 3 เดือนขึ้นไป", desc: "เร่งด่วน / เตรียมระงับ", color: "border-rose-200 text-rose-900 bg-rose-50/50" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMinMonths(item.value)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      minMonths === item.value
                        ? "bg-[#5B58F2] text-white border-[#5B58F2] shadow-sm shadow-indigo-500/20 scale-[1.01]"
                        : "bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80"
                    }`}
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-bold">{item.label}</div>
                      <div className={`text-[10px] mt-0.5 ${minMonths === item.value ? "text-indigo-100" : "text-slate-400"}`}>
                        {item.desc}
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        minMonths === item.value ? "border-white bg-white text-[#5B58F2]" : "border-slate-300"
                      }`}>
                        {minMonths === item.value && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Custom Announcement & Presets */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#5B58F2] text-white text-xs font-black flex items-center justify-center shadow-xs">3</span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">ข้อความประกาศเพิ่มเติมในบิล</h2>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
              </div>

              <div>
                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-[#5B58F2]" /> ข้อความสำเร็จรูป:
                  </span>
                  {dunningPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomNote(preset)}
                      className="text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/70 transition-colors cursor-pointer truncate max-w-[220px]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="ระบุข้อความประกาศเพิ่มเติมที่จะไปแทรกอยู่ในการ์ดแจ้งเตือน เช่น 'กรุณาชำระก่อนวันที่ 5 สิ้นเดือนนี้...'"
                  rows={3}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#5B58F2]/30 focus:border-[#5B58F2] outline-hidden transition-all"
                />
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>ระบบจะส่งเฉพาะลูกบ้านที่ <strong className="text-emerald-700 font-semibold">ผูก LINE แล้ว</strong> เท่านั้น</span>
                </div>

                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={isSending}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#5B58F2] via-[#6366F1] to-[#7C3AED] hover:from-[#4A47D1] hover:to-[#6D28D9] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
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

          </div>

          {/* Right Column: Realistic Smartphone Mockup (5 Cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#5B58F2]" /> ตัวอย่างหน้าจอจริงใน LINE ของลูกบ้าน
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Live Preview
              </span>
            </div>

            {/* Smartphone Outer Casing */}
            <div className="relative mx-auto w-full max-w-[340px] bg-slate-900 p-3 sm:p-3.5 rounded-[42px] shadow-2xl border-4 border-slate-800">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950/80 mr-2"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-950/60"></div>
              </div>

              {/* Phone Screen Glass */}
              <div className="relative bg-[#849EB5] rounded-[32px] pt-8 pb-4 px-3 min-h-[480px] flex flex-col justify-between overflow-hidden shadow-inner font-sans">
                
                {/* LINE Chat Top Bar Mock */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-white text-[11px] mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-black">
                      ทม
                    </div>
                    <span className="font-bold truncate max-w-[140px]">เทศบาลเมืองนางรอง</span>
                  </div>
                  <span className="text-[9px] opacity-75">10:45 น.</span>
                </div>

                {/* LINE Chat Bubble Container */}
                <div className="flex-1 flex flex-col justify-center">
                  
                  {/* Flex Message Card */}
                  <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 text-slate-800 animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3.5 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold tracking-wider uppercase opacity-90">เทศบาลเมืองนางรอง</span>
                        <span className="text-[8px] bg-white/25 px-2 py-0.5 rounded-full font-bold">กองสาธารณสุข</span>
                      </div>
                      <div className="text-sm sm:text-base font-black mt-1 leading-tight">แจ้งเตือนยอดค้างชำระ</div>
                      <div className="text-[10px] opacity-90 mt-0.5">บ้านเลขที่ 101/1 • ชุมชน{selectedZone === "ALL" ? "หนองรี" : selectedZone}</div>
                    </div>

                    {/* Body */}
                    <div className="p-3.5 space-y-2.5">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                        <div className="text-[9px] text-slate-400 font-semibold">ยอดค้างชำระรวม</div>
                        <div className="text-xl font-black text-slate-900 font-mono">฿{(minMonths * 20).toFixed(2)}</div>
                        <div className="text-[9px] text-slate-500 font-medium mt-0.5">({minMonths} เดือน)</div>
                      </div>

                      {customNote ? (
                        <div className="text-[10px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 leading-relaxed">
                          📢 <span className="font-semibold">{customNote}</span>
                        </div>
                      ) : null}

                      {/* Payment Buttons */}
                      <div className="space-y-1.5 pt-0.5">
                        <div className="w-full py-2 bg-emerald-600 text-white rounded-xl text-center text-[11px] font-bold shadow-xs">
                          📱 สแกน QR Code ชำระเงิน
                        </div>
                        <div className="w-full py-1.5 bg-slate-100 text-slate-700 rounded-xl text-center text-[10px] font-semibold">
                          ดูประวัติใบแจ้งหนี้
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 text-[9px] text-center text-slate-400">
                      ระบบชำระค่าธรรมเนียมเทศบาลเมืองนางรอง
                    </div>
                  </div>

                </div>

                {/* Home Indicator */}
                <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mt-2"></div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          TAB 2: ANNOUNCEMENT & BOT CONTACT COCKPIT
      ======================================================== */}
      {activeMainTab === "announcement" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
          
          {/* Left Configuration Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">ตั้งค่าข่าวสาร & ข้อมูลติดต่อ LINE Bot</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กำหนดเบอร์โทรศัพท์ติดต่อและข้อความประชาสัมพันธ์ที่จะแสดงในการ์ด LINE Bot
                  </p>
                </div>
              </div>
            </div>

            {configMsg && (
              <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2 border animate-in fade-in duration-150 ${
                configMsg.type === "success" 
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200 shadow-2xs" 
                  : "bg-red-50 text-red-900 border-red-200 shadow-2xs"
              }`}>
                {configMsg.type === "success" ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 text-red-600" />
                )}
                <span className="font-semibold">{configMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveLineConfig} className="space-y-5">
              
              {/* Card 1: Official Health Department Phone */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone size={15} className="text-emerald-600" />
                    เบอร์โทรศัพท์กองสาธารณสุขและสิ่งแวดล้อม
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    One-Tap Call
                  </span>
                </div>

                <input
                  type="text"
                  required
                  value={healthDeptPhone}
                  onChange={(e) => setHealthDeptPhone(e.target.value)}
                  placeholder="เช่น 044-631405"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden transition-all"
                />
                
                <p className="text-[11px] text-slate-400">
                  * เมื่อประชาชนกดปุ่ม &ldquo;ติดต่อเจ้าหน้าที่&rdquo; ใน LINE ระบบจะแสดงปุ่มโทรออกไปยังเบอร์นี้ทันที
                </p>
              </div>

              {/* Card 2: Announcement Text with iOS Switch */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Megaphone size={15} className="text-emerald-600" />
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

                {/* Preset Chips for Announcement */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-emerald-600" /> เทมเพลตประกาศยอดนิยม:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {announcementPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAnnouncementText(preset)}
                        className="text-[11px] text-left font-medium bg-white hover:bg-emerald-50 hover:text-emerald-900 text-slate-600 p-2 rounded-xl border border-slate-200/70 transition-colors cursor-pointer"
                      >
                        • {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="ระบุข้อความประกาศ..."
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-hidden transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
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

          {/* Right Column: Contact Card Live Preview (5 Cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" /> ตัวอย่างหน้าจอติดต่อใน LINE
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Live Preview
              </span>
            </div>

            {/* Smartphone Outer Casing */}
            <div className="relative mx-auto w-full max-w-[340px] bg-slate-900 p-3 sm:p-3.5 rounded-[42px] shadow-2xl border-4 border-slate-800">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950/80 mr-2"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-950/60"></div>
              </div>

              {/* Phone Screen Glass */}
              <div className="relative bg-[#849EB5] rounded-[32px] pt-8 pb-4 px-3 min-h-[480px] flex flex-col justify-between overflow-hidden shadow-inner font-sans">
                
                {/* LINE Chat Top Bar Mock */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-white text-[11px] mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-black">
                      ทม
                    </div>
                    <span className="font-bold truncate max-w-[140px]">เทศบาลเมืองนางรอง</span>
                  </div>
                  <span className="text-[9px] opacity-75">10:45 น.</span>
                </div>

                {/* LINE Chat Bubble Container */}
                <div className="flex-1 flex flex-col justify-center">
                  
                  {/* Contact Flex Card */}
                  <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 text-slate-800 animate-in zoom-in-95 duration-200">
                    <div className="p-4 space-y-3">
                      
                      {/* Header */}
                      <div className="border-b border-slate-100 pb-2.5">
                        <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                          <Phone size={15} className="text-emerald-600" /> ติดต่อเจ้าหน้าที่
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">กองสาธารณสุขและสิ่งแวดล้อม เทศบาลเมืองนางรอง</div>
                      </div>

                      {/* Announcement Highlight Box */}
                      {isAnnouncementActive && announcementText && (
                        <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200/70 text-[10px] text-blue-900 leading-relaxed space-y-0.5">
                          <div className="font-bold flex items-center gap-1 text-[9px] text-blue-700">
                            📢 ข่าวสารประชาสัมพันธ์
                          </div>
                          <div>{announcementText}</div>
                        </div>
                      )}

                      {/* Info rows */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px]">เบอร์โทรศัพท์:</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">{healthDeptPhone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px]">เวลาทำการ:</span>
                          <span className="text-slate-700 text-[10px]">จ.-ศ. (08:30-16:30)</span>
                        </div>
                      </div>

                      {/* Action Call Button */}
                      <div className="pt-0.5">
                        <div className="w-full py-2 bg-emerald-600 text-white rounded-xl text-center text-xs font-bold shadow-xs flex items-center justify-center gap-1.5">
                          <Phone size={12} /> โทร. กองสาธารณสุข ({healthDeptPhone})
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 text-[9px] text-center text-slate-400">
                      ระบบบริการประชาชน เทศบาลเมืองนางรอง
                    </div>
                  </div>

                </div>

                {/* Home Indicator */}
                <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mt-2"></div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Confirmation Modal */}
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
