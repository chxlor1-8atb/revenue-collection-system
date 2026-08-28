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
  BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import SettingsForm from "./settings/SettingsForm";
import ConfirmModal from "@/components/ConfirmModal";
import LottieIcon from "@/components/LottieIcon";
import NotificationDropdown from "./NotificationDropdown";

export interface SystemSettings {
  id?: number;
  accountName?: string;
  promptPayId?: string;
  autoBillingDay?: number | null;
  dueDateDays?: number | null;
  autoRemindDays?: number | null;
  lineConfig?: any;
  receiptBookConfig?: any;
}

export default function TopNav({ userName, settings }: { userName: string, settings?: SystemSettings }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close settings on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSettingsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Close settings drawer on route change
  useEffect(() => {
    setIsSettingsOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
    { name: "จัดการบ้าน", href: "/dashboard/houses", icon: Home, lottieSrc: "/icons/icons8-home.json", lottieSize: 25 },
    { 
      name: "รายการตรวจสอบ", 
      href: "/dashboard/review", 
      icon: CheckCircle2, 
      lottieSrc: "/icons/icons8-document.json", 
      lottieSize: 25 
    },
    { name: "สลิป LINE", href: "/dashboard/line-slips", icon: Smartphone, imageSrc: "/icons/line-black-animated.gif", imageSize: 25 },
    { name: "ประวัติชำระ", href: "/dashboard/history", icon: Receipt, lottieSrc: "/icons/Receipt.json", lottieSize: 40 },
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
              <NotificationDropdown />
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

          {/* Navigation Bar: 6-Grid Dock on Mobile, Flex Pill Bar on Desktop */}
          <nav className="w-full md:w-auto overflow-hidden">
            <ul className="grid grid-cols-6 gap-0.5 sm:gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60 md:flex md:items-center md:justify-center md:gap-0.5 lg:gap-1 xl:gap-1.5 md:bg-transparent md:p-0 md:border-transparent">
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
            <NotificationDropdown />
            
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
          <div className="relative w-full sm:max-w-md bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="px-5 py-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs flex justify-between items-center shadow-xs z-10">
               <div className="flex items-center gap-2.5">
                 <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B58F2] to-indigo-500 text-white flex items-center justify-center shadow-xs">
                   <Settings size={16} />
                 </div>
                 <div>
                   <h2 className="text-base font-bold font-sans text-slate-800 leading-tight">ตั้งค่าระบบ</h2>
                   <p className="text-[10px] text-slate-400 font-medium">การจัดการพารามิเตอร์ & เครื่องมือ</p>
                 </div>
               </div>
               <button 
                 onClick={() => setIsSettingsOpen(false)} 
                 aria-label="ปิดหน้าต่างตั้งค่า"
                 className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
               >
                 ✕
               </button>
             </div>
             <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
                <SettingsForm 
                  collectorId={settings?.id || 1} 
                  initialName={settings?.accountName || "เทศบาลเมืองนางรอง"} 
                  initialPromptPay={settings?.promptPayId || "0994000160759"}
                  initialAutoBillingDay={settings?.autoBillingDay || null}
                  initialDueDateDays={settings?.dueDateDays || null}
                  initialAutoRemindDays={settings?.autoRemindDays || null}
                  initialLineConfig={settings?.lineConfig}
                  initialReceiptBookConfig={settings?.receiptBookConfig}
                />
             </div>
          </div>
        </div>
      )}
    </>
  );
}
