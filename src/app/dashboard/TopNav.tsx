"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { 
  Settings, 
  Bell, 
  Trash2, 
  LayoutDashboard, 
  Home, 
  CheckCircle2, 
  Receipt, 
  Users, 
  Smartphone, 
  Folder,
  BarChart3,
  Send,
  Shield,
  Sliders
} from "lucide-react";
import { useState, useEffect } from "react";
import SettingsForm from "./settings/SettingsForm";
import ConfirmModal from "@/components/ConfirmModal";
import LottieIcon from "@/components/LottieIcon";

export default function TopNav({ userName, settings }: { userName: string, settings?: any }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(0);

  // Close settings on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSettingsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Visibility-aware smart poller for pending review items & audio alert
  useEffect(() => {
    let lastCount = 0;
    const checkReviews = async () => {
      // Skip network call if browser tab is hidden/backgrounded
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      try {
        const res = await fetch('/api/transactions/review');
        if (res.ok) {
          const data = await res.json();
          const count = (data.pending?.length || 0) + (data.waiting?.length || 0);
          if (count > lastCount && lastCount > 0) {
            // Play gentle chime safely
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const ctx = new AudioContextClass();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
              }
            } catch (e) {
              // ignore audio errors
            }
          }
          lastCount = count;
          setPendingReviewCount(count);
        }
      } catch (e) {
        // ignore fetch errors
      }
    };

    checkReviews();
    const interval = setInterval(checkReviews, 30000); // every 30s
    
    // Immediately check when user tabs back into the app
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkReviews();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const navItems = [
    { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
    { name: "จัดการบ้าน", href: "/dashboard/houses", icon: Home, lottieSrc: "/icons/icons8-home.json", lottieSize: 25 },
    { 
      name: "รายการตรวจสอบ", 
      href: "/dashboard/review", 
      icon: CheckCircle2, 
      lottieSrc: "/icons/icons8-document.json", 
      lottieSize: 25,
      badgeCount: pendingReviewCount 
    },
    { name: "ประวัติชำระ", href: "/dashboard/history", icon: Receipt, lottieSrc: "/icons/Receipt.json", lottieSize: 40 },
    { name: "รายงานการคลัง", href: "/dashboard/reports", icon: BarChart3 },
    { name: "แจ้งเตือน LINE", href: "/dashboard/broadcast", icon: Send },
    { name: "สลิป LINE", href: "/dashboard/line-slips", icon: Smartphone, imageSrc: "/icons/line-black-animated.gif", imageSize: 25 },
    { name: "ประวัติระบบ", href: "/dashboard/logs", icon: Shield },
    { name: "LINE Bot", href: "/dashboard/line-manager", icon: Sliders },
    { name: "ผู้ใช้งาน", href: "/dashboard/users", icon: Users, imageSrc: "/icons/icons8-user.gif", imageSize: 24 },
    { name: "คลังไฟล์", href: "/dashboard/blob", icon: Folder, lottieSrc: "/icons/icons8-folder.json", lottieSize: 25 },
  ];

  return (
    <>
      <header className="border-b border-slate-100 bg-white rounded-t-[32px] px-3 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-4 relative z-40">
        <div className="max-w-[1440px] mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-3 lg:gap-4">
          
          {/* Top Bar Row (Brand on Left, User Actions on Right for Mobile) */}
          <div className="flex items-center justify-between w-full md:w-auto shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 lg:gap-3 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/mainiconweb.png"
                alt="ระบบจัดเก็บค่าขยะ"
                className="hidden sm:block w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 object-contain shrink-0 drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-sans font-bold text-[#0F172A] tracking-tight text-base sm:text-lg lg:text-xl whitespace-nowrap">
                ระบบจัดเก็บค่าขยะ
              </span>
            </Link>

            {/* Mobile-only User Actions on Top Right */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                aria-label="ตั้งค่าระบบ"
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <Settings size={15} strokeWidth={1.5} />
              </button>
              <button 
                aria-label="การแจ้งเตือน"
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative"
              >
                <Bell size={15} strokeWidth={1.5} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button 
                aria-label={`ข้อมูลผู้ใช้ (${userName})`}
                className="flex items-center cursor-pointer ml-0.5" 
                onClick={() => setShowLogoutConfirm(true)}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-xs flex items-center justify-center font-bold text-slate-600 uppercase text-[10px]">
                  {userName.substring(0,2)}
                </div>
              </button>
            </div>
          </div>

          {/* Navigation Bar: 7-Grid Dock on Mobile, Flex Pill Bar on Desktop */}
          <nav className="w-full md:w-auto overflow-hidden">
            <ul className="grid grid-cols-7 gap-0.5 sm:gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60 md:flex md:items-center md:justify-center md:gap-0.5 lg:gap-1 xl:gap-1.5 md:bg-transparent md:p-0 md:border-transparent">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <li key={item.href} className="flex justify-center">
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={`relative flex items-center justify-center gap-1.5 w-full md:w-auto h-9 sm:h-10 md:h-auto px-1.5 sm:px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-xl md:rounded-full text-xs lg:text-sm font-semibold transition-all whitespace-nowrap ${
                        isActive 
                          ? "text-slate-900 bg-transparent border border-slate-300" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50 border border-transparent"
                      }`}
                      title={item.name}
                      aria-label={item.name}
                    >
                      <div className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center shrink-0 relative">
                        {item.lottieSrc ? (
                          <LottieIcon src={item.lottieSrc} size={item.lottieSize || 25} loop autoplay />
                        ) : item.imageSrc ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={item.imageSrc} 
                            alt={item.name} 
                            style={{ width: item.imageSize || 24, height: item.imageSize || 24 }}
                            className="object-contain shrink-0" 
                          />
                        ) : (
                          <IconComponent size={18} className={`shrink-0 ${isActive ? "text-slate-900" : "text-slate-500"}`} />
                        )}
                      </div>
                      <span className="hidden md:inline">{item.name}</span>
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 md:-top-1 md:right-1 min-w-[17px] h-4 px-1 bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
                          {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop-only Right User Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              aria-label="ตั้งค่าระบบ"
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <Settings size={18} strokeWidth={1.5} />
            </button>
            <button 
              aria-label="การแจ้งเตือน"
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors relative"
            >
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <button 
              aria-label={`ข้อมูลผู้ใช้และออกจากระบบ (${userName})`}
              className="flex items-center gap-2 cursor-pointer ml-1 relative group bg-transparent border-none p-0" 
              onClick={() => setShowLogoutConfirm(true)}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
                {userName.substring(0,2)}
              </div>
              {/* Tooltip for logout */}
              <div className="absolute top-full right-0 mt-2 bg-[#0F172A] text-white text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                ออกจากระบบ ({userName})
              </div>
            </button>
          </div>
        </div>
      
      <ConfirmModal 
        isOpen={showLogoutConfirm}
        title="ออกจากระบบ"
        description={<>คุณต้องการออกจากระบบใช่หรือไม่?</>}
        warningTitle="คำเตือน (Warning)"
        warningText="คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อเข้าถึงข้อมูลและจัดการระบบหลังบ้าน"
        cancelText="ยกเลิก"
        confirmText="ใช่, ออกจากระบบ"
        onConfirm={async () => {
          await signOut({ redirect: false });
          if (window.opener) {
            window.close();
          } else {
            window.location.href = '/';
          }
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>

      {/* Slide-over Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsSettingsOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
               <h2 className="text-xl font-bold font-sans text-slate-800 flex items-center gap-2">
                 <Settings size={20} className="text-[#5B58F2]" /> ตั้งค่าระบบ
               </h2>
               <button 
                 onClick={() => setIsSettingsOpen(false)} 
                 className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
               >
                 ✕
               </button>
             </div>
             <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <SettingsForm 
                  collectorId={settings?.id || 1} 
                  initialName={settings?.accountName || "ชื่อบัญชีรับเงิน"} 
                  initialPromptPay={settings?.promptPayId || "เบอร์พร้อมเพย์"}
                  initialAutoBillingDay={settings?.autoBillingDay || null}
                  initialDueDateDays={settings?.dueDateDays || null}
                  initialAutoRemindDays={settings?.autoRemindDays || null}
                />
             </div>
          </div>
        </div>
      )}
    </>
  );
}
