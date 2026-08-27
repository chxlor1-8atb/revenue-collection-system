"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  ShieldCheck,
  QrCode,
  AlertCircle,
  Sparkles,
  FileCheck
} from "lucide-react";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import LiveQrCountdown from "@/components/LiveQrCountdown";

export interface PendingNotificationItem {
  id: number;
  source: "line" | "web" | "qr_intent";
  status: "pending_review" | "waiting_qr";
  title: string;
  amount?: string;
  senderName?: string;
  houseNumber?: string;
  imageUrl?: string | null;
  months?: string[];
  createdAt: string;
}

export interface VerifiedNotificationItem {
  id: number;
  amount: string;
  paidAt: string;
  receiptCode?: string;
  houseNumber: string;
  ownerName: string;
  slipImageUrl?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "verified">("all");
  const [pendingItems, setPendingItems] = useState<PendingNotificationItem[]>([]);
  const [recentVerified, setRecentVerified] = useState<VerifiedNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  // Play gentle audio chime
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
      // ignore audio errors
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

  // Fetch notifications from server
  const fetchNotifications = async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const totalPending = data.unreadCount || 0;
        
        // Trigger alert if new pending items arrived
        if (totalPending > lastCountRef.current && lastCountRef.current >= 0) {
          const diff = totalPending - lastCountRef.current;
          if (lastCountRef.current > 0 || totalPending > 0) {
            toast.custom((t) => (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl border bg-white shadow-xl shadow-rose-900/5 border-rose-100 group cursor-pointer w-full"
                   onClick={() => {
                     toast.dismiss(t);
                     setIsOpen(false);
                     window.location.href = '/dashboard/review';
                   }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-rose-50 text-rose-500">
                  <Smartphone size={20} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-sm font-bold text-slate-800">มีการชำระเงินใหม่ {diff} รายการ</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-rose-600/90 flex items-center gap-1">รอแอดมินตรวจสอบ <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span></span></span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-rose-700 bg-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      ตรวจทันที →
                    </span>
                  </div>
                </div>
              </div>
            ), { duration: 5000 });
          }
          playChime();
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const diff = totalPending - lastCountRef.current;
            new Notification("🔔 มีการชำระเงินใหม่รอตรวจสอบ", {
              body: `พบรายการใหม่ ${diff} รายการ กรุณาเข้าตรวจสอบ`,
              icon: "/icons/mainiconweb.png"
            });
          }
        }

        lastCountRef.current = totalPending;
        setUnreadCount(totalPending);
        setPendingItems(data.pendingItems || []);
        setRecentVerified(data.recentVerified || []);
      }
    } catch {
      // ignore network errors
    }
  };

  // Polling every 15s + immediate visibility check (fallback)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

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

  const totalItems = pendingItems.length + recentVerified.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="การแจ้งเตือน"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200/90 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors relative cursor-pointer active:scale-95"
      >
        <Bell size={18} strokeWidth={1.5} className={unreadCount > 0 ? "text-[#5B58F2]" : "text-slate-500"} />
        
        {/* Unread Badge on Bell Icon */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-pulse pointer-events-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-12 left-3 right-3 sm:left-auto sm:right-0 w-auto sm:w-[400px] md:w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
          
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold">
                <Bell size={16} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>ศูนย์การแจ้งเตือน</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {unreadCount > 0 ? `มี ${unreadCount} รายการที่ต้องดำเนินการ` : "ไม่มีรายการค้างตรวจสอบ"}
                </p>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "ปิดเสียงเตือน" : "เปิดเสียงเตือน"}
                className={`p-2 rounded-xl transition-colors text-xs flex items-center gap-1 cursor-pointer ${
                  soundEnabled ? "bg-white/15 text-emerald-300" : "bg-white/5 text-slate-400"
                }`}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              
              {!browserNotifyEnabled && (
                <button
                  type="button"
                  onClick={requestBrowserPermission}
                  title="เปิดแจ้งเตือนบนเบราว์เซอร์"
                  className="px-2.5 py-1.5 bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 text-[11px] font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  เปิดแจ้งเตือน
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50/80 px-4 py-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "all" ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ทั้งหมด ({totalItems})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "pending" ? "bg-white text-rose-600 shadow-2xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              รอตรวจ ({pendingItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("verified")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "verified" ? "bg-white text-emerald-600 shadow-2xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              สำเร็จล่าสุด ({recentVerified.length})
            </button>
          </div>

          {/* Notification List Container */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 p-1.5 custom-scrollbar">
            
            {/* 1. Pending Review Items & QR Intents */}
            {(activeTab === "all" || activeTab === "pending") && pendingItems.length > 0 && (
              <div className="space-y-1.5 p-1">
                {pendingItems.map((item) => {
                  const isWaitingQr = item.status === "waiting_qr";

                  return (
                    <Link
                      key={`${item.source}-${item.id}`}
                      href="/dashboard/review"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition-all border group ${
                        isWaitingQr 
                          ? "bg-amber-50/40 hover:bg-amber-50 border-amber-200/70" 
                          : "bg-rose-50/40 hover:bg-rose-50 border-rose-200/70"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isWaitingQr ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-600"
                      }`}>
                        {isWaitingQr ? <QrCode size={18} /> : (item.source === "line" ? <Smartphone size={18} /> : <FileCheck size={18} />)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {isWaitingQr ? "กำลังสแกนจ่าย QR Code" : "สลิปใหม่รอตรวจสอบ"} 
                            {item.houseNumber ? ` • บ้าน ${item.houseNumber}` : ""}
                          </span>
                          {item.amount && (
                            <CurrencyDisplay 
                              amount={item.amount} 
                              size="xs" 
                              variant={isWaitingQr ? "warning" : "danger"} 
                            />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.senderName || "ผู้ใช้งาน"} {item.months && item.months.length > 0 ? `(งวด: ${item.months.join(", ")})` : ""}
                        </p>

                        <div className="flex items-center justify-between mt-1.5">
                          {isWaitingQr ? (
                            <LiveQrCountdown createdAt={item.createdAt} durationSeconds={180} />
                          ) : (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <Clock size={11} /> {new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                            isWaitingQr 
                              ? "text-amber-800 bg-amber-100 group-hover:bg-amber-600 group-hover:text-white" 
                              : "text-rose-700 bg-rose-100 group-hover:bg-rose-600 group-hover:text-white"
                          }`}>
                            {isWaitingQr ? "ดูสถานะ →" : "ตรวจทันที →"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 2. Recent Verified Items */}
            {(activeTab === "all" || activeTab === "verified") && recentVerified.length > 0 && (
              <div className="space-y-1.5 p-1">
                {recentVerified.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/history/${item.id}/receipt`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-2xl hover:bg-emerald-50/60 transition-all border border-transparent hover:border-emerald-200 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          ชำระสำเร็จ • บ้าน {item.houseNumber}
                        </span>
                        <CurrencyDisplay 
                          amount={item.amount} 
                          size="xs" 
                          variant="success" 
                        />
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
              <div className="py-12 text-center px-4 space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800">ไม่มีรายการแจ้งเตือนใหม่</p>
                <p className="text-xs text-slate-400">ระบบทำงานปกติและตัดยอดสลิปเรียบร้อย 100%</p>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/dashboard/review"
              onClick={() => setIsOpen(false)}
              className="font-bold text-[#5B58F2] hover:text-indigo-700 flex items-center gap-1 py-1 px-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <span>ไปที่หน้าตรวจสอบสลิปทั้งหมด</span>
              <ChevronRight size={13} />
            </Link>

            <span className="text-[11px] text-slate-400">
              อัปเดตอัตโนมัติ
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
