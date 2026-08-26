"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Smartphone,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface PendingSlip {
  id: number;
  lineMessageId?: string;
  lineUserId: string;
  amount?: string;
  senderName?: string;
  houseNumber?: string;
  imageUrl?: string;
  createdAt: string;
}

interface VerifiedItem {
  id: number;
  amount: string;
  paidAt: string;
  receiptCode?: string;
  houseNumber: string;
  ownerName: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "verified">("all");
  const [pendingSlips, setPendingSlips] = useState<PendingSlip[]>([]);
  const [recentVerified, setRecentVerified] = useState<VerifiedItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  // Play audio chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // ignore
    }
  };

  // Request browser notification permission
  const requestBrowserPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setBrowserNotifyEnabled(perm === "granted");
      if (perm === "granted") {
        new Notification("เทศบาลเมืองนางรอง", {
          body: "เปิดการแจ้งเตือนสลิปและบิลบนหน้าเว็บเรียบร้อยแล้ว",
          icon: "/icons/mainiconweb.png"
        });
      }
    }
  };

  // Check initial browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserNotifyEnabled(Notification.permission === "granted");
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const totalPending = data.unreadCount || 0;
        
        // Trigger alert if new pending items arrived
        if (totalPending > lastCountRef.current && lastCountRef.current > 0) {
          playChime();
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const diff = totalPending - lastCountRef.current;
            new Notification("🔔 มีสลิปใหม่รอตรวจสอบ", {
              body: `พบสลิปใหม่จาก LINE จำนวน ${diff} รายการ กรุณาเข้าตรวจสอบ`,
              icon: "/icons/mainiconweb.png"
            });
          }
        }

        lastCountRef.current = totalPending;
        setUnreadCount(totalPending);
        setPendingSlips(data.pendingSlips || []);
        setRecentVerified(data.recentVerified || []);
      }
    } catch {
      // ignore network errors
    }
  };

  // Polling every 20s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [soundEnabled]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const totalItems = pendingSlips.length + recentVerified.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="การแจ้งเตือน"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors relative cursor-pointer"
      >
        <Bell size={18} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-12 left-4 right-4 sm:left-auto sm:right-0 w-auto sm:w-[380px] md:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Bell size={15} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">ศูนย์การแจ้งเตือน</h3>
                <p className="text-[11px] text-slate-300">
                  {unreadCount > 0 ? `มี ${unreadCount} รายการรอตรวจสอบ` : "ไม่มีรายการค้างตรวจสอบ"}
                </p>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "ปิดเสียงเตือน" : "เปิดเสียงเตือน"}
                className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                  soundEnabled ? "bg-white/15 text-emerald-300" : "bg-white/5 text-slate-400"
                }`}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              
              {!browserNotifyEnabled && (
                <button
                  onClick={requestBrowserPermission}
                  title="เปิดแจ้งเตือนบนเบราว์เซอร์"
                  className="px-2 py-1 bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 text-[11px] font-semibold rounded-lg transition-colors"
                >
                  เปิดแจ้งเตือน
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50/70 px-3 py-1.5 gap-1 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              ทั้งหมด ({totalItems})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "pending" ? "bg-white text-rose-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              รอตรวจ ({pendingSlips.length})
            </button>
            <button
              onClick={() => setActiveTab("verified")}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "verified" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              สำเร็จล่าสุด ({recentVerified.length})
            </button>
          </div>

          {/* Notification List Container */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 p-1">
            
            {/* 1. Pending Slips */}
            {(activeTab === "all" || activeTab === "pending") && pendingSlips.length > 0 && (
              <div className="space-y-1 p-1">
                {pendingSlips.map((slip) => (
                  <Link
                    key={slip.id}
                    href="/dashboard/review"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-rose-50/60 transition-colors border border-transparent hover:border-rose-100 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          สลิปใหม่จาก LINE {slip.houseNumber ? `(บ้าน ${slip.houseNumber})` : "(ยังไม่ระบุบ้าน)"}
                        </span>
                        {slip.amount && (
                          <span className="text-xs font-mono font-black text-rose-600 shrink-0">
                            ฿{parseFloat(slip.amount).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        ผู้โอน: {slip.senderName || "กำลังตรวจสอบ"} • รอการอนุมัติ
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock size={11} /> {new Date(slip.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          ตรวจทันที →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 2. Recent Verified Items */}
            {(activeTab === "all" || activeTab === "verified") && recentVerified.length > 0 && (
              <div className="space-y-1 p-1">
                {recentVerified.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/history/${item.id}/receipt`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50/60 transition-colors border border-transparent hover:border-emerald-100 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          ชำระสำเร็จ • บ้าน {item.houseNumber}
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-600 shrink-0">
                          ฿{parseFloat(item.amount).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.ownerName} • {item.receiptCode || `บิล #${item.id}`}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <Clock size={11} /> {item.paidAt ? new Date(item.paidAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น." : "-"}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 group-hover:underline">
                          ดูใบเสร็จ <ExternalLink size={10} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {totalItems === 0 && (
              <div className="py-10 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">ไม่มีรายการแจ้งเตือนใหม่</p>
                <p className="text-xs text-slate-400 mt-0.5">ระบบตัดยอดและทำงานปกติ 100%</p>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/dashboard/review"
              onClick={() => setIsOpen(false)}
              className="font-bold text-[#5B58F2] hover:text-indigo-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              ไปยังหน้ารายการตรวจสอบ <ChevronRight size={14} />
            </Link>

            <Link
              href="/dashboard/line-slips"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 font-semibold py-1 px-2 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              สลิป LINE ทั้งหมด
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
