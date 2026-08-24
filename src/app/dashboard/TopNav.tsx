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
  Folder 
} from "lucide-react";
import { useState, useEffect } from "react";
import SettingsForm from "./settings/SettingsForm";
import ConfirmModal from "@/components/ConfirmModal";
import LottieIcon from "@/components/LottieIcon";

export default function TopNav({ userName, settings }: { userName: string, settings?: any }) {
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

  const navItems = [
    { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
    { name: "จัดการบ้าน", href: "/dashboard/houses", icon: Home, lottieSrc: "/icons/icons8-home.json", lottieSize: 30 },
    { name: "รายการตรวจสอบ", href: "/dashboard/review", icon: CheckCircle2, lottieSrc: "/icons/icons8-document.json", lottieSize: 30 },
    { name: "ประวัติชำระ", href: "/dashboard/history", icon: Receipt, lottieSrc: "/icons/Receipt.json", lottieSize: 46 },
    { name: "ผู้ใช้งาน", href: "/dashboard/users", icon: Users },
    { name: "สลิป LINE", href: "/dashboard/line-slips", icon: Smartphone },
    { name: "คลังไฟล์", href: "/dashboard/blob", icon: Folder, lottieSrc: "/icons/icons8-folder.json", lottieSize: 30 },
  ];

  return (
    <>
      <header className="border-b border-slate-100 bg-white rounded-t-[32px] px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 relative z-40">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center justify-center w-8 h-8 bg-[#5B58F2] rounded-full text-white shadow-sm">
              <Trash2 size={16} strokeWidth={2.5} />
            </div>
            <span className="font-sans font-bold text-[#0F172A] tracking-tight text-xl mr-6">ระบบจัดเก็บค่าขยะ</span>
          </div>

          <nav className="flex-1 overflow-x-auto w-full md:w-auto flex justify-start md:justify-center no-scrollbar pb-1 sm:pb-0">
            <ul className="flex items-center gap-1.5 sm:gap-2 px-1 py-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={`relative flex items-center justify-center gap-2 p-2 sm:px-4 md:px-5 sm:py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        isActive 
                          ? "text-white bg-[#1A1A1A] shadow-md" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                      }`}
                      title={item.name}
                      aria-label={item.name}
                    >
                      <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${isActive && item.lottieSrc ? "brightness-0 invert" : ""}`}>
                        {item.lottieSrc ? (
                          <LottieIcon src={item.lottieSrc} size={item.lottieSize || 30} loop autoplay />
                        ) : (
                          <IconComponent size={20} className="shrink-0" />
                        )}
                      </div>
                      <span className="hidden sm:inline">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right User Actions */}
          <div className="flex items-center gap-3 shrink-0">
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
        warningTitle=""
        warningText=""
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
